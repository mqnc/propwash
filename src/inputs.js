
// globals
let kbdState = { x: 0, y: 0 };
let keyDown = {}
export let keyPressed = {}

let mouse = { x: 0, y: 0 };

// config
const TAU_KBD = 0.2;
const MOUSE_SENS = 0.05;
let mode = 2; // 1,2,3,4

// input listeners
window.addEventListener('keydown', (e) => {
    keyDown[e.key.toLowerCase()] = true
    if (!e.repeat) { keyPressed[e.key.toLowerCase()] = true }
});
window.addEventListener('keyup', (e) => {
    keyDown[e.key.toLowerCase()] = false
});

let mouseCaptured = false;
document.addEventListener("pointerlockchange", () => {
    mouseCaptured = document.pointerLockElement !== null
});

window.addEventListener('mousemove', e => {
    if (mouseCaptured) {
        mouse.x += e.movementX * MOUSE_SENS;
        mouse.y += e.movementY * MOUSE_SENS;
        mouse.x = Math.max(-1, Math.min(1, mouse.x));
        mouse.y = Math.max(-1, Math.min(1, mouse.y));
    }
});

window.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.key === '1') mode = 1;
    else if (e.key === '2') mode = 2;
    else if (e.key === '3') mode = 3;
    else if (e.key === '4') mode = 4;
});

// drone control inputs
let gpBefore = new Array(100).fill(false)
export function readInputs(dt) {

    let reset = false
    if (keyPressed['r']) {
        reset = true
        keyPressed['r'] = false
    }

    const gamepad = navigator.getGamepads()[0];
    const applyDeadzone = (v, dz = 0.15) => Math.abs(v) < dz ? 0 : v;

    let leftStickX = 0, leftStickY = 0, rightStickX = 0, rightStickY = 0;

    // gamepad
    if (gamepad) {
        leftStickX = applyDeadzone(gamepad.axes[0]);
        leftStickY = applyDeadzone(-gamepad.axes[1]);
        rightStickX = applyDeadzone(gamepad.axes[2]);
        rightStickY = applyDeadzone(-gamepad.axes[3]);
        if (gamepad.buttons[5].pressed && !gpBefore[5]) {
            reset = true
        }
        gpBefore = gamepad.buttons.map(b => b.pressed)
    }

    // wasd = left stick
    let targetX = (keyDown['d'] || keyDown['arrowright'] ? 1 : 0) - (keyDown['a'] || keyDown['arrowleft'] ? 1 : 0);
    let targetY = (keyDown['w'] || keyDown['arrowup'] ? 1 : 0) - (keyDown['s'] || keyDown['arrowdown'] ? 1 : 0);

    let q = dt / (TAU_KBD + dt);

    kbdState.x = (1 - q) * kbdState.x + q * targetX
    kbdState.y = (1 - q) * kbdState.y + q * targetY

    if (reset) {
        kbdState.x = 0;
        kbdState.y = 0;
        targetX = 0;
        targetY = 0;
    }

    leftStickX += kbdState.x;
    leftStickY += kbdState.y;

    // mouse = right stick
    rightStickX += mouse.x;
    rightStickY -= mouse.y;
    mouse.x = 0;
    mouse.y = 0;

    const clamp = v => Math.max(-1, Math.min(v, 1))
    leftStickX = clamp(leftStickX)
    leftStickY = clamp(leftStickY)
    rightStickX = clamp(rightStickX)
    rightStickY = clamp(rightStickY)

    let throttleInput, yawInput, pitchInput, rollInput;

    switch (mode) {
        case 1:
            throttleInput = rightStickY;
            yawInput = leftStickX;
            pitchInput = -leftStickY;
            rollInput = rightStickX;
            break;
        case 2:
            throttleInput = leftStickY;
            yawInput = leftStickX;
            pitchInput = -rightStickY;
            rollInput = rightStickX;
            break;
        case 3:
            throttleInput = leftStickY;
            yawInput = rightStickX;
            pitchInput = -rightStickY;
            rollInput = leftStickX;
            break;
        case 4:
            throttleInput = rightStickY;
            yawInput = rightStickX;
            pitchInput = -leftStickY;
            rollInput = leftStickX;
            break;

    }

    throttleInput = throttleInput * 0.5 + 0.5

    return { throttleInput, rollInput, pitchInput, yawInput, reset };
}
