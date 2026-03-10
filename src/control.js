
import { THREE } from './three.js'
import { RAPIER } from './rapier.js'
import { inch, deg, clamp, lerp, rpyDegToQuat } from './utils.js'
import { calcDrownInertia } from './dronebody.js'
// import { readInputs } from './inputs.js'
// import { updateSound } from './sound.js'

export function initControls(config) {

    const g = Math.sqrt(
        Math.pow(config.map.gravity[0], 2)
        + Math.pow(config.map.gravity[1], 2)
        + Math.pow(config.map.gravity[2], 2)
    )

    const droneInertia = calcDrownInertia(config)

    const maxSingleMotorThrust = config.aircraft.maxCombinedThrust / 4
    const lever = config.aircraft.wheelbase * 0.5 * Math.SQRT1_2 // from center of mass to motor along x or y
    const maxMotorDrag = 0.07 * maxSingleMotorThrust * (config.aircraft.propSize * inch) // according to ChatGPT

    const controlData = {
        droneInertia,
        maxPitchRollTorque: 4 * lever * maxSingleMotorThrust,
        //maxYawTorque: 2 * (config.aircraft.wheelbase / 2) * maxMotorDrag,
        maxYawTorque: 4 * lever * maxSingleMotorThrust, // TODO: not realistic
        hoverThrottle: g * config.aircraft.mass / config.aircraft.maxCombinedThrust,
    }

    return controlData
}

export function controlDrone(inputs, controlData, droneBody, trace, config, dt) {

    const {
        droneInertia,
        maxPitchRollTorque,
        maxYawTorque,
        hoverThrottle
    } = controlData

    const [ixx, iyy, izz] = droneInertia

    trace.nextCheckpoint--
    if (trace.nextCheckpoint <= 0) {
        trace.nextCheckpoint = Math.ceil(0.5 / dt)
        trace.checkpoints.push([droneBody.translation(), droneBody.rotation()])
        if (trace.checkpoints.length > 3600) { trace.checkpoints.shift() }
    }

    const { throttleInput, rollInput, pitchInput, yawInput, reset } = inputs

    if (reset) {
        droneBody.resetForces(true);
        droneBody.resetTorques(true);
        droneBody.setLinvel({ x: 0, y: 0, z: 0 });
        droneBody.setAngvel({ x: 0, y: 0, z: 0 });
        if (trace.checkpoints.length >= 2) {
            const [t, r] = trace.checkpoints[trace.checkpoints.length - 2]
            droneBody.setTranslation(t);
            droneBody.setRotation(r);
            trace.checkpoints.pop()
            trace.checkpoints.pop()
        }
        else {
            droneBody.setTranslation(
                { x: config.map.spawn.position[0], y: config.map.spawn.position[1], z: config.map.spawn.position[2] }
            );
            droneBody.setRotation(rpyDegToQuat(config.map.spawn.rollPitchYaw))
        }
        return
    }

    // make it so that the drone hovers when the stick is in the middle
    let throttle;
    if (throttleInput <= 0.5) {
        throttle = throttleInput * 2 * hoverThrottle
    }
    else {
        throttle = hoverThrottle + (throttleInput * 2 - 1) * (1 - hoverThrottle)
    }

    const rotation = droneBody.rotation();
    const q = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    const qInv = q.clone().invert();

    const linvel = droneBody.linvel();
    const angvel = droneBody.angvel();
    const localLinearVelocity = new THREE.Vector3(linvel.x, linvel.y, linvel.z).applyQuaternion(qInv);
    const localAngularVelocity = new THREE.Vector3(angvel.x, angvel.y, angvel.z).applyQuaternion(qInv);

    let localTargetAngularVelocity = new THREE.Vector3(
        rollInput * config.aircraft.maxRollRate * deg,
        pitchInput * config.aircraft.maxPitchRate * deg,
        yawInput * config.aircraft.maxYawRate * deg,
    );

    if (config.aircraft.angleLimit < 180 || config.aircraft.stabilization > 0) {
        const gInDroneFrame = new THREE.Vector3(...config.map.gravity).normalize().applyQuaternion(qInv)
        const polarAngle = Math.acos(clamp(gInDroneFrame.z, -1, 1))

        let restoreAxis = new THREE.Vector3(gInDroneFrame.y, -gInDroneFrame.x, 0).normalize()
        let restoreAmount = 0

        if (config.aircraft.angleLimit < 180) {
            let factor = 0;
            if (
                polarAngle > config.aircraft.angleLimit * 0.9 * deg
                && polarAngle < config.aircraft.angleLimit * 1.1 * deg
            ) {
                factor = lerp(polarAngle, config.aircraft.angleLimit * 0.9 * deg, config.aircraft.angleLimit * deg * 1.1, 0, 1)
            }
            else if (polarAngle > config.aircraft.angleLimit * 1.1 * deg) {
                factor = 1
            }
            restoreAmount += clamp(localTargetAngularVelocity.dot(restoreAxis) * factor, 0, Infinity)
        }

        if (config.aircraft.stabilization > 0) {
            restoreAmount += polarAngle * config.aircraft.stabilization
        }

        localTargetAngularVelocity.addScaledVector(restoreAxis, -restoreAmount)
    }



    const localForce = new RAPIER.Vector3(0, 0, -throttle * config.aircraft.maxCombinedThrust);
    const localTorque = new RAPIER.Vector3(
        (localTargetAngularVelocity.x - localAngularVelocity.x) * ixx / config.aircraft.rollTimeConstant,
        (localTargetAngularVelocity.y - localAngularVelocity.y) * iyy / config.aircraft.pitchTimeConstant,
        (localTargetAngularVelocity.z - localAngularVelocity.z) * izz / config.aircraft.yawTimeConstant,
    );

    if (Math.abs(localTorque.x) > maxPitchRollTorque) { localTorque.x = maxPitchRollTorque * Math.sign(localTorque.x) }
    if (Math.abs(localTorque.y) > maxPitchRollTorque) { localTorque.y = maxPitchRollTorque * Math.sign(localTorque.y) }
    if (Math.abs(localTorque.z) > maxYawTorque) { localTorque.z = maxYawTorque * Math.sign(localTorque.z) }

    const thrustForce = new THREE.Vector3(localForce.x, localForce.y, localForce.z).applyQuaternion(q);
    const thrustTorque = new THREE.Vector3(localTorque.x, localTorque.y, localTorque.z).applyQuaternion(q);

    const [vx, vy, vz] = localLinearVelocity.toArray();
    const d = config.aircraft.dragForceOverSpeed
    const d2 = config.aircraft.dragForceOverSpeedSquared
    const dragForce = new THREE.Vector3(
        -d[0] * vx - d2[0] * vx * Math.abs(vx),
        -d[1] * vy - d2[1] * vy * Math.abs(vy),
        -d[2] * vz - d2[2] * vz * Math.abs(vz),
    ).applyQuaternion(q);

    droneBody.resetForces(true);
    droneBody.resetTorques(true);

    droneBody.addForce(new RAPIER.Vector3(thrustForce.x, thrustForce.y, thrustForce.z), true);
    droneBody.addTorque(new RAPIER.Vector3(thrustTorque.x, thrustTorque.y, thrustTorque.z), true);
    droneBody.addForce(new RAPIER.Vector3(dragForce.x, dragForce.y, dragForce.z), true);

}
