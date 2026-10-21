// ui/popup.js
// Khung popup dùng chung (kiểu hologram: kính mờ, viền phát sáng, scanline).
// Mỗi popup chọn một kiểu xuất hiện, tính từ vị trí nút vừa bấm:
//   reveal → lan ra thành vòng tròn từ nút
//   window → phóng to từ nút như mở cửa sổ
//   flip   → lật 3D như lật thẻ
// Đóng popup = chạy ngược animation mở. Esc / bấm ra ngoài / nút ✕ đều đóng được.
import gsap from "gsap";
import { h, prefersReducedMotion } from "./dom.js";

const popups = new Map();
let current = null; // { popup, tl, closing, onClosed }
let returnFocus = null;

/**
 * @param {string} id
 * @param {object} opt
 * @param {string} opt.title
 * @param {"reveal"|"window"|"flip"} [opt.anim]
 * @param {string} [opt.className] - class thêm cho panel (để style riêng)
 * @param {Node} opt.body
 * @param {() => void} [opt.onOpen]
 * @param {() => void} [opt.onClose] - gọi khi popup đã đóng hẳn
 */
export function createPopup(id, { title, anim = "reveal", className = "", body, onOpen, onClose }) {
    const titleId = `popup-${id}-title`;
    const closeButton = h("button", { class: "popup-close", type: "button", "aria-label": "Close", onClick: closePopup }, "✕");
    const head = h("header", { class: "popup-head" },
        h("span", { class: "popup-dots", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
        h("h2", { class: "popup-title", id: titleId }, title),
        closeButton,
    );
    const panel = h("div", { class: `popup-panel ${className}` }, head, h("div", { class: "popup-body" }, body));
    const el = h("div", { class: "popup", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, hidden: true },
        h("div", { class: "popup-backdrop", onClick: closePopup }),
        panel,
    );
    document.body.append(el);

    const popup = { id, el, panel, head, closeButton, anim, onOpen, onClose };
    popups.set(id, popup);
    return popup;
}

/**
 * @param {string} id
 * @param {Element} [originEl] - phần tử bấm mở popup; animation xuất phát từ tâm của nó (mặc định: giữa màn hình)
 * @param {object} [opt]
 * @param {() => void} [opt.onClosed] - gọi một lần khi popup này đóng hẳn
 */
export function openPopup(id, originEl, { onClosed } = {}) {
    const popup = popups.get(id);
    if (!popup) return;
    if (current) finish(current, true);

    returnFocus = document.activeElement;
    popup.el.hidden = false;
    document.body.classList.add("popup-open");

    const tl = buildTimeline(popup, originPoint(originEl));
    current = { popup, tl, closing: false, onClosed };
    popup.onOpen?.();
    popup.closeButton.focus({ preventScroll: true });
}

export function closePopup() {
    if (!current || current.closing) return;
    const entry = current;
    entry.closing = true;
    document.body.classList.remove("popup-open");
    entry.tl.eventCallback("onReverseComplete", () => finish(entry));
    entry.tl.timeScale(1.8).reverse();
}

function finish(entry, immediate = false) {
    const { popup, tl } = entry;
    tl.kill();
    popup.el.hidden = true;
    gsap.set([popup.el, popup.panel], { clearProps: "all" });
    popup.onClose?.();
    entry.onClosed?.();
    if (current === entry) current = null;
    if (!immediate) returnFocus?.focus?.({ preventScroll: true });
}

function originPoint(el) {
    const r = el?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 };
}

function buildTimeline({ el, panel, anim }, { x, y }) {
    const tl = gsap.timeline();
    const backdrop = el.querySelector(".popup-backdrop");
    const items = panel.querySelectorAll("[data-stagger]");

    if (prefersReducedMotion()) {
        return tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    }

    tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0);

    if (anim === "reveal") {
        const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        tl.fromTo(el,
            { clipPath: `circle(0px at ${x}px ${y}px)` },
            { clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: 0.75, ease: "power3.inOut" }, 0);
    } else if (anim === "window") {
        const rect = panel.getBoundingClientRect();
        tl.fromTo(panel,
            { scale: 0.08, opacity: 0, transformOrigin: `${x - rect.left}px ${y - rect.top}px` },
            { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.2)" }, 0);
    } else if (anim === "flip") {
        tl.fromTo(panel,
            { rotationY: -100, opacity: 0, transformPerspective: 1400 },
            { rotationY: 0, opacity: 1, duration: 0.8, ease: "back.out(1.4)" }, 0);
    }

    if (items.length) {
        tl.fromTo(items, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }, 0.3);
    }
    return tl;
}

// Esc để đóng; Tab chỉ chạy vòng trong popup đang mở
document.addEventListener("keydown", (e) => {
    if (!current || current.closing) return;
    if (e.key === "Escape") return closePopup();
    if (e.key !== "Tab") return;

    const focusable = [...current.popup.panel.querySelectorAll("button, a[href], [tabindex]:not([tabindex='-1'])")]
        .filter((n) => n.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
