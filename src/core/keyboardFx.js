// core/keyboardFx.js
// Gõ phím thật → bàn phím trong phòng nhún xuống và loé sáng theo màu LED hiện tại (roomFx.accent).
// Bàn phím là một mesh duy nhất (không tách từng phím) nên hiệu ứng áp cho cả bàn phím.
import * as THREE from "three";
import gsap from "gsap";
import { roomFx } from "./roomFx.js";

const PRESS_DEPTH = 0.06; // cm (đơn vị của phòng)

/**
 * @param {THREE.Mesh} keyboard
 */
export function createKeyboardFx(keyboard) {
    const glow = new THREE.MeshBasicMaterial({
        color: roomFx.accent,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        toneMapped: false,
    });
    const overlay = new THREE.Mesh(keyboard.geometry, glow);
    overlay.userData.skipIntro = true;
    overlay.raycast = () => {};
    keyboard.add(overlay);

    const baseY = keyboard.position.y;
    let enabled = false;

    window.addEventListener("keydown", (e) => {
        if (!enabled || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target.closest?.("input, textarea, [contenteditable]")) return; // đang gõ vào ô nhập liệu
        if (document.body.classList.contains("popup-open")) return; // cảnh 3D đang bị che
        glow.color.copy(roomFx.accent);
        gsap.fromTo(glow, { opacity: 0.45 }, { opacity: 0, duration: 0.35, ease: "power2.out", overwrite: true });
        gsap.fromTo(keyboard.position, { y: baseY - PRESS_DEPTH }, { y: baseY, duration: 0.18, ease: "back.out(3)", overwrite: true });
    });

    return {
        /** Bật sau intro (intro đang tween vị trí bàn phím). */
        setEnabled(value) {
            enabled = value;
        },
    };
}
