
export function initDebugRender() {
    const debugGeometry = new THREE.BufferGeometry();
    const debugMaterial = new THREE.LineBasicMaterial({ vertexColors: true });
    const debugLines = new THREE.LineSegments(debugGeometry, debugMaterial);
    debugLines.renderOrder = 999;
    scene.add(debugLines);

    return debugGeometry
}

export function updateDebugRender(world, debugGeometry) {
    const { vertices, colors } = world.debugRender();

    const positions = new Float32Array(vertices);
    const colorArray = new Float32Array(colors);

    debugGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    debugGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 4));
    debugGeometry.computeBoundingSphere();
}