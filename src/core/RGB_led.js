// core/RGB_led.js
// Đèn Yeelight trên tường: đổi màu RGB liên tục theo sóng sin.
import * as THREE from "three";
import { loadGLB } from "./loader.js";

/** @returns {Promise<(delta:number)=>void>} hàm update gọi mỗi frame */
export async function loadRGBleds(scene) {
    const root = await loadGLB("/models/yeelight_led.glb");

    const leds = [];
    root.traverse((obj) => {
        if (obj.isMesh && obj.name.toLowerCase().includes("yeelight_led")) {
            const base = obj.material;
            obj.material = new THREE.MeshStandardMaterial({
                map: base?.map || null,
                color: base?.color || new THREE.Color(0xffffff),
                emissive: 0xffffff,
                emissiveIntensity: 0.1,
            });
            leds.push(obj);
        }
    });

    scene.add(root);

    let time = 0;
    return function update(delta) {
        time += delta * 2;
        leds.forEach((led, i) => {
            // 3 kênh lệch pha nhau ~120° → chuyển màu cầu vồng; mỗi đèn lệch thêm 0.5
            const phase = time + i * 0.5;
            led.material.emissive.setRGB(
                0.5 + 0.5 * Math.sin(phase),
                0.5 + 0.5 * Math.sin(phase + 2.0),
                0.5 + 0.5 * Math.sin(phase + 4.0)
            );
        });
    };
}
