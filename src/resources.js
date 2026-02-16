//import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
import RAPIER from 'https://cdn.skypack.dev/pin/@dimforge/rapier3d-compat@v0.19.3-Hmo5REaX4aU99UROofMk/mode=imports,min/optimized/@dimforge/rapier3d-compat.js'
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

export { THREE, RAPIER }

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
        rapier,
        droneModel,
        propWav,
        terrainModel,
        bgMap,
        envMap,
        musicWav,
        clicked
    ] = await Promise.all([
        /* rapier = */ RAPIER.init(),
        /* droneModel = */ gltfLoader.loadAsync(config.aircraft.model.path, progressCallbackFactory()),
        /* propWav = */ audioLoader.loadAsync(config.aircraft.propSound.path, progressCallbackFactory()),
        /* terrainModel = */ gltfLoader.loadAsync(config.map.model.path, progressCallbackFactory()),
        /* bgMap = */ hdrLoader.loadAsync(config.background.backgroundMap.path, progressCallbackFactory()),
        /* envMap = */ hdrLoader.loadAsync(config.background.environmentMap.path, progressCallbackFactory()),
        /* musicWav = */ audioLoader.loadAsync(config.background.music.path, progressCallbackFactory()),
        /* clicked = */ waitForClick()
    ])

    return {
        rapier,
        droneModel,
        propWav,
        terrainModel,
        bgMap,
        envMap,
        musicWav
    }
}
