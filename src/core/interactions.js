// core/interactions.js
// Vật thể bấm được trong phòng (màn hình, case...): rê chuột → phủ lớp sáng xanh, click → gọi hàm xử lý.
// Click chỉ tính khi chuột gần như không di chuyển giữa lúc nhấn và nhả (không nhầm với kéo xoay camera).
import * as THREE from "three";
import gsap from "gsap";

const CLICK_TOLERANCE = 6; // px

// Nhiều module cùng đổi con trỏ chuột trên canvas: giữ con trỏ "pointer" khi ít nhất một module đang hover
const pointerOwners = new Set();
/** @param {string} owner @param {boolean} active */
export function setPointer(domElement, owner, active) {
    active ? pointerOwners.add(owner) : pointerOwners.delete(owner);
    domElement.style.cursor = pointerOwners.size ? "pointer" : "";
}

/**
 * @param {THREE.Camera} camera
 * @param {HTMLElement} domElement
 */
export function createInteractions(camera, domElement) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const targets = []; // { id, meshes, glow, onClick }
    const hoverListeners = new Set();
    let hovered = null;
    let down = null;
    let enabled = true;

    /**
     * @param {string} id
     * @param {THREE.Mesh[]} meshes
     * @param {() => void} onClick
     */
    function register(id, meshes, onClick) {
        const glow = new THREE.MeshBasicMaterial({
            color: 0x66b3ff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            polygonOffset: true, // vẽ đè đúng bề mặt gốc, không bị nhấp nháy z-fighting
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
            toneMapped: false,
        });
        meshes.forEach((mesh) => {
            const overlay = new THREE.Mesh(mesh.geometry, glow);
            overlay.userData.skipIntro = true;
            overlay.raycast = () => {}; // không chặn raycast của mesh gốc
            mesh.add(overlay);
        });
        targets.push({ id, meshes, glow, onClick });
    }

    function pick(event) {
        const rect = domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(targets.flatMap((t) => t.meshes), false)[0];
        return hit ? targets.find((t) => t.meshes.includes(hit.object)) : null;
    }

    function setHovered(target) {
        if (target === hovered) return;
        if (hovered) gsap.to(hovered.glow, { opacity: 0, duration: 0.3, overwrite: true });
        if (target) {
            gsap.fromTo(target.glow, { opacity: 0.12 }, { opacity: 0.28, duration: 0.6, repeat: -1, yoyo: true, ease: "sine.inOut", overwrite: true });
        }
        hovered = target;
        setPointer(domElement, "interactions", !!target);
        hoverListeners.forEach((cb) => cb(target?.id ?? null));
    }

    domElement.addEventListener("pointermove", (e) => {
        if (enabled && e.pointerType !== "touch") setHovered(pick(e));
    });
    domElement.addEventListener("pointerleave", () => setHovered(null));
    domElement.addEventListener("pointerdown", (e) => {
        down = { x: e.clientX, y: e.clientY };
    });
    domElement.addEventListener("pointerup", (e) => {
        if (!enabled || !down) return;
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        down = null;
        if (moved > CLICK_TOLERANCE) return;
        pick(e)?.onClick();
    });

    return {
        register,
        /** Gọi cb(id | null) mỗi khi vật thể đang hover thay đổi. */
        onHover: (cb) => hoverListeners.add(cb),
        /** Tắt khi camera đang bay / popup đang mở. */
        setEnabled(value) {
            enabled = value;
            if (!value) setHovered(null);
        },
        /** Bật/tắt lớp sáng của một vật thể từ bên ngoài (vd. khi rê chuột vào hotspot). */
        highlight(id, on) {
            const target = targets.find((t) => t.id === id);
            if (target) setHovered(on ? target : null);
        },
    };
}
