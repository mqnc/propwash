
import { THREE, RAPIER } from './resources.js'
import { rpyDegToQuat } from './utils.js'

import { DRONE_LAYER } from './renderer.js'

export function createDrone(droneModel, config, scene, world) {

    const [w, h, d] = config.aircraft.boundingBox.size;
    const droneSize = [w, h, d]
    const m = config.aircraft.mass;
    // we just use bounding box for inertia; tilt rates are controlled anyway
    const ixx = 1 / 12 * m * (h * h + d * d);
    const iyy = 1 / 12 * m * (w * w + d * d);
    const izz = 1 / 12 * m * (w * w + h * h);
    const droneInertia = [ixx, iyy, izz]

    const droneBody = world.createRigidBody(
        new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic)
            .setTranslation(...config.map.spawn.position)
            .setRotation(rpyDegToQuat(config.map.spawn.rollPitchYaw))
            .setAdditionalMassProperties(
                config.aircraft.mass,
                { x: 0.0, y: 0.0, z: 0.0 },
                { x: ixx, y: iyy, z: izz, },
                { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }
            )
    );

    droneBody.setLinearDamping(0.0);
    droneBody.setAngularDamping(0.0);

    let droneDesc = RAPIER.ColliderDesc
        .cuboid(droneSize[0] / 2, droneSize[1] / 2, droneSize[2] / 2)
        .setTranslation(...config.aircraft.boundingBox.position)
        .setDensity(0);

    const droneCollider = world.createCollider(droneDesc, droneBody);

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

    return { droneBody, droneNode, droneSize, droneInertia, droneMixer }
}