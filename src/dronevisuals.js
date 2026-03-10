
import { THREE } from './three.js'
import { rpyDegToQuat } from './utils.js'
import { DRONE_LAYER } from './renderer.js'
import { onGuiChange } from './gui.js'
import { GLTFLoader } from './resources.js'

export function createDroneVisuals(droneModel, scene, config, gui) {

    let drone = {
        node: new THREE.Object3D(),
        model: null,
        object: null,
        mixer: null,
        updatePose: null,
        updateAnimation: null
    }

    scene.add(drone.node)

    function updateDroneOffset() {
        drone.object.scale.set(...config.aircraft.model.scale)
        drone.object.position.set(...config.aircraft.model.position)
        drone.object.quaternion.copy(rpyDegToQuat(config.aircraft.model.rollPitchYaw))
    }

    function updateDroneModel(model) {
        // heavy memory leakage, but will only be called when tweaking the model and not during normal gameplay
        while (drone.node.children.length) { drone.node.remove(drone.node.children[0]) }
        drone.model = model
        drone.object = model.scene
        drone.object.traverse(o => o.layers.enable(DRONE_LAYER))
        drone.node.add(drone.object)
        drone.mixer = new THREE.AnimationMixer(drone.object);
        drone.model.animations.forEach((clip) => { drone.mixer.clipAction(clip).play(); });
        updateDroneOffset()
    }
    updateDroneModel(droneModel)

    const gltfLoader = new GLTFLoader();
    onGuiChange(gui, ["aircraft.model.path"], (path) => {
        gltfLoader.load(path, (gltf) => {
            updateDroneModel(gltf)
        })
    })
    onGuiChange(gui, [
        "aircraft.model.scale",
        "aircraft.model.position",
        "aircraft.model.rollPitchYaw"
    ], () => {
        updateDroneOffset()
    })

    drone.updatePose = (xyz, qxyzw) => {
        drone.node.position.fromArray(xyz)
        drone.node.quaternion.fromArray(qxyzw)
    }

    drone.updateAnimation = () => {
        drone.mixer.setTime(Math.random() * 1000)
    }

    return drone
}
