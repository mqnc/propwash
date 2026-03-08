import { RAPIER } from './rapier.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

export {GLTFLoader, HDRLoader}

export async function loadResources(config, canvas) {

    // Loaders
    const hdrLoader = new HDRLoader();
    const gltfLoader = new GLTFLoader();
    const audioLoader = new THREE.AudioLoader();

    function waitForClick(target = canvas) {
        return new Promise(resolve => {
            target.addEventListener('click', () => {
                canvas.requestPointerLock()
                document.getElementById('clickLabel').style.display = 'none'
                resolve();
            }, { once: true });
        });
    }

    // physics worker
    const physicsWorker = new Worker("src/physicsworker.js", { type: "module" });
    physicsWorker.onerror = (event) => {
        throw new Error("worker did not start");
    };
    const waitForReady = new Promise(resolve => {
        physicsWorker.addEventListener("message", function handler(e) {
            if (e.data === "ready") {
                physicsWorker.removeEventListener("message", handler);
                resolve(physicsWorker);
            }
        });
    });

    // Load Resources
    let progressList = {}
    let loaderCounter = 0
    function progressCallbackFactory() {
        const loaderId = loaderCounter++
        return (e) => {
            progressList[loaderId] = [e.loaded, e.total]
            if (Object.keys(progressList).length === loaderCounter) {
                let loaded = 0, total = 0
                for (const progress of Object.values(progressList)) {
                    // loaded can be bigger than total... :/
                    loaded += Math.min(progress[0], progress[1])
                    total += progress[1]
                }
                document.getElementById('progress').style.height = `${100 * loaded / total}%`
            }
        }
    }

    let [
        workerReady,
        droneModel,
        propWav,
        checkpointWav,
        terrainModel,
        bgMap,
        envMap,
        musicWav,
        clicked
    ] = await Promise.all([
        /* workerReady = */ waitForReady,
        /* droneModel = */ gltfLoader.loadAsync(config.aircraft.model.path, progressCallbackFactory()),
        /* propWav = */ audioLoader.loadAsync(config.aircraft.propSound.path, progressCallbackFactory()),
        /* checkpointWav = */ audioLoader.loadAsync(config.map.mission.checkpointSound.path, progressCallbackFactory()),
        /* terrainModel = */ gltfLoader.loadAsync(config.map.model.path, progressCallbackFactory()),
        /* bgMap = */ hdrLoader.loadAsync(config.background.backgroundMap.path, progressCallbackFactory()),
        /* envMap = */ hdrLoader.loadAsync(config.background.environmentMap.path, progressCallbackFactory()),
        /* musicWav = */ audioLoader.loadAsync(config.background.music.path, progressCallbackFactory()),
        /* clicked = */ waitForClick()
    ])

    return {
        physicsWorker,
        droneModel,
        propWav,
        checkpointWav,
        terrainModel,
        bgMap,
        envMap,
        musicWav
    }
}
