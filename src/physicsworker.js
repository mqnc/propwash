import { RAPIER } from './rapier.js'
import { createDroneBody, updateDroneBody } from './dronebody.js'
import { dt } from './config.js'
import { clamp } from './utils.js'
import { initControls, controlDrone } from './control.js'

import { THREE } from './three.js'
import { createCameraAnchor } from './camera.js'

async function main() {

    console.log("worker started")

    // init physics
    await RAPIER.init();

    // signal window
    postMessage("ready")

    // await specific message
    function receive(fieldName) {
        return new Promise(resolve => {
            function handler(e) {
                if (fieldName in e.data) {
                    self.removeEventListener("message", handler);
                    resolve(e.data[fieldName]);
                }
            }
            self.addEventListener("message", handler);
        });
    }

    // config
    const config = await receive("config")
    const configListeners = []
    function onConfigUpdate(callback, immediate = false) {
        configListeners.push(callback)
        callback()
    }
    function triggerConfigUpdate() { for (const cb of configListeners) { cb() } }

    // world
    const world = new RAPIER.World({ x: config.map.gravity[0], y: config.map.gravity[1], z: config.map.gravity[2] });
    onConfigUpdate(() => { world.timestep = dt * config.map.timeScale }, true)

    // drone
    const droneBody = createDroneBody(config, world)
    onConfigUpdate(() => { updateDroneBody(droneBody, config) })

    // terrain
    const terrain = await receive("terrain")
    const colliderNames = new Map()
    for (const part of terrain) {
        const trimeshDesc = RAPIER.ColliderDesc.trimesh(
            new Float32Array(part.vertices),
            new Uint32Array(part.faces)
        );
        if (part.isSensor) {
            trimeshDesc.setSensor(true)
        }
        const collider = world.createCollider(trimeshDesc);
        colliderNames.set(collider, part.name)
    }

    // cameras
    const mockScene = new THREE.Scene()
    const fpv = createCameraAnchor(config.aircraft.camera.firstPerson)
    mockScene.add(fpv.camTarget)
    const tpv = createCameraAnchor(config.aircraft.camera.thirdPerson, true, world, droneBody)
    mockScene.add(tpv.camTarget)

    // inputs
    let controlData
    onConfigUpdate(() => { controlData = initControls(config, dt) }, true)
    let trace = {
        checkpoints: [], // for backtracking when stuck
        nextCheckpoint: Math.ceil(0.5 / dt) // number of steps til next checkpoint
    }
    let inputs = null
    let debug = false
    let firstDebugMessage = true
    self.addEventListener("message", (e) => {
        if (Object.hasOwn(e.data, "inputs")) {
            inputs = e.data.inputs
            debug = e.data.debug
        }
        else if (Object.hasOwn(e.data, "config")) {
            Object.assign(config, e.data.config) // config reference still works, all child references are not updated
            triggerConfigUpdate()
        }
    })

    // game logic
    // a bit unelegant but as the game evolves this will surely be refactored, surely!
    let game = { type: config.map.mission.type, finished: false }
    if (game.type === "race") {
        game.checkpoints = config.map.mission.checkpoints
        if (config.map.mission.mode === "random") {
            game.mode = "random"
            game.checkpointsTodo = new Set()
            for (const cp of game.checkpoints) {
                game.checkpointsTodo.add(cp)
            }
            postMessage({ type: "initCheckpoints", active: Array.from(game.checkpointsTodo) })
        }
        else if (config.map.mission.mode === "point-to-point") {
            game.mode = "point-to-point"
            game.activeCheckpoint = game.checkpoints[0]
            postMessage({ type: "initCheckpoints", active: [game.activeCheckpoint] })
        }
        else { // mode must be a {laps:n} object
            game.mode = "laps"
            game.lapsLeft = config.map.mission.mode.laps
            game.activeCheckpoint = game.checkpoints[0]
            postMessage({ type: "initCheckpoints", active: [game.activeCheckpoint] })
        }
    }
    function handleSensorHit(sensorHit) {
        if (game.type === "race") {
            if (game.mode === "random") {
                if (game.checkpointsTodo.delete(sensorHit)) {
                    if (game.checkpointsTodo.size === 0) {
                        game.finished = true
                    }
                    postMessage({
                        type: "checkpoint",
                        active: Array.from(game.checkpointsTodo),
                        finished: game.finished
                    })
                }
            }
            else { // mode === "point-to-point" or "laps"
                if (game.activeCheckpoint === sensorHit) {
                    if (game.activeCheckpoint === game.checkpoints[game.checkpoints.length - 1]) { // last checkpoint
                        if (game.mode === "point-to-point") {
                            game.finished = true
                            game.activeCheckpoint = null
                        }
                        else { // mode === "laps"
                            game.lapsLeft -= 1
                            game.activeCheckpoint = game.checkpoints[0]
                        }
                    }
                    else if ( // first checkpoint after last lap -> finished
                        game.mode === "laps"
                        && game.activeCheckpoint === game.checkpoints[0]
                        && game.lapsLeft === 0
                    ) {
                        game.finished = true
                        game.activeCheckpoint = null
                    }
                    else {
                        game.activeCheckpoint = game.checkpoints[game.checkpoints.indexOf(game.activeCheckpoint) + 1]
                    }
                    postMessage({
                        type: "checkpoint",
                        active: game.activeCheckpoint ? [game.activeCheckpoint] : [],
                        finished: game.finished
                    })
                }
            }
        }
    }

    // run engine
    let ingameTime = 0.0
    let tNextStep = performance.now()
    function stepPhysics() {

        world.step()
        let sensorHit = null
        world.intersectionPairsWith(droneBody.collider(0), (sensorCollider) => {
            const intersecting = world.intersectionPair(droneBody.collider(0), sensorCollider);

            if (intersecting) {
                sensorHit = colliderNames.get(sensorCollider)
                handleSensorHit(sensorHit)
            }
        });

        if (inputs) {
            controlDrone(inputs, controlData, droneBody, trace, config, dt)
        }

        const pos = droneBody.translation();
        const rot = droneBody.rotation();
        const dronePosition = new THREE.Vector3(pos.x, pos.y, pos.z)
        const droneQuaternion = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)

        // update camera
        fpv.update(config.aircraft.camera.firstPerson, dronePosition, droneQuaternion)
        tpv.update(config.aircraft.camera.thirdPerson, dronePosition, droneQuaternion)

        // update graphics
        const message = {
            type: "step",
            wallTime: performance.now(),
            ingameTime: ingameTime,
            drone: {
                xyz: dronePosition.toArray(),
                qxyzw: droneQuaternion.toArray()
            },
            fpvCamera: {
                xyz: fpv.camAnchor.getWorldPosition(new THREE.Vector3()).toArray(),
                qxyzw: fpv.camAnchor.getWorldQuaternion(new THREE.Quaternion()).toArray()
            },
            tpvCamera: {
                xyz: tpv.camAnchor.getWorldPosition(new THREE.Vector3()).toArray(),
                qxyzw: tpv.camAnchor.getWorldQuaternion(new THREE.Quaternion()).toArray()
            },
            debug: { isActive: debug },
        }
        if (debug) {
            let buffers = []
            if (firstDebugMessage) {
                // since the map is likely massive, we only render it once
                const { vertices, colors } = world.debugRender(RAPIER.QueryFilterFlags.ONLY_FIXED)
                message.debug.fixedVertices = vertices.buffer
                message.debug.fixedColors = colors.buffer
                buffers.push(vertices.buffer)
                buffers.push(colors.buffer)
                firstDebugMessage = false
            }
            const { vertices, colors } = world.debugRender(RAPIER.QueryFilterFlags.EXCLUDE_FIXED)
            message.debug.dynamicVertices = vertices.buffer
            message.debug.dynamicColors = colors.buffer
            buffers.push(vertices.buffer)
            buffers.push(colors.buffer)
            postMessage(message, buffers)
        }
        else {
            postMessage(message)
        }

        const tNow = performance.now()
        tNextStep = tNextStep + dt * 1000
        tNextStep = Math.max(tNextStep, tNow - 100) // if we lag by more than 0.1s, we slow down
        setTimeout(stepPhysics, clamp(tNextStep - tNow, 0, Infinity))

        ingameTime += dt
    }
    setTimeout(stepPhysics, dt * 1000)


}
main()