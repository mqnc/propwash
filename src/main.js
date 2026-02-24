
import { THREE, RAPIER, loadResources } from './resources.js'
import { initDebugRender, updateDebugRender } from './debug.js'
import { setFromRPYdeg } from './utils.js'
import { keyPressed } from './inputs.js'
import { loadConfig } from './config.js'
import { createStats } from './ui.js'
import { createTerrain } from './terrain.js'
import { createDrone } from './drone.js'
import { initSound } from './sound.js'
import { initControls, controlDrone } from './control.js'
import { createCameras, updateTpvCamera } from './camera.js'
import { clamp } from './utils.js'
import { createGui } from './gui.js'
import { createRenderPipeline } from './renderer.js'

const dt = 1.0 / 100.0; // physics timestep

window.THREE = THREE;

async function main() {

    // load config
    const config = await loadConfig()
    console.assert(config.version == 1.0)
    console.assert(config.aircraft.type == "quadcopter")
    const debug = config.settings.debug

    // gui
    //createGui(config)

    // scene
    const scene = new THREE.Scene();
    window.scene = scene
    scene.background = new THREE.Color(0x87ceeb);
    if (debug) { scene.add(new THREE.AxesHelper(1)); }
    const gVector = new THREE.Vector3(...config.map.gravity)
    THREE.Object3D.DEFAULT_UP = gVector.clone().multiplyScalar(-1).normalize()
    const droneStencilScene = new THREE.Scene()

    // renderer
    const { render, canvas } = createRenderPipeline(config, scene)

    // resources
    const { rapier, droneModel, propWav, terrainModel, bgMap, envMap, musicWav } = await loadResources(config, canvas)
    document.getElementById('battery').style.display = 'none'

    // capture mouse
    canvas.addEventListener("click", e => {
        if (e.button !== 0) return;

        if (document.pointerLockElement === null) {
            canvas.requestPointerLock();
        } else {
            document.exitPointerLock();
        }
    });

    // stats
    const { engineStats, graphicsStats } = createStats()

    // lighting
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;
    setFromRPYdeg(scene.environmentRotation, config.background.environmentMap.rollPitchYaw);
    bgMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = bgMap;
    setFromRPYdeg(scene.backgroundRotation, config.background.backgroundMap.rollPitchYaw);

    // rapier world
    const world = new RAPIER.World({ x: config.map.gravity[0], y: config.map.gravity[1], z: config.map.gravity[2] });
    world.timestep = dt * config.map.timeScale

    // drone
    const { droneBody, droneNode, droneSize, droneInertia, droneMixer } = createDrone(droneModel, config, scene, world)
    window.droneNode = droneNode

    // cameras
    const { fpvCamera, fpvCamTiltJoint, tpvCamera, tpvData, tpvCamTarget, tpvCamTiltJoint } = createCameras(config, scene, droneNode)
    let selectedCamera = config.aircraft.camera.selected === "firstPerson" ? fpvCamera : tpvCamera

    // debug
    const debugGeometry = initDebugRender()

    // trrain
    const terrainObject = createTerrain(terrainModel, config, scene, world)

    // sound
    const soundData = initSound(config, tpvCamera, droneNode, propWav, musicWav)

    // flight controls and physics
    const controlData = initControls(config, dt)

    // run engine
    world.step()
    let tNextStep = performance.now()
    function stepPhysics() {

        controlDrone(controlData, droneBody, droneInertia, soundData, config, dt)

        world.step()

        // update drone mesh
        const pos = droneBody.translation();
        const rot = droneBody.rotation();
        droneNode.position.set(pos.x, pos.y, pos.z);
        droneNode.quaternion.set(rot.x, rot.y, rot.z, rot.w);

        updateTpvCamera(tpvCamTarget, tpvData, droneNode, dt)
        engineStats.update()
        const tNow = performance.now()
        tNextStep = tNextStep + dt * 1000
        tNextStep = Math.max(tNextStep, tNow - 100) // if we lag by more than 0.1s, we slow down
        setTimeout(stepPhysics, clamp(tNextStep - tNow, 0, Infinity))
    }
    setTimeout(stepPhysics, dt * 1000)

    // run graphics
    function animate() {
        requestAnimationFrame(animate);
        if (debug) { updateDebugRender(world, debugGeometry) }
        droneMixer.setTime(Math.random() * 1000)

        if (keyPressed[' ']) {
            keyPressed[' '] = false
            selectedCamera = selectedCamera === tpvCamera ? fpvCamera : tpvCamera
        }

        render(selectedCamera)
        graphicsStats.update()
    }

    animate();

}
main()
