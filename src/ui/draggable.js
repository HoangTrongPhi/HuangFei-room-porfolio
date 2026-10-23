// ui/draggable.js
// Giữ chuột kéo các panel HUD (room control, dock navigate, thời tiết, thẻ tên) đi chỗ khác.
// - Kéo từ vùng trống của panel (bấm vào nút / thanh trượt / link vẫn hoạt động bình thường)
// - Vị trí lưu vào localStorage, tự kéo vào lại trong màn hình khi đổi kích thước cửa sổ
// - Nhấp đúp vào vùng kéo để trả panel về chỗ mặc định
// Chỉ áp dụng chuột/bút trên màn hình rộng (điện thoại giữ layout cố định).
const KEY_PREFIX = "panel-pos:";
const MARGIN = 8; // khoảng cách tối thiểu tới mép màn hình
const THRESHOLD = 4; // px — rê ít hơn thế thì coi như bấm, không phải kéo
const INTERACTIVE = "button, a, input, select, textarea, label, output, [role='switch']";

const enabled = () => innerWidth > 720;

/**
 * @param {HTMLElement} panel - phần tử position: fixed cần kéo
 * @param {object} opt
 * @param {string} opt.key - tên lưu vị trí
 * @param {HTMLElement} [opt.handle] - vùng giữ để kéo (mặc định cả panel)
 */
export function makeDraggable(panel, { key, handle = panel }) {
    const storageKey = KEY_PREFIX + key;
    let drag = null; // { id, x, y, left, top, moved }

    handle.classList.add("drag-handle");

    // move/up nghe trên window: chuột rê nhanh ra khỏi panel trước khi vượt ngưỡng vẫn kéo được
    handle.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 || e.pointerType === "touch" || !enabled()) return;
        if (e.target.closest(INTERACTIVE)) return;
        e.preventDefault(); // không bôi đen chữ khi kéo
        const r = panel.getBoundingClientRect();
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: r.left, top: r.top, moved: false };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
    });
    function move(e) {
        if (e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved) {
            if (Math.hypot(dx, dy) < THRESHOLD) return;
            drag.moved = true;
            panel.classList.add("is-dragging");
        }
        place(drag.left + dx, drag.top + dy);
    }
    function end(e) {
        if (e.pointerId !== drag.id) return;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        if (drag.moved) {
            panel.classList.remove("is-dragging");
            save();
        }
        drag = null;
    }
    handle.addEventListener("dblclick", (e) => {
        if (e.target.closest(INTERACTIVE)) return;
        reset();
    });

    // Đặt panel theo toạ độ góc trái trên (bỏ neo right/bottom/transform của CSS)
    function place(left, top) {
        const w = panel.offsetWidth;
        const h = panel.offsetHeight;
        left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, innerWidth - w - MARGIN));
        top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, innerHeight - h - MARGIN));
        Object.assign(panel.style, { left: `${left}px`, top: `${top}px`, right: "auto", bottom: "auto", transform: "none" });
        panel.classList.add("is-moved");
    }

    function reset() {
        if (!panel.classList.contains("is-moved")) return;
        ["left", "top", "right", "bottom", "transform"].forEach((p) => panel.style.removeProperty(p));
        panel.classList.remove("is-moved");
        try { localStorage.removeItem(storageKey); } catch { /* bỏ qua */ }
    }

    function save() {
        try { localStorage.setItem(storageKey, JSON.stringify({ left: panel.offsetLeft, top: panel.offsetTop })); } catch { /* bỏ qua */ }
    }

    // Cửa sổ đổi kích thước / panel thu gọn-mở rộng: giữ panel nằm trọn trong màn hình
    const keepInside = () => {
        if (!panel.classList.contains("is-moved")) return;
        if (!enabled()) return reset();
        place(panel.offsetLeft, panel.offsetTop);
    };
    window.addEventListener("resize", keepInside);
    new ResizeObserver(keepInside).observe(panel);

    // Khôi phục vị trí đã lưu
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (saved && enabled()) place(saved.left, saved.top);
    } catch { /* bỏ qua */ }

    return { reset };
}
