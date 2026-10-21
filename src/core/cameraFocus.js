// core/cameraFocus.js
// Bay camera tới một vật thể (màn hình, case...) rồi bay về chỗ cũ.
import * as THREE from "three";
import gsap from "gsap";

/**
 * @param {THREE.PerspectiveCamera} camera
 * @param {import("../utils/OrbitControls.js").OrbitControls} controls
 */
export function createCameraFocus(camera, controls) {
    let saved = null; // vị trí trước khi bay tới vật thể, để bay về đúng chỗ người xem đang đứng

    function flyTo(position, target, duration) {
        return new Promise((resolve) => {
            controls.enabled = false;
            gsap.killTweensOf([camera.position, controls.target]);
            gsap.timeline({ onComplete: () => { controls.enabled = true; resolve(); } })
                .to(camera.position, { x: position.x, y: position.y, z: position.z, duration, ease: "power3.inOut" }, 0)
                .to(controls.target, { x: target.x, y: target.y, z: target.z, duration, ease: "power3.inOut" }, 0);
        });
    }

    /**
     * @param {THREE.Object3D[]} objects - các vật thể cần đưa vào khung hình
     * @param {THREE.Vector3} direction - hướng nhìn từ vật thể tới camera
     * @param {object} [opt]
     * @param {number} [opt.fill] - vật thể chiếm bao nhiêu phần chiều cao khung hình
     */
    function focus(objects, direction, { fill = 0.75, duration = 1.1 } = {}) {
        const box = new THREE.Box3();
        objects.forEach((o) => box.expandByObject(o));
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Khoảng cách để vật thể chiếm `fill` khung hình theo chiều cao lẫn chiều ngang
        // (chiều ngang lấy cạnh nằm ngang dài nhất của khối bao — gần đúng, đủ cho các góc nhìn chéo)
        const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
        const tanH = tanV * camera.aspect;
        const halfWidth = Math.max(size.x, size.z) / 2;
        const distance = Math.max(size.y / 2 / tanV, halfWidth / tanH) / fill + halfWidth;
        const position = direction.clone().normalize().multiplyScalar(distance).add(center);

        saved ??= { position: camera.position.clone(), target: controls.target.clone() };
        return flyTo(position, center, duration);
    }

    /** Bay về vị trí trước khi focus (không làm gì nếu đang không focus). */
    function reset({ duration = 1 } = {}) {
        if (!saved) return Promise.resolve();
        const { position, target } = saved;
        saved = null;
        return flyTo(position, target, duration);
    }

    return { focus, reset };
}
