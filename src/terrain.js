
import { THREE } from './three.js'
import { rpyDegToQuat } from './utils.js'

export function createTerrain(terrainModel, config, scene) {
    let terrainObject = terrainModel.scene
    scene.add(terrainObject);
    terrainObject.position.set(...config.map.model.position)
    terrainObject.quaternion.copy(rpyDegToQuat(config.map.model.rollPitchYaw))
    terrainObject.scale.set(...config.map.model.scale)

    let terrainMeshData = []

    terrainObject.updateWorldMatrix(true, true);
    terrainObject.traverse((child) => {
        // extract geometry for physics

        if (!child.isMesh) return;

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

        const faces = new Uint16Array(indexAttr.array)

        terrainMeshData.push({ vertices:vertices.buffer, faces:faces.buffer })
    });

    return { terrainObject, terrainMeshData }
}