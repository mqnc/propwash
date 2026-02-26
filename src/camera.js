
import { THREE } from './three.js'
import { deg } from './utils.js'
import { dt } from './config.js'
import { rpyDegToQuat } from './utils.js'

export function createCameraAnchor(camConfig) {
    // physical position, computed in the worker
    const camTarget = new THREE.Object3D() // follows the drone with first order smoothing
    const camAnchor = new THREE.Object3D() // actual camera pose
    camTarget.add(camAnchor)
    camAnchor.position.set(...camConfig.position)
    camAnchor.quaternion.copy(rpyDegToQuat(camConfig.rollPitchYaw))

    function update(position, quaternion) {
        const alpha = camConfig.timeConstant == 0 ? 1 : 1.0 - Math.exp(-dt / camConfig.timeConstant)
        camTarget.position.lerp(position, alpha)
        camTarget.quaternion.slerp(quaternion, alpha)
    }

    return { camTarget, camAnchor, update }
}

export function createCamera(camConfig) {
    // for rendering
    const halfDiagonal = Math.tan(camConfig.fieldOfView * deg / 2)
    const mount = new THREE.Object3D()
    const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
    mount.add(camera)
    camera.quaternion.set(-0.5, -0.5, 0.5, 0.5) // rotate to match drone coordinate system

    function resize() {
        const aspect = window.innerWidth / window.innerHeight
        const halfVertical = halfDiagonal / Math.sqrt(aspect * aspect + 1)
        const vfov = 2 * Math.atan(halfVertical) / deg
        camera.aspect = aspect;
        camera.fov = vfov;
        camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize)
    resize()

    return { mount, camera }
}