// ui/idleHint.js
// Người xem đứng yên một lúc → hiện gợi ý cách khám phá + camera đung đưa chậm qua lại.
// (Không xoay tròn hẳn: phòng chỉ mở ở phía trước, xoay quá ~90° sẽ nhìn vào mặt sau tường.)
// Chạm/di chuột/cuộn/bấm phím bất kỳ → ẩn gợi ý, dừng đung đưa ngay tại chỗ.
import * as THREE from "three";
import gsap from "gsap";
import { h } from "./dom.js";

const EVENTS = ["pointerdown", "pointermove", "wheel", "keydown", "touchstart"];
const SWAY_ANGLE = THREE.MathUtils.degToRad(20); // biên độ mỗi bên
const SWAY_PERIOD = 14; // giây cho một chu kỳ trái → phải → trái

/**
 * @param {THREE.Camera} camera
 * @param {import("../utils/OrbitControls.js").OrbitControls} controls
 * @param {object} opt
 * @param {() => boolean} opt.canStart - chỉ hiện khi trả về true (vd. đã vào phòng, không có popup)
 * @param {number} [opt.delay] - ms đứng yên trước khi hiện
 */
export function createIdleHint(camera, controls, { canStart, delay = 8000 }) {
    const touch = window.matchMedia("(hover: none)").matches;
    const el = h("div", { class: "idle-hint", role: "status", hidden: true },
        h("span", { class: touch ? "idle-icon idle-icon--touch" : "idle-icon", "aria-hidden": "true" }),
        h("span", {},
            touch ? "Swipe to look around · tap the glowing dots" : "Drag to look around · click the glowing dots",
        ),
    );
    document.body.append(el);

    let timer = null;
    let active = false;
    const offset = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    let elapsed = 0;

    // Xoay vị trí camera quanh trục đứng đi qua điểm nhìn, theo sóng sin (bắt đầu từ 0 → không giật)
    function sway(_time, deltaMs) {
        elapsed += deltaMs / 1000;
        const angle = SWAY_ANGLE * Math.sin((elapsed / SWAY_PERIOD) * Math.PI * 2);
        camera.position.copy(offset).applyAxisAngle(up, angle).add(controls.target);
    }

    function start() {
        if (!canStart()) return schedule();
        active = true;
        elapsed = 0;
        offset.copy(camera.position).sub(controls.target);
        gsap.ticker.add(sway);
        el.hidden = false;
        gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "back.out(2)" });
    }

    function stop() {
        clearTimeout(timer);
        if (!active) return;
        active = false;
        gsap.ticker.remove(sway);
        gsap.to(el, { y: 10, opacity: 0, duration: 0.25, onComplete: () => { el.hidden = true; } });
    }

    function schedule() {
        clearTimeout(timer);
        timer = setTimeout(start, delay);
    }

    EVENTS.forEach((type) => window.addEventListener(type, () => { stop(); schedule(); }, { passive: true }));

    return { schedule, stop };
}
