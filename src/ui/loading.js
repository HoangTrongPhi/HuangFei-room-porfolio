// ui/loading.js
// Màn hình loading (tiến trình tải thật) → nút Enter → intro: các vật thể bay về vị trí ban đầu.
import gsap from "gsap";
import { onLoadProgress } from "../core/loader.js";

/**
 * @param {THREE.Scene} scene
 * @param {Promise} ready - resolve khi mọi model đã tải xong (thành công hoặc lỗi)
 * @param {object} opt
 * @param {string} opt.name        - tên hiện từng chữ ở tiêu đề
 * @param {string} opt.role        - dòng phụ dưới tên
 * @param {string|null} opt.visitor - tên công ty từ ?ref= (null nếu không có)
 * @param {() => void} opt.onEnter - gọi khi loading screen biến mất (vd. phát nhạc)
 */
export function initLoadingScreen(scene, ready, { name, role, visitor, onEnter }) {
    const screen = document.querySelector(".loading-screen");
    const button = document.querySelector(".loading-screen-button");
    const bar = document.querySelector(".loading-progress");
    const percent = document.querySelector(".loading-percent");
    const hint = document.querySelector(".loading-hint");
    const title = document.querySelector(".loading-title");
    const roleEl = document.querySelector(".loading-role");
    const visitorEl = document.querySelector(".loading-visitor");

    // Tên hiện ra từng chữ
    title.setAttribute("aria-label", name);
    title.replaceChildren(...[...name].map((ch) => {
        const span = document.createElement("span");
        span.textContent = ch === " " ? " " : ch;
        span.setAttribute("aria-hidden", "true");
        return span;
    }));
    roleEl.textContent = role;
    gsap.from(title.children, { y: 24, opacity: 0, duration: 0.6, stagger: 0.04, ease: "back.out(2)" });
    gsap.from(roleEl, { opacity: 0, y: 8, duration: 0.6, delay: 0.5 });

    if (visitor) {
        visitorEl.append("Prepared for ", Object.assign(document.createElement("strong"), { textContent: visitor }));
        visitorEl.hidden = false;
        gsap.from(visitorEl, { opacity: 0, y: 8, duration: 0.6, delay: 0.8 });
    }

    // Thanh tiến trình chạy mượt tới giá trị thật; dừng ở 99% cho tới khi mọi model sẵn sàng
    const state = { value: 0 };
    const render = () => {
        bar.style.width = `${state.value}%`;
        percent.textContent = `${Math.floor(state.value)}%`;
    };
    let target = 0;
    onLoadProgress((p) => {
        target = Math.max(target, p * 99);
        gsap.to(state, { value: target, duration: 0.5, ease: "power2.out", overwrite: true, onUpdate: render });
    });

    ready.then(() => {
        gsap.to(state, { value: 100, duration: 0.4, ease: "power2.out", overwrite: true, onUpdate: render, onComplete: showEnter });
    });

    function showEnter() {
        button.textContent = "Enter!";
        button.classList.add("active");
        hint.classList.add("active");
        button.addEventListener("click", enter, { once: true });
    }

    function enter() {
        gsap.to([title, roleEl, visitorEl, bar.parentElement, percent, hint], { opacity: 0, duration: 0.6, ease: "power2.inOut" });
        gsap.to(screen, {
            y: "200vh",
            duration: 1.2,
            delay: 0.3,
            ease: "back.in(0.8)",
            onComplete: () => {
                screen.remove();
                onEnter?.();
                playIntro(scene);
            },
        });
    }
}

// Mỗi mesh (trừ background) bắt đầu ở vị trí ngẫu nhiên, scale 0,
// rồi bay về vị trí + scale gốc với delay ngẫu nhiên.
function playIntro(scene) {
    scene.traverse((obj) => {
        if (!obj.isMesh || obj.name.toLowerCase().includes("background")) return;

        const pos = obj.position.clone();
        const scale = obj.scale.clone();

        // Toạ độ local của room bị scale 0.01 nên biên độ cần lớn (~±2000)
        obj.position.set(
            (Math.random() - 0.8) * 2000,
            (Math.random() - 0.8) * 2000,
            (Math.random() - 0.8) * 2000
        );
        obj.scale.set(0, 0, 0);

        gsap.to(obj.position, { ...pos, duration: 1.5, delay: Math.random() * 0.8, ease: "power3.out" });
        gsap.to(obj.scale, { ...scale, duration: 1.2, delay: Math.random() * 0.8, ease: "back.out(1.7)" });
    });
}
