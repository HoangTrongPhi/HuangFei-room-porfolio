// ui/loading.js
// Màn hình loading: căn phòng isometric tự vẽ dần theo tiến trình tải thật + log tải từng file
// → tải xong thì phòng sáng đèn, hiện nút Enter → bấm: bản vẽ phóng to tan vào cảnh 3D
// (intro lắp ráp căn phòng nằm ở core/intro.js, main.js gọi trong onEnter).
import gsap from "gsap";
import { onLoadProgress, getLoadFiles } from "../core/loader.js";
import { createIsoRoom } from "./isoRoom.js";
import { h, prefersReducedMotion } from "./dom.js";

const SPINNER = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";

/**
 * @param {Promise} ready - resolve khi mọi model đã tải xong (thành công hoặc lỗi)
 * @param {object} opt
 * @param {string} opt.name        - tên hiện từng chữ ở tiêu đề
 * @param {string} opt.role        - dòng phụ dưới tên
 * @param {string|null} opt.visitor - tên công ty từ ?ref= (null nếu không có)
 * @param {() => void} opt.onEnter - gọi ngay khi bấm Enter (phát nhạc, chạy intro)
 */
export function initLoadingScreen(ready, { name, role, visitor, onEnter }) {
    const screen = document.querySelector(".loading-screen");
    const art = document.querySelector(".loading-art");
    const button = document.querySelector(".loading-screen-button");
    const bar = document.querySelector(".loading-progress");
    const percent = document.querySelector(".loading-percent");
    const log = document.querySelector(".loading-log");
    const hint = document.querySelector(".loading-hint");
    const title = document.querySelector(".loading-title");
    const roleEl = document.querySelector(".loading-role");
    const visitorEl = document.querySelector(".loading-visitor");

    const room = createIsoRoom();
    art.append(room.el);

    // Tên hiện ra từng chữ
    title.setAttribute("aria-label", name);
    title.replaceChildren(...[...name].map((ch) => h("span", { "aria-hidden": "true" }, ch === " " ? " " : ch)));
    roleEl.textContent = role;
    gsap.from(title.children, { y: 24, opacity: 0, duration: 0.6, stagger: 0.04, ease: "back.out(2)" });
    gsap.from(roleEl, { opacity: 0, y: 8, duration: 0.6, delay: 0.5 });

    if (visitor) {
        visitorEl.append("Prepared for ", h("strong", {}, visitor));
        visitorEl.hidden = false;
        gsap.from(visitorEl, { opacity: 0, y: 8, duration: 0.6, delay: 0.8 });
    }

    // ===== Tiến trình: chạy mượt tới giá trị thật, dừng ở 99% cho tới khi mọi model sẵn sàng =====
    const state = { value: 0 };
    const render = () => {
        bar.style.width = `${state.value}%`;
        percent.textContent = `${Math.floor(state.value)}%`;
        room.setProgress(state.value / 100);
    };
    render();
    let target = 0;
    onLoadProgress((p) => {
        target = Math.max(target, p * 99);
        gsap.to(state, { value: target, duration: 0.6, ease: "power2.out", overwrite: true, onUpdate: render });
    });

    // ===== Log tải từng file, kiểu terminal =====
    const lines = new Map(); // url → { status, size }
    let frame = 0;
    const logTimer = setInterval(() => {
        frame++;
        getLoadFiles().forEach((f) => {
            let line = lines.get(f.url);
            if (!line) {
                const status = h("span", { class: "log-status" });
                const size = h("span", { class: "log-size" });
                log.append(h("li", {}, status, h("span", { class: "log-name" }, f.url.split("/").pop()), size));
                line = { status, size };
                lines.set(f.url, line);
            }
            line.status.textContent = f.failed ? "✗" : f.done ? "✓" : SPINNER[frame % SPINNER.length];
            line.status.classList.toggle("is-done", f.done && !f.failed);
            line.status.classList.toggle("is-failed", !!f.failed);
            line.size.textContent = f.total ? formatSize(f.done ? f.total : f.loaded) : "";
        });
    }, 80);

    ready.then(() => {
        gsap.to(state, {
            value: 100, duration: 0.5, ease: "power2.out", overwrite: true, onUpdate: render,
            onComplete: () => {
                clearInterval(logTimer);
                log.append(h("li", { class: "log-ready" }, h("span", { class: "log-status is-done" }, "✓"), h("span", { class: "log-name" }, "room ready — lights on")));
                room.lightUp();
                showEnter();
            },
        });
    });

    function showEnter() {
        button.textContent = "Enter the room";
        button.classList.add("active");
        hint.classList.add("active");
        button.addEventListener("click", enter, { once: true });
        button.focus({ preventScroll: true });
    }

    // ===== Vào phòng: bản vẽ phóng to + mờ dần, cảnh 3D hiện ra phía sau =====
    function enter() {
        onEnter?.(); // intro bắt đầu ngay, chạy song song lúc màn loading mờ dần
        const reduced = prefersReducedMotion();
        gsap.timeline({ onComplete: () => screen.remove() })
            .to(".loading-panel", { opacity: 0, y: 20, duration: 0.4, ease: "power2.in" }, 0)
            .to(room.el, reduced ? { opacity: 0, duration: 0.3 } : { scale: 2.6, opacity: 0, duration: 1, ease: "power3.in" }, 0)
            .to(screen, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, reduced ? 0.2 : 0.5);
    }
}

function formatSize(bytes) {
    return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}
