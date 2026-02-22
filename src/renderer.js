

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
// import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
// import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

import { deg } from './utils.js'

export function createRenderPipeline(config, scene) {
    const renderer = new THREE.WebGLRenderer();
    const canvas = renderer.domElement;
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    document.body.appendChild(canvas);

    const composer = new EffectComposer(renderer)

    const renderPass = new RenderPass(scene, null)
    composer.addPass(renderPass)
    //const ssaoPass = new SSAOPass(scene, new THREE.PerspectiveCamera());
    //ssaoPass.output = SSAOPass.OUTPUT.SSAO
    //composer.addPass(ssaoPass);
    if (config.settings.antiAlias) {
        composer.addPass(new FXAAPass())
    }
    const fisheyePass = createFisheyePass()
    composer.addPass(fisheyePass)
    //const afterimagePass = new AfterimagePass(0.5);
    //composer.addPass(afterimagePass);
    composer.addPass(new OutputPass())

    function updateFisheye(camera) {
        fisheyePass.uniforms.height.value = Math.tan(camera.fov / 2 * deg)
        fisheyePass.uniforms.aspectRatio.value = camera.aspect
    }

    function onResize() {
        composer.setSize(
            window.innerWidth * config.settings.composerResolutionScale,
            window.innerHeight * config.settings.composerResolutionScale
        )
        renderer.setSize(
            window.innerWidth * config.settings.rendererResolutionScale,
            window.innerHeight * config.settings.rendererResolutionScale,
            false
        );
    }
    window.addEventListener('resize', onResize);
    onResize()

    return { renderPass, renderer, composer, canvas, updateFisheye }
}

function createFisheyePass() {

    // https://www.decarpentier.nl/lens-distortion

    return new ShaderPass({
        uniforms: {
            "tDiffuse": { type: "t", value: null },
            "strength": { type: "f", value: 1 },
            "height": { type: "f", value: 1 },
            "aspectRatio": { type: "f", value: 1 },
            "cylindricalRatio": { type: "f", value: 1 }
        },
        vertexShader: `
            uniform float strength;           // s: 0 = perspective, 1 = stereographic
            uniform float height;             // h: tan(verticalFOVInRadians / 2)
            uniform float aspectRatio;        // a: screenWidth / screenHeight
            uniform float cylindricalRatio;   // c: cylindrical distortion ratio. 1 = spherical

            varying vec3 vUV;                 // output to interpolate over screen
            varying vec2 vUVDot;              // output to interpolate over screen

            void main() {
                gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));

                float scaledHeight = strength * height;
                float cylAspectRatio = aspectRatio * cylindricalRatio;
                float aspectDiagSq = aspectRatio * aspectRatio + 1.0;
                float diagSq = scaledHeight * scaledHeight * aspectDiagSq;
                vec2 signedUV = (2.0 * uv + vec2(-1.0, -1.0));

                float z = 0.5 * sqrt(diagSq + 1.0) + 0.5;
                float ny = (z - 1.0) / (cylAspectRatio * cylAspectRatio + 1.0);

                vUVDot = sqrt(ny) * vec2(cylAspectRatio, 1.0) * signedUV;
                vUV = vec3(0.5, 0.5, 1.0) * z + vec3(-0.5, -0.5, 0.0);
                vUV.xy += uv;
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;     // sampler of rendered scene’s render target
            varying vec3 vUV;               // interpolated vertex output data
            varying vec2 vUVDot;            // interpolated vertex output data

            void main() {
                vec3 uv = dot(vUVDot, vUVDot) * vec3(-0.5, -0.5, -1.0) + vUV;
                gl_FragColor = texture2DProj(tDiffuse, uv);
            }
        `
    });
}
