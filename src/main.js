
import { loadResources } from './resources.js'
import { THREE } from './three.js'
import { initDebugRender, updateDebugRender } from './debug.js'
import { setFromRPYdeg } from './utils.js'
import { keyPressed } from './inputs.js'
import { loadConfig, dt } from './config.js'
import { createStats } from './ui.js'
import { createTerrain } from './terrain.js'
import { createDrone } from './drone.js'
import { initSound, updateSound } from './sound.js'
import { createCamera } from './camera.js'
import { createGui, onGuiChange } from './gui.js'
import { createRenderPipeline } from './renderer.js'
import { readInputs } from './inputs.js'

window.THREE = THREE;

async function main() {

    // load config
    const config = await loadConfig()
    console.assert(config.version == 1.0)
    console.assert(config.aircraft.type == "quadcopter")

    // gui
    const gui = createGui(config)

    // scene
    const scene = new THREE.Scene();
    window.scene = scene
    scene.background = new THREE.Color(0x87ceeb);
    const origin = new THREE.AxesHelper(1);
    scene.add(origin);
    onGuiChange(gui, ["settings.debug"], (debug) => { origin.visible = debug }, true)
    const gVector = new THREE.Vector3(...config.map.gravity)
    THREE.Object3D.DEFAULT_UP = gVector.clone().multiplyScalar(-1).normalize()
    scene.visible = false

    // renderer
    const { render, canvas, stepMotionBlurCamera } = createRenderPipeline(config, gui, scene)

    // resources
    let {
        physicsWorker,
        droneModel,
        propWav,
        checkpointWav,
        terrainModel,
        bgMap,
        envMap,
        musicWav
    } = await loadResources(config, canvas)
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
    if (config.map.mission.type === "race") {
        document.getElementById('timer').style.visibility = "visible"
    }

    // lighting
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;
    setFromRPYdeg(scene.environmentRotation, config.background.environmentMap.rollPitchYaw);
    scene.environmentIntensity = config.background.environmentMap.intensity

    bgMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = bgMap;
    setFromRPYdeg(scene.backgroundRotation, config.background.backgroundMap.rollPitchYaw);
    scene.backgroundIntensity = config.background.backgroundMap.intensity

    // drone
    const drone = createDrone(droneModel, scene, config, gui)

    // cameras
    const fpv = createCamera(config.aircraft.camera.firstPerson)
    scene.add(fpv.mount)
    const tpv = createCamera(config.aircraft.camera.thirdPerson)
    scene.add(tpv.mount)
    let selectedCamera = config.aircraft.camera.selected === "firstPerson" ? fpv.camera : tpv.camera

    // sound
    const soundData = initSound(config, tpv.camera, drone.node, propWav, checkpointWav, musicWav)

    // physics world
    let finished = false
    physicsWorker.postMessage({ "config": config })
    physicsWorker.addEventListener("message", (e) => {
        if (e.data.type === "step") {
            scene.visible = true
            drone.updatePose(e.data.drone.xyz, e.data.drone.qxyzw)
            fpv.mount.position.fromArray(e.data.fpvCamera.xyz)
            fpv.mount.quaternion.fromArray(e.data.fpvCamera.qxyzw)
            tpv.mount.position.fromArray(e.data.tpvCamera.xyz)
            tpv.mount.quaternion.fromArray(e.data.tpvCamera.qxyzw)
            fpv.mount.updateMatrixWorld()
            tpv.mount.updateMatrixWorld()
            selectedCamera.updateProjectionMatrix()
            selectedCamera.updateMatrixWorld()
            stepMotionBlurCamera(selectedCamera)
            let t = e.data.ingameTime
            let mins = Math.floor(t / 60)
            let secs = t - mins * 60
            if (!finished) {
                document.getElementById('timer').innerText = `${mins.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`.replace('.', "'")
            }
            fixedDebugLines.visible = e.data.debug.isActive
            dynamicDebugLines.visible = e.data.debug.isActive
            if (e.data.debug.isActive) {
                if (e.data.debug.fixedVertices) {
                    updateDebugRender(fixedDebugLines, e.data.debug.fixedVertices, e.data.debug.fixedColors)
                }
                updateDebugRender(dynamicDebugLines, e.data.debug.dynamicVertices, e.data.debug.dynamicColors)
            }
            engineStats.update()
        }
        else if (e.data.type === "initCheckpoints") {
            setActiveCheckpoints(e.data.active)
        }
        else if (e.data.type === "checkpoint") {
            setActiveCheckpoints(e.data.active)
            finished = e.data.finished
            if (finished) {
                document.getElementById('timer').style.color = "lime"
            }
            soundData.checkpointSound.play()
        }
    })

    // debug
    const fixedDebugLines = initDebugRender()
    const dynamicDebugLines = initDebugRender()

    // trrain
    const { terrainObject, terrainMeshData, setActiveCheckpoints } = createTerrain(terrainModel, config, scene)
    physicsWorker.postMessage({ "terrain": terrainMeshData }, terrainMeshData.flatMap(({ vertices, faces }) => [vertices, faces]))

    // run graphics
    function animate() {
        requestAnimationFrame(animate);
        drone.updateAnimation()

        if (keyPressed[' ']) {
            keyPressed[' '] = false
            selectedCamera = selectedCamera === tpv.camera ? fpv.camera : tpv.camera
        }

        const inputs = readInputs()
        physicsWorker.postMessage({ inputs, debug: config.settings.debug })
        updateSound(soundData, inputs)

        render(selectedCamera)
        graphicsStats.update()
    }

    animate();

}
main()
