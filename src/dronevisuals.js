
import { THREE } from './three.js'
import { rpyDegToQuat } from './utils.js'

import { DRONE_LAYER } from './renderer.js'

export function createDroneVisuals(droneModel, config, scene) {

    let droneSize = config.aircraft.boundingBox.size

    let droneNode = new THREE.Object3D()
    scene.add(droneNode)

    let droneObject = droneModel.scene
    droneObject.scale.set(...config.aircraft.model.scale)
    droneObject.position.set(...config.aircraft.model.position)
    droneObject.quaternion.copy(rpyDegToQuat(config.aircraft.model.rollPitchYaw))
    droneNode.add(droneObject);
    droneObject.traverse(o => o.layers.enable(DRONE_LAYER));
    if (config.settings.debug) { droneNode.add(new THREE.AxesHelper(0.1)); }

    if (config.settings.debug) {
        const droneBox = new THREE.Mesh(
            new THREE.BoxGeometry(...droneSize),
            new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 })
        );
        droneBox.position.set(...config.aircraft.boundingBox.position)
        droneNode.add(droneBox);
    }

    const droneMixer = new THREE.AnimationMixer(droneObject);
    droneModel.animations.forEach((clip) => { droneMixer.clipAction(clip).play(); });

    return { droneNode, droneSize, droneMixer }
}