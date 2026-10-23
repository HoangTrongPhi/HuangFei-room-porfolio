// core/light.js
// Environment map (IBL) cho vật liệu PBR: không có nó thì kim loại/nhựa/kính không có gì để phản chiếu
// → trông phẳng và tối. Dùng RoomEnvironment dựng sẵn của three.js (studio trung tính, không cần tải ảnh).
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/**
 * Tạo env map từ RoomEnvironment và gán vào scene.environment (không đổi background).
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {object} [opt]
 * @param {number} [opt.intensity] - scene.environmentIntensity; exposure của app cao (≈3) nên để nhỏ
 */
export function applyRoomEnvironment(renderer, scene, { intensity = 1 } = {}) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    scene.environmentIntensity = intensity;
    room.dispose();
    pmrem.dispose();
}
