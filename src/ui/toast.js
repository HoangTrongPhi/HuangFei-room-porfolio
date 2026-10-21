// ui/toast.js — thông báo nhỏ góc dưới màn hình (copy email, bật/tắt nhạc...).
import gsap from "gsap";
import { h } from "./dom.js";

let root = null;

/** @param {string} message */
export function toast(message, { duration = 2.4 } = {}) {
    root ??= document.body.appendChild(h("div", { class: "toast-root", role: "status", "aria-live": "polite" }));

    const el = root.appendChild(h("div", { class: "toast" }, message));
    gsap.timeline({ onComplete: () => el.remove() })
        .from(el, { y: 24, opacity: 0, scale: 0.9, duration: 0.35, ease: "back.out(2)" })
        .to(el, { y: -8, opacity: 0, duration: 0.3, ease: "power2.in" }, `+=${duration}`);
}
