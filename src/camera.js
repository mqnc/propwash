
import { THREE } from './three.js'
import { RAPIER } from './rapier.js'
import { deg } from './utils.js'
import { dt } from './config.js'
import { rpyDegToQuat } from './utils.js'

export function createCameraAnchor(camConfig, avoidCollision = false, world = null, ignoreBody = null) {
    // physical position, computed in the worker
    const camTarget = new THREE.Object3D() // follows the drone with first order smoothing
    const camAnchor = new THREE.Object3D() // actual camera pose
    camTarget.add(camAnchor)
    camAnchor.position.set(...camConfig.position)
    camAnchor.quaternion.copy(rpyDegToQuat(camConfig.rollPitchYaw))

    function update(camConfig, dronePosition, droneQuaternion) {
        const alpha = camConfig.poseTimeConstant == 0 ? 1 : 1.0 - Math.exp(-dt / camConfig.poseTimeConstant)
        camTarget.position.lerp(dronePosition, alpha)
        camTarget.quaternion.slerp(droneQuaternion, alpha)

        camAnchor.position.set(...camConfig.position)
        camAnchor.quaternion.copy(rpyDegToQuat(camConfig.rollPitchYaw))

        if (avoidCollision) {
            const ray = new RAPIER.Ray(
                camTarget.position,
                camAnchor.getWorldPosition(new THREE.Vector3()).sub(camTarget.position)
            );

            const maxToi = 1.0;
            const solid = false;

            const hit = world.castRay(ray, maxToi, solid, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, null, null, ignoreBody);
            if (hit != null) {
                const hitPoint = ray.pointAt(hit.timeOfImpact);
                const localHitPoint = camTarget.worldToLocal(new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z));
                camAnchor.position.copy(localHitPoint);
            }
        }
    }

    return { camTarget, camAnchor, update }
}

export function createCamera(camConfig) {
    // for rendering
    const mount = new THREE.Object3D()
    const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
    mount.add(camera)
    camera.quaternion.set(-0.5, -0.5, 0.5, 0.5) // rotate to match drone coordinate system
    camera.userData.fishEyeStrength = camConfig.fishEyeStrength
    camera.userData.exposure = 1 / camConfig.shutterSpeed

    function resize() {
        const aspect = window.innerWidth / window.innerHeight
        const halfDiagonal = Math.tan(camConfig.fieldOfView * deg / 2)
        const halfVertical = halfDiagonal / Math.sqrt(aspect * aspect + 1)
        const vfov = 2 * Math.atan(halfVertical) / deg
        camera.aspect = aspect;
        camera.fov = vfov;
        camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize)
    resize()

    return { mount, camera, resize }
}