
export function initDebugRender() {
    const debugGeometry = new THREE.BufferGeometry();
    const debugMaterial = new THREE.LineBasicMaterial({ vertexColors: true });
    const debugLines = new THREE.LineSegments(debugGeometry, debugMaterial);
    debugLines.renderOrder = 999;
    scene.add(debugLines);

    return debugLines
}

export function updateDebugRender(debugLines, vertexBuffer, colorBuffer) {
    const positions = new Float32Array(vertexBuffer);
    const colorArray = new Float32Array(colorBuffer);

    debugLines.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    debugLines.geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 4));
    debugLines.geometry.computeBoundingSphere();
}