
// globals
let kbdState = { x: 0, y: 0 };
let keyDown = {}

let mouse = { x: 0, y: 0 };
let lastTime = performance.now();

// config
const TAU_KBD = 0.2;
const MOUSE_SENS = 0.05;
let mode = 2; // 1,2,3,4

// input listeners
window.addEventListener('keydown', e => keyDown[e.code] = true);
window.addEventListener('keyup', e => keyDown[e.code] = false);

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
    if (e.code === 'Digit1') mode = 1;
    else if (e.code === 'Digit2') mode = 2;
    else if (e.code === 'Digit3') mode = 3;
    else if (e.code === 'Digit4') mode = 4;
});

// drone control inputs
export function controlInputs() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const gamepad = navigator.getGamepads()[0];
    const applyDeadzone = (v, dz = 0.15) => Math.abs(v) < dz ? 0 : v;

    let leftStickX = 0, leftStickY = 0, rightStickX = 0, rightStickY = 0;

    // gamepad
    if (gamepad) {
        leftStickX = applyDeadzone(gamepad.axes[0]);
        leftStickY = applyDeadzone(-gamepad.axes[1]);
        rightStickX = applyDeadzone(gamepad.axes[2]);
        rightStickY = applyDeadzone(-gamepad.axes[3]);
    }

    // wasd = left stick
    let targetX = (keyDown['KeyD'] ? 1 : 0) - (keyDown['KeyA'] ? 1 : 0);
    let targetY = (keyDown['KeyW'] ? 1 : 0) - (keyDown['KeyS'] ? 1 : 0);

    let q = dt / (TAU_KBD + dt);

    kbdState.x = (1 - q) * kbdState.x + q * targetX
    kbdState.y = (1 - q) * kbdState.y + q * targetY

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
            yawInput = -leftStickX;
            pitchInput = -leftStickY;
            rollInput = -rightStickX;
            break;
        case 2:
            throttleInput = leftStickY;
            yawInput = -leftStickX;
            pitchInput = -rightStickY;
            rollInput = -rightStickX;
            break;
        case 3:
            throttleInput = leftStickY;
            yawInput = -rightStickX;
            pitchInput = -rightStickY;
            rollInput = -leftStickX;
            break;
        case 4:
            throttleInput = rightStickY;
            yawInput = -rightStickX;
            pitchInput = -leftStickY;
            rollInput = -leftStickX;
            break;

    }

    throttleInput = throttleInput * 0.5 + 0.5

    return { throttleInput, yawInput, pitchInput, rollInput };
}
