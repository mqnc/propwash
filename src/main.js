
import { loadResources } from './resources.js'
import { THREE } from './three.js'
import { initDebugRender, updateDebugRender } from './debug.js'
import { setFromRPYdeg } from './utils.js'
import { keyPressed } from './inputs.js'
import { loadConfig, dt } from './config.js'
import { createStats } from './ui.js'
import { createTerrain } from './terrain.js'
import { createDroneVisuals } from './dronevisuals.js'
import { initSound, updateSound } from './sound.js'
import { createCamera } from './camera.js'
import { createGui } from './gui.js'
import { createRenderPipeline } from './renderer.js'
import { readInputs } from './inputs.js'

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
    const { physicsWorker, droneModel, propWav, terrainModel, bgMap, envMap, musicWav } = await loadResources(config, canvas)
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

    // drone
    const { droneNode, droneSize, droneMixer } = createDroneVisuals(droneModel, config, scene)
    window.droneNode = droneNode

    // cameras
    const fpv = createCamera(config.aircraft.camera.firstPerson)
    scene.add(fpv.mount)
    const tpv = createCamera(config.aircraft.camera.thirdPerson)
    scene.add(tpv.mount)
    let selectedCamera = config.aircraft.camera.selected === "firstPerson" ? fpv.camera : tpv.camera

    // physics world
    physicsWorker.postMessage({ "config": config })
    physicsWorker.addEventListener("message", (e) => {
        droneNode.position.fromArray(e.data.drone.xyz)
        droneNode.quaternion.fromArray(e.data.drone.qxyzw)
        fpv.mount.position.fromArray(e.data.fpvCamera.xyz)
        fpv.mount.quaternion.fromArray(e.data.fpvCamera.qxyzw)
        tpv.mount.position.fromArray(e.data.tpvCamera.xyz)
        tpv.mount.quaternion.fromArray(e.data.tpvCamera.qxyzw)
        engineStats.update()
    })

    // debug
    const debugGeometry = initDebugRender()

    // trrain
    const { terrainObject, terrainMeshData } = createTerrain(terrainModel, config, scene)
    physicsWorker.postMessage({ "terrain": terrainMeshData }, terrainMeshData.flatMap(({ vertices, faces }) => [vertices, faces]))

    // sound
    const soundData = initSound(config, tpv.camera, droneNode, propWav, musicWav)

    // run graphics
    function animate() {
        requestAnimationFrame(animate);
        if (debug) { updateDebugRender(world, debugGeometry) }
        droneMixer.setTime(Math.random() * 1000)

        if (keyPressed[' ']) {
            keyPressed[' '] = false
            selectedCamera = selectedCamera === tpv.camera ? fpv.camera : tpv.camera
        }

        const inputs = readInputs()
        physicsWorker.postMessage({ inputs })
        updateSound(soundData, inputs)

        render(selectedCamera)
        graphicsStats.update()
    }

    animate();

}
main()
