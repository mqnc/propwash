
import { THREE } from './resources.js'
import { deg } from './utils.js'

export function createCameras(config, scene, droneNode) {
    const tpvData = config.aircraft.camera.thirdPerson;
    const tpvCamTarget = new THREE.Object3D() // follows the drone with first order smoothing
    const tpvCamTiltJoint = new THREE.Object3D() // tilts camera up and down
    scene.add(tpvCamTarget)
    tpvCamTarget.add(tpvCamTiltJoint)
    const tpvHalfDiagonal = Math.tan(tpvData.fieldOfView * deg / 2)
    const tpvCamera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
    tpvCamera.position.set(-tpvData.distance, 0, 0)
    tpvCamera.quaternion.set(-0.5, -0.5, 0.5, 0.5)
    tpvCamTiltJoint.add(tpvCamera)
    tpvCamTiltJoint.rotation.y = tpvData.tilt * deg

    const fpvData = config.aircraft.camera.firstPerson;
    const fpvCamTiltJoint = new THREE.Object3D() // tilts camera up and down
    droneNode.add(fpvCamTiltJoint)
    const fpvHalfDiagonal = Math.tan(fpvData.fieldOfView * deg / 2)
    const fpvCamera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
    fpvCamera.position.set(...fpvData.position)
    fpvCamera.quaternion.set(-0.5, -0.5, 0.5, 0.5)
    fpvCamTiltJoint.add(fpvCamera)
    fpvCamTiltJoint.rotation.y = fpvData.tilt * deg

    function resizeCameras() {
        const aspect = window.innerWidth / window.innerHeight

        const tpvHalfVertical = tpvHalfDiagonal / Math.sqrt(aspect * aspect + 1)
        const tpvVFOV = 2 * Math.atan(tpvHalfVertical) / deg
        tpvCamera.aspect = aspect;
        tpvCamera.fov = tpvVFOV;
        tpvCamera.updateProjectionMatrix();

        const fpvHalfVertical = fpvHalfDiagonal / Math.sqrt(aspect * aspect + 1)
        const fpvVFOV = 2 * Math.atan(fpvHalfVertical) / deg
        fpvCamera.aspect = aspect;
        fpvCamera.fov = fpvVFOV;
        fpvCamera.updateProjectionMatrix();
    }
    resizeCameras()
    window.addEventListener('resize', () => { resizeCameras() });

    return { fpvCamera, fpvCamTiltJoint, tpvCamera, tpvData, tpvCamTarget, tpvCamTiltJoint }
}

export function updateTpvCamera(tpvCamTarget, tpvData, droneNode, dt) {
    const alpha = 1.0 - Math.exp(-dt / tpvData.timeConstant)
    tpvCamTarget.position.lerp(droneNode.position, alpha)
    tpvCamTarget.quaternion.slerp(droneNode.quaternion, alpha)
}
