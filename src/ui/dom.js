// ui/dom.js — helper nhỏ dựng DOM. Chuỗi con luôn được thêm dưới dạng text (không parse HTML).

/**
 * h("a", { class: "btn", href: url, onClick: fn }, "Text", childEl)
 * - "class" → className, "on<Event>" → addEventListener, còn lại → setAttribute
 * - giá trị null/false bị bỏ qua, true → thuộc tính rỗng
 */
export function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false) continue;
        if (key === "class") el.className = value;
        else if (key.startsWith("on")) el.addEventListener(key.slice(2).toLowerCase(), value);
        else el.setAttribute(key, value === true ? "" : value);
    }
    el.append(...children.flat().filter((c) => c != null && c !== false));
    return el;
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Mở link ngoài ở tab mới. */
export function openExternal(url) {
    window.open(url, "_blank", "noopener,noreferrer");
}
