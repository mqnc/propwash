
import { THREE, RAPIER } from './resources.js'
import { rpyDegToQuat } from './utils.js'

export function createTerrain(terrainModel, config, scene, world) {
    let terrainObject = terrainModel.scene
    scene.add(terrainObject);
    terrainObject.position.set(...config.map.model.position)
    terrainObject.quaternion.copy(rpyDegToQuat(config.map.model.rollPitchYaw))
    terrainObject.scale.set(...config.map.model.scale)

    terrainObject.updateWorldMatrix(true, true);
    terrainObject.traverse((child) => {
        // extract geometry for physics

        if (!child.isMesh) return;

        const geom = child.geometry;
        const posAttr = geom.attributes.position;
        const indexAttr = geom.index;

        const worldMatrix = child.matrixWorld;
        const v = new THREE.Vector3();

        const worldPositions = new Float32Array(posAttr.count * 3);

        for (let i = 0; i < posAttr.count; i++) {
            v.fromBufferAttribute(posAttr, i);
            v.applyMatrix4(worldMatrix);

            worldPositions[i * 3 + 0] = v.x;
            worldPositions[i * 3 + 1] = v.y;
            worldPositions[i * 3 + 2] = v.z;
        }

        const indices = indexAttr ? indexAttr.array : undefined;

        const trimeshDesc = RAPIER.ColliderDesc.trimesh(worldPositions, indices);
        world.createCollider(trimeshDesc);
    });

    return terrainObject
}