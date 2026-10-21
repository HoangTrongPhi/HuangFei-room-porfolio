// ui/loading.js
// Màn hình loading → nút Enter → intro: các vật thể bay về vị trí ban đầu.
import gsap from "gsap";

const FAKE_LOADING_MS = 3000; // thanh progress chạy giả trong 3 giây

/**
 * @param {THREE.Scene} scene
 * @param {() => void} onEnter - gọi khi loading screen biến mất (vd. phát nhạc)
 */
export function initLoadingScreen(scene, onEnter) {
    const screen = document.querySelector(".loading-screen");
    const button = document.querySelector(".loading-screen-button");
    const bar = document.querySelector(".loading-progress");
    const hint = document.querySelector(".loading-hint");
    const title = document.querySelector(".loading-title");

    let progress = 0;
    const timer = setInterval(() => {
        progress += 1;
        bar.style.width = `${progress}%`;
        if (progress < 100) return;

        clearInterval(timer);
        button.textContent = "Enter!";
        button.classList.add("active");
        hint.classList.add("active");
        button.addEventListener("click", enter, { once: true });
    }, FAKE_LOADING_MS / 100);

    function enter() {
        gsap.to([title, bar.parentElement, hint], { opacity: 0, duration: 0.6, ease: "power2.inOut" });
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
