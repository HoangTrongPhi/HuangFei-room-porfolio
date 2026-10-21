// ui/welcome.js
// Lời chào riêng cho công ty mở link ?ref=congty (link tạo trong trang admin).
import gsap from "gsap";
import { h } from "./dom.js";
import { getRef } from "../core/analytics.js";

const SLUG = /^[a-zA-Z0-9_-]{1,40}$/; // giống quy tắc ref ở api/track.js

/**
 * Tên công ty để chào, hoặc null nếu không có ref hợp lệ.
 * @param {Object<string,string>} names - REF_NAMES trong content.js
 */
export function getVisitorName(names) {
    const ref = getRef();
    if (!ref || !SLUG.test(ref)) return null;
    const key = ref.toLowerCase();
    return names[key] ?? key.split(/[-_]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

/** Banner chào ở giữa phía trên, tự ẩn sau vài giây. */
export function showWelcome(name, { duration = 7 } = {}) {
    const close = () => {
        tl.kill();
        gsap.to(el, { y: -30, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => el.remove() });
    };
    const el = h("div", { class: "welcome", role: "status" },
        h("span", { class: "welcome-wave", "aria-hidden": "true" }, "👋"),
        h("div", {},
            h("strong", {}, `Hello, ${name}!`),
            h("span", {}, "Thanks for stopping by — open MY WORK to start exploring."),
        ),
        h("button", { class: "welcome-close", type: "button", "aria-label": "Dismiss", onClick: () => close() }, "✕"),
    );
    document.body.append(el);

    const tl = gsap.timeline({ onComplete: close })
        .from(el, { y: -40, opacity: 0, scale: 0.9, duration: 0.6, ease: "back.out(1.8)" })
        .fromTo(el.querySelector(".welcome-wave"), { rotation: 0 }, { rotation: 20, duration: 0.15, repeat: 5, yoyo: true, transformOrigin: "70% 70%" })
        .to({}, { duration });
}
