// /core/RGB_led.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export async function loadRGBleds(scene) {
    const loader = new GLTFLoader();
    const glb = await loader.loadAsync("/models/yeelight_led.glb");

    const leds = [];
    glb.scene.traverse((obj) => {
        if (obj.isMesh && obj.name.toLowerCase().includes("yeelight_led")) {
            // Clone material gốc để giữ texture/shader
            const baseMat = obj.material;
            obj.material = new THREE.MeshStandardMaterial({
                map: baseMat?.map || null,
                color: baseMat?.color || new THREE.Color(0xffffff),
                emissive: new THREE.Color(0xffffff),
                emissiveIntensity: 20, // cực sáng để thắng exposure thấp
            });
            leds.push(obj);
        }
    });

    scene.add(glb.scene);
    console.log("LEDs found:", leds.map(l => l.name));

    let time = 0;
    function animateLEDs(delta) {
        time += delta * 2;

        leds.forEach((led, i) => {
            const phase = (time + i * 0.5);

            // Tính RGB theo sin wave
            const r = 0.5 + 0.5 * Math.sin(phase);
            const g = 0.5 + 0.5 * Math.sin(phase + 2.0);
            const b = 0.5 + 0.5 * Math.sin(phase + 4.0);

            // Cập nhật màu emissive
            led.material.emissive.setRGB(r, g, b);
            led.material.emissiveIntensity = 1; // luôn sáng mạnh
        });
    }

    return animateLEDs;
}
