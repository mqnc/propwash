
import { onGuiChange } from './gui.js';
import { clamp } from './utils.js'

export function initSound(config, gui, camera, droneNode, propWav, checkpointWav, musicWav) {
    const audioLoader = new THREE.AudioLoader();

    const listener = new THREE.AudioListener();
    camera.add(listener);
    const propSounds = []

    for (let i = 0; i < 4; i++) {
        const sound = new THREE.PositionalAudio(listener);
        sound.setBuffer(propWav);
        sound.setLoop(true);
        // work around for this: https://discourse.threejs.org/t/start-audio-with-correct-volume-instead-of-quickly-ramping-down-from-100/89793
        sound.gain.gain.value = 0.00;
        setTimeout(() => sound.setVolume(config.aircraft.propSound.volume), 50);
        sound.play();
        droneNode.add(sound);
        propSounds.push(sound)
    }
    onGuiChange(gui, ["aircraft.propSound.path"], (path) => {
        audioLoader.load(path, (buffer) => {
            for (let i = 0; i < 4; i++) {
                propSounds[i].stop()
                propSounds[i].setBuffer(buffer)
                propSounds[i].play()
            }
        })
    })
    onGuiChange(gui, ["aircraft.propSound.volume"], (vol) => {
        for (let i = 0; i < 4; i++) { propSounds[i].setVolume(vol) }
    })

    const music = new THREE.Audio(listener);
    music.setBuffer(musicWav);
    onGuiChange(gui, ["background.music.path"], (path) => {
        audioLoader.load(path, (buffer) => {
            music.stop()
            music.setBuffer(buffer);
            music.play()
        })
    })
    onGuiChange(gui, ["background.music.volume"], (vol) => { music.setVolume(vol) }, true)
    music.setLoop(true);
    music.play();

    const checkpointSound = new THREE.Audio(listener);
    checkpointSound.setBuffer(checkpointWav);
    onGuiChange(gui, ["config.map.mission.checkpointSound.path"], (path) => {
        audioLoader.load(path, (buffer) => { checkpointSound.setBuffer(buffer); })
    })
    onGuiChange(gui, ["map.mission.checkpointSound.volume"], (vol) => { checkpointSound.setVolume(vol) }, true)
    checkpointSound.setLoop(false);

    return { propSounds, checkpointSound, music }
}

function frequencyToCents(recordingFrequency, targetFrequency) {
    const factor = targetFrequency / recordingFrequency;
    const octaves = Math.log2(factor);
    const cents = octaves * 1200
    return cents
}

export function updateSound(config, propSounds, { throttleInput, rollInput, pitchInput, yawInput }) {
    const recordingFrequency = config.aircraft.propSound.recordingFrequency
    const maxThrustFrequency = config.aircraft.propSound.maxThrustRPM / 60.0 * config.aircraft.propSound.numBlades
    const tiltDeltaFrequency = config.aircraft.propSound.tiltDeltaRPM / 60.0 * config.aircraft.propSound.numBlades
    const oscillateFrequency = config.aircraft.propSound.oscillateRPM / 60.0 * config.aircraft.propSound.numBlades

    let t = performance.now() / 1000
    let frequencies = [
        maxThrustFrequency * throttleInput + oscillateFrequency * Math.sin(t + 4)
        + (+ pitchInput + yawInput + rollInput) * tiltDeltaFrequency,
        maxThrustFrequency * throttleInput + oscillateFrequency * Math.sin(t * 0.91245142 + 5)
        + (+ pitchInput - yawInput - rollInput) * tiltDeltaFrequency,
        maxThrustFrequency * throttleInput + oscillateFrequency * Math.sin(t * 0.85234134 + 7)
        + (- pitchInput + yawInput - rollInput) * tiltDeltaFrequency,
        maxThrustFrequency * throttleInput + oscillateFrequency * Math.sin(t * 0.73514635 + 20)
        + (- pitchInput - yawInput + rollInput) * tiltDeltaFrequency
    ]

    for (let i = 0; i < 4; i++) {
        frequencies[i] = clamp(frequencies[i], 100, 10000)
        propSounds[i].setDetune(frequencyToCents(recordingFrequency, frequencies[i]))
    }
}