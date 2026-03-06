
import { THREE } from './three.js'

export const pi = Math.PI

export const deg = pi / 180

export const inch = 0.0254

export function setFromRPYdeg(euler, rpy) {
    const [r, p, y] = rpy;
    // note that 'ZYX' is only the order of application, the order of arguments is still x y z
    euler.set(r * deg, p * deg, y * deg, 'ZYX');
}

export function rpyDegToQuat(rpy) {
    let euler = new THREE.Euler()
    setFromRPYdeg(euler, rpy)
    return new THREE.Quaternion().setFromEuler(euler);
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function lerp(x, x0, x1, y0, y1) {
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
}
