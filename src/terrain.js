
import { THREE } from './three.js'
import { rpyDegToQuat } from './utils.js'

export function createTerrain(terrainModel, config, scene) {
    let terrainObject = terrainModel.scene
    scene.add(terrainObject);
    terrainObject.position.set(...config.map.model.position)
    terrainObject.quaternion.copy(rpyDegToQuat(config.map.model.rollPitchYaw))
    terrainObject.scale.set(...config.map.model.scale)

    let terrainMeshData = []
    let checkpoints = {}

    terrainObject.updateWorldMatrix(true, true);
    terrainObject.traverse((child) => {
        // extract geometry for physics

        if (!child.isMesh) return;

        let isSensor = false;

        for (const regex of config.map.mission.exclude) {
            if (child.name.match(regex)) {
                child.visible = false
                return
            }
        }

        if (config.map.mission.type === "race") {
            if (config.map.mission.checkpoints.includes(child.name)) {
                isSensor = true
                checkpoints[child.name] = child
                child.scale.multiplyScalar(config.map.mission.checkpointScale)
                terrainObject.updateWorldMatrix(false, true);
                child.traverse((checkpointChild) => {
                    checkpointChild.material = checkpointChild.material.clone()
                    checkpointChild.material.transparent = true
                    checkpointChild.material.userData.originalOpacity = checkpointChild.material.opacity
                })
            }
        }

        const geom = child.geometry;
        const posAttr = geom.attributes.position;
        const indexAttr = geom.index;

        const worldMatrix = child.matrixWorld;
        const v = new THREE.Vector3();

        const vertices = new Float32Array(posAttr.count * 3);

        for (let i = 0; i < posAttr.count; i++) {
            v.fromBufferAttribute(posAttr, i);
            v.applyMatrix4(worldMatrix);

            vertices[i * 3 + 0] = v.x;
            vertices[i * 3 + 1] = v.y;
            vertices[i * 3 + 2] = v.z;
        }

        const faces = new Uint32Array(indexAttr.array)

        terrainMeshData.push({
            name: child.name,
            vertices: vertices.buffer,
            faces: faces.buffer,
            isSensor
        })
    });

    const setActiveCheckpoints = (active) => {
        for (const cpMesh of Object.values(checkpoints)) {
            cpMesh.traverse((checkpointChild) => {
                checkpointChild.material.opacity = checkpointChild.material.userData.originalOpacity * 0.18
            })
        }
        for (const cpName of active) {
            checkpoints[cpName].traverse((checkpointChild) => {
                checkpointChild.material.opacity = checkpointChild.material.userData.originalOpacity
            })
        }
    }

    return { terrainObject, terrainMeshData, setActiveCheckpoints }
}
