// core/camera.js
import * as THREE from "three";
// Bản OrbitControls đã chỉnh sửa: giới hạn vùng pan (minPan / maxPan)
import { OrbitControls } from "../utils/OrbitControls.js";

/**
 * Tạo camera + OrbitControls và đặt vị trí khởi động.
 * @param {HTMLElement} domElement - canvas nhận sự kiện chuột
 * @param {object} startup
 * @param {number[]} startup.pos    - vị trí camera
 * @param {number[]} startup.target - điểm nhìn
 * @param {number}   startup.zoom   - nhân khoảng cách pos→target (<1 là gần hơn)
 */
export function createCamera(domElement, { pos, target, zoom = 1, fov = 35, near = 0.01, far = 200 }) {
    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);

    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const targetVec = new THREE.Vector3(...target);
    // Màn hình dọc (điện thoại): khung hình hẹp ngang → lùi camera ra để thấy trọn căn phòng
    const portraitScale = Math.min(1.7, Math.max(1, 0.7 / camera.aspect));
    const offset = new THREE.Vector3(...pos).sub(targetVec).multiplyScalar(zoom * portraitScale);
    camera.position.copy(targetVec).add(offset);
    controls.target.copy(targetVec);
    controls.update();

    return { camera, controls };
}
