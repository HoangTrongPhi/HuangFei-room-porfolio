// core/Sound.js
import * as THREE from 'three';

let backgroundSound;

export function loadBackgroundMusic(camera, path = 'public/audio/LittlerootTown_Pokemon.ogg') {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    backgroundSound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(path, function(buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(true);
        backgroundSound.setVolume(0.5);
        backgroundSound.play();
    });
}

export function stopMusic() {
    if (backgroundSound && backgroundSound.isPlaying) {
        backgroundSound.stop();
    }
}
