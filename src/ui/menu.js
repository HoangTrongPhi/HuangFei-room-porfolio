// ui/menu.js
// Menu điều hướng: dock kính bên phải (desktop) / thanh tab dưới đáy (điện thoại).
// Hiệu ứng: chữ "giải mã" khi rê chuột, vạch sáng trượt theo nút đang chọn, phím tắt 1–4 (data-key),
// và sáng theo vật thể 3D tương ứng đang được rê chuột (setActive).
import gsap from "gsap";
import { track } from "../core/analytics.js";
import { prefersReducedMotion } from "./dom.js";

const GLYPHS = "!<>-_/[]{}=+*^?#01";
const SCRAMBLE_MS = 380;

/**
 * @param {Object<string,(item: HTMLElement) => void>} actions - { giá trị data-link: hàm xử lý khi bấm }
 * @returns {{ setActive: (link: string | null) => void }}
 */
export function initMenu(actions) {
    const nav = document.querySelector("#ui-overlay");
    const indicator = nav.querySelector(".dock-indicator");
    const items = [...nav.querySelectorAll(".menu-item[data-link]")];
    let hovered = null;
    let active = null;

    // Vạch sáng bên trái trượt tới nút đang hover (ưu tiên) hoặc nút đang sáng theo vật thể 3D
    function moveIndicator() {
        const target = hovered ?? active;
        indicator.classList.toggle("is-visible", !!target);
        if (target) {
            indicator.style.transform = `translateY(${target.offsetTop}px)`;
            indicator.style.height = `${target.offsetHeight}px`;
        }
    }

    items.forEach((item) => {
        const label = item.querySelector(".menu-label");
        label.dataset.text = label.textContent;
        item.setAttribute("aria-label", label.dataset.text); // tên nút không đổi trong lúc chữ đang "giải mã"

        const enter = () => {
            hovered = item;
            moveIndicator();
            scramble(label);
        };
        const leave = () => {
            if (hovered === item) hovered = null;
            moveIndicator();
        };
        item.addEventListener("pointerenter", enter);
        item.addEventListener("focus", enter);
        item.addEventListener("pointerleave", leave);
        item.addEventListener("blur", leave);

        item.addEventListener("click", () => {
            track("click", item.dataset.link.replace("#", ""));
            // Nhấn lún nhẹ rồi bật lại trong lúc popup mở ra từ chính nút này
            gsap.timeline()
                .to(item, { scale: 0.94, duration: 0.08, ease: "power2.out" })
                .to(item, { scale: 1, duration: 0.35, ease: "elastic.out(1, 0.5)" });
            actions[item.dataset.link]?.(item);
        });
    });

    // Phím tắt theo data-key (bỏ qua khi đang gõ chữ, đang mở popup hoặc có phím bổ trợ)
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        if (e.target.closest?.("input, textarea, [contenteditable]")) return;
        if (document.body.classList.contains("popup-open")) return;
        const item = items.find((i) => i.dataset.key === e.key);
        if (!item) return;
        e.preventDefault();
        item.click();
    });

    return {
        /** Làm sáng nút ứng với vật thể 3D đang được rê chuột (null = bỏ). */
        setActive(link) {
            const item = items.find((i) => i.dataset.link === link) ?? null;
            if (item === active) return;
            active?.classList.remove("is-active");
            active = item;
            if (item) {
                item.classList.add("is-active");
                scramble(item.querySelector(".menu-label"));
            }
            moveIndicator();
        },
    };
}

// Ký tự ngẫu nhiên chạy rồi "khoá" dần về đúng chữ từ trái sang phải
function scramble(label) {
    if (prefersReducedMotion()) return;
    const text = label.dataset.text;
    cancelAnimationFrame(label._scramble);
    const start = performance.now();
    const frame = (now) => {
        const progress = Math.min(1, (now - start) / SCRAMBLE_MS);
        const fixed = Math.floor(progress * text.length);
        label.textContent = [...text].map((ch, i) =>
            i < fixed || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        ).join("");
        if (progress < 1) label._scramble = requestAnimationFrame(frame);
    };
    label._scramble = requestAnimationFrame(frame);
}
