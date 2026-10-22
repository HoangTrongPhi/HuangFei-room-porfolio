// core/RGB_led.js
// Đèn Yeelight trên tường: đổi màu RGB liên tục theo sóng sin (hoặc màu cố định chọn ở bảng điều khiển),
// sáng bừng theo nhịp nhạc. Party mode: đổi màu nhanh + nháy mạnh.
import * as THREE from "three";
import { loadGLB } from "./loader.js";
import { roomFx } from "./roomFx.js";

/** @returns {Promise<(delta:number, level:number)=>void>} hàm update gọi mỗi frame (level: độ lớn nhạc 0 → 1) */
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
    return function update(delta, level = 0) {
        const { ledColor, party, ledIntensity } = roomFx;
        time += delta * (party ? 7 : 2);
        leds.forEach((led, i) => {
            const phase = time + i * 0.5;
            led.material.emissiveIntensity = (0.1 + level * (party ? 2.2 : 0.9)) * ledIntensity;
            if (ledColor) {
                // Màu cố định, mỗi đèn sáng tối lệch nhau một chút cho đỡ phẳng
                led.material.emissive.copy(ledColor).multiplyScalar(0.8 + 0.2 * Math.sin(phase));
            } else {
                // 3 kênh lệch pha nhau ~120° → chuyển màu cầu vồng; mỗi đèn lệch thêm 0.5
                led.material.emissive.setRGB(
                    0.5 + 0.5 * Math.sin(phase),
                    0.5 + 0.5 * Math.sin(phase + 2.0),
                    0.5 + 0.5 * Math.sin(phase + 4.0)
                );
            }
        });
        if (leds.length) roomFx.accent.copy(leds[0].material.emissive);
    };
}
