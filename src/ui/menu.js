// ui/menu.js
// Menu overlay bên phải: các nút mở link + nút bật/tắt nhạc.
import gsap from "gsap";

/**
 * @param {Object<string,string>} links - { giá trị data-link: URL }
 * @param {() => HTMLAudioElement | null} getMusic - lấy audio hiện tại (null nếu chưa phát)
 */
export function initMenu(links, getMusic) {
    document.querySelectorAll("#ui-overlay .menu-item[data-link]").forEach((item) => {
        item.addEventListener("click", () => {
            const url = links[item.dataset.link];
            // Nảy lên rồi thu về, xong mới mở link
            gsap.timeline({ onComplete: () => url && window.open(url, "_blank", "noopener,noreferrer") })
                .to(item, { scale: 5, duration: 0.2, ease: "back.out(2)" })
                .to(item, { scale: 1, duration: 0.2, ease: "back.out(2)" });
        });
    });

    const soundToggle = document.querySelector("#sound-toggle");
    soundToggle?.addEventListener("click", () => {
        const music = getMusic();
        if (!music) return;
        music.muted = !music.muted;
        soundToggle.textContent = music.muted ? "🔇" : "🔊";
    });
}
