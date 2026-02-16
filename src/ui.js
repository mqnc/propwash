import Stats from 'three/addons/libs/stats.module.js';

export function createStats() {
    const engineStats = new Stats()
    engineStats.showPanel(0)
    engineStats.dom.style.cssText = 'position:absolute;top:10px;left:100px;';
    document.body.appendChild(engineStats.dom)

    const graphicsStats = new Stats()
    graphicsStats.showPanel(0)
    graphicsStats.dom.style.cssText = 'position:absolute;top:10px;left:10px;';
    document.body.appendChild(graphicsStats.dom)

    return {
        engineStats,
        graphicsStats
    }
}