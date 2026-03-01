import { RAPIER } from './rapier.js'
import { createDroneBody } from './dronebody.js'
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

    // setup stuff
    const config = await receive("config")

    const world = new RAPIER.World({ x: config.map.gravity[0], y: config.map.gravity[1], z: config.map.gravity[2] });
    world.timestep = dt * config.map.timeScale

    const droneBody = createDroneBody(config, world)

    const terrain = await receive("terrain")
    for (const part of terrain) {
        const trimeshDesc = RAPIER.ColliderDesc.trimesh(
            new Float32Array(part.vertices),
            new Uint16Array(part.faces)
        );
        world.createCollider(trimeshDesc);
    }

    const mockScene = new THREE.Scene()
    const fpv = createCameraAnchor(config.aircraft.camera.firstPerson)
    mockScene.add(fpv.camTarget)
    const tpv = createCameraAnchor(config.aircraft.camera.thirdPerson, true, world, droneBody)
    mockScene.add(tpv.camTarget)

    const controlData = initControls(config, dt)

    let inputs = null
    self.addEventListener("message", (e) => {
        inputs = e.data.inputs
    })

    // run engine

    let ingameTime = 0.0

    world.step()
    let tNextStep = performance.now()
    function stepPhysics() {

        if (inputs) {
            controlDrone(inputs, controlData, droneBody, config, dt)
        }

        world.step()

        const pos = droneBody.translation();
        const rot = droneBody.rotation();
        const dronePosition = new THREE.Vector3(pos.x, pos.y, pos.z)
        const droneQuaternion = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)

        // update camera
        fpv.update(dronePosition, droneQuaternion)
        tpv.update(dronePosition, droneQuaternion)

        // update graphics
        postMessage({
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
            }
        })

        const tNow = performance.now()
        tNextStep = tNextStep + dt * 1000
        tNextStep = Math.max(tNextStep, tNow - 100) // if we lag by more than 0.1s, we slow down
        setTimeout(stepPhysics, clamp(tNextStep - tNow, 0, Infinity))

        ingameTime += dt
    }
    setTimeout(stepPhysics, dt * 1000)


}
main()