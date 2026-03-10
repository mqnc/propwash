
import { RAPIER } from './rapier.js'
import { rpyDegToQuat } from './utils.js'

export function calcDrownInertia(config) {

    const [w, h, d] = config.aircraft.boundingBox.size;
    const droneSize = [w, h, d]
    const m = config.aircraft.mass;
    // we just use bounding box for inertia; tilt rates are controlled anyway TODO: because of max torque (from max thrust) this actually has an effect
    const ixx = 1 / 12 * m * (h * h + d * d);
    const iyy = 1 / 12 * m * (w * w + d * d);
    const izz = 1 / 12 * m * (w * w + h * h);

    return [ixx, iyy, izz]
}

export function createDroneBody(config, world) {

    const [ixx, iyy, izz] = calcDrownInertia(config)

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

    const [w, h, d] = config.aircraft.boundingBox.size;
    let droneDesc = RAPIER.ColliderDesc
        .cuboid(w / 2, h / 2, d / 2)
        .setTranslation(...config.aircraft.boundingBox.position)
        .setDensity(0);

    world.createCollider(droneDesc, droneBody);

    return droneBody
}

export function updateDroneBody(droneBody, config) {
    const [ixx, iyy, izz] = calcDrownInertia(config)
    droneBody.setAdditionalMassProperties(
        config.aircraft.mass,
        { x: 0.0, y: 0.0, z: 0.0 },
        { x: ixx, y: iyy, z: izz, },
        { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }
    )
    const [w, h, d] = config.aircraft.boundingBox.size;
    droneBody.collider(0).setHalfExtents({ x: w / 2, y: h / 2, z: d / 2 })
    const [x, y, z] = config.aircraft.boundingBox.position
    droneBody.collider(0).setTranslationWrtParent({ x, y, z })
}