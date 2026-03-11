

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
// import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

import { dt } from './config.js'
import { deg } from './utils.js'
import { THREE } from './three.js'

import { onGuiChange } from './gui.js';

export const DRONE_LAYER = 1; // for creating mask stencil for post processing

export function createRenderPipeline(config, gui, scene) {
    const renderer = new THREE.WebGLRenderer();
    const canvas = renderer.domElement;
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    document.body.appendChild(canvas);


    const maskTarget = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        {
            format: THREE.RedFormat,
            type: THREE.UnsignedByteType,
            depthBuffer: true,
            stencilBuffer: false
        }
    );

    const maskMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });

    const composer = new EffectComposer(renderer)
    for (const target of [composer.renderTarget1, composer.renderTarget2]) {
        target.depthTexture = new THREE.DepthTexture();
        target.depthTexture.format = THREE.DepthFormat;
        target.depthTexture.type = THREE.FloatType;
        target.depthTexture.minFilter = THREE.NearestFilter;
        target.depthTexture.magFilter = THREE.NearestFilter;
    }

    const renderPass = new RenderPass(scene, null)
    composer.addPass(renderPass)

    const motionBlur = createMotionBlurPass()
    composer.addPass(motionBlur.pass)
    onGuiChange(gui, ["settings.motionBlurShutterSpeed"], (shutterSpeed) => {

    }, true)

    //const ssaoPass = new SSAOPass(scene, new THREE.PerspectiveCamera());
    //ssaoPass.output = SSAOPass.OUTPUT.SSAO
    //composer.addPass(ssaoPass);

    const fxaa = new FXAAPass()
    composer.addPass(fxaa)
    onGuiChange(gui, ["settings.antiAlias"], (enable) => { fxaa.enabled = enable }, true)

    const fisheye = createFisheyePass()
    composer.addPass(fisheye.pass)

    composer.addPass(new OutputPass())

    function onResize() {
        composer.setSize(
            window.innerWidth * config.settings.composerResolutionScale,
            window.innerHeight * config.settings.composerResolutionScale
        )
        // motionBlurPass.setSize(
        //     window.innerWidth * config.settings.composerResolutionScale,
        //     window.innerHeight * config.settings.composerResolutionScale
        // )
        renderer.setSize(
            window.innerWidth * config.settings.rendererResolutionScale,
            window.innerHeight * config.settings.rendererResolutionScale,
            false
        );

        maskTarget.setSize(
            window.innerWidth,
            window.innerHeight,
        );
    }
    window.addEventListener('resize', onResize);
    onGuiChange(gui, ["settings.rendererResolutionScale", "settings.composerResolutionScale"], onResize)
    onResize()

    const render = (selectedCamera) => {
        renderPass.camera = selectedCamera

        if (selectedCamera.userData.exposure === 0) {
            motionBlur.pass.enabled = false
        }
        else {
            motionBlur.pass.enabled = true
            motionBlur.pass.uniforms.exposure.value = selectedCamera.userData.exposure

            // render mask for motion blur
            renderer.setRenderTarget(maskTarget);
            const colorBefore = renderer.getClearColor(new THREE.Color());
            const backgroundBefore = scene.background
            scene.background = new THREE.Color(0x000000);
            renderer.setClearColor(0x000000, 1);
            renderer.clear();
            scene.overrideMaterial = maskMaterial;
            selectedCamera.layers.set(DRONE_LAYER);
            renderer.render(scene, selectedCamera);
            scene.overrideMaterial = null;
            selectedCamera.layers.set(0);
            renderer.setRenderTarget(null);
            renderer.setClearColor(colorBefore, 1);
            scene.background = backgroundBefore;

            motionBlur.updateTextures(
                composer.readBuffer.depthTexture,
                maskTarget.texture
            )
        }

        fisheye.updateUniforms(selectedCamera)
        composer.render()
    }

    return { render, canvas, stepMotionBlurCamera: motionBlur.stepCamera }
}

function createFisheyePass() {

    // https://www.decarpentier.nl/lens-distortion

    const pass = new ShaderPass({
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

    const updateUniforms = (camera) => {
        pass.uniforms.height.value = Math.tan(camera.fov / 2 * deg)
        pass.uniforms.aspectRatio.value = camera.aspect
        pass.uniforms.strength.value = camera.userData.fishEyeStrength
    }

    return { pass, updateUniforms }
}

function createMotionBlurPass() {

    // created by chatGPT, looks alright in game, not sure if it's correct

    const pass = new ShaderPass({
        uniforms: {
            tDiffuse: { value: null },
            tDepth: { value: null },
            tMask: { value: null },
            invProjection: { value: new THREE.Matrix4() },
            invView: { value: new THREE.Matrix4() },
            prevViewProj: { value: new THREE.Matrix4() },
            currViewProj: { value: new THREE.Matrix4() },
            dt: { value: dt },
            exposure: { value: 0.0 },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;

            uniform sampler2D tDiffuse;
            uniform sampler2D tDepth;
            uniform sampler2D tMask;

            uniform float near;
            uniform float far;
            uniform mat4 invProjection;
            uniform mat4 invView;
            uniform mat4 prevViewProj;
            uniform mat4 currViewProj;
            uniform float dt;
            uniform float exposure;

            vec3 getWorldPos(vec2 uv, float depth) {
                float z = depth * 2.0 - 1.0;
                vec4 clip = vec4(uv * 2.0 - 1.0, z, 1.0);
                vec4 view = invProjection * clip;
                view /= view.w;
                vec4 world = invView * view;
                return world.xyz;
            }

            void main() {

                float mask = texture2D(tMask, vUv).r;
                if (mask > 0.5){
                    gl_FragColor = texture2D(tDiffuse, vUv);
                    return;
                }

                float depth = texture2D(tDepth, vUv).r;
                vec3 worldPos = getWorldPos(vUv, depth);

                vec4 currClip = currViewProj * vec4(worldPos, 1.0);
                currClip /= currClip.w;

                vec4 prevClip = prevViewProj * vec4(worldPos, 1.0);
                prevClip /= prevClip.w;

                vec2 velocity = (currClip.xy - prevClip.xy) * exposure / dt;

                vec4 color = texture2D(tDiffuse, vUv);
                const int maxSamples = 12;
                int actualSamples = 1;

                for (int i = 0; i < maxSamples; i++) {
                    float q = float(i) / float(maxSamples - 1);
                    vec2 offset = vUv - velocity * q;
                    if (texture2D(tMask, offset).r < 0.5){ // don't sample drone
                        color += texture2D(tDiffuse, offset);
                        actualSamples += 1;
                    }
                }

                gl_FragColor = color / float(actualSamples);
            }
        `
    });

    const stepCamera = (camera) => {
        // has to be called each physics step
        pass.uniforms.invProjection.value.copy(camera.projectionMatrixInverse)
        pass.uniforms.invView.value.copy(camera.matrixWorld)
        pass.uniforms.prevViewProj.value.copy(pass.uniforms.currViewProj.value)
        pass.uniforms.currViewProj.value.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
    }

    const updateTextures = (depthTexture, maskTexture) => {
        pass.uniforms.tDepth.value = depthTexture
        pass.uniforms.tMask.value = maskTexture
    }

    return { pass, stepCamera, updateTextures }
}
