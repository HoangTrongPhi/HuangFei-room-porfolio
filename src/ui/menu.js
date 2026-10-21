// ui/menu.js
// Menu overlay bên phải: các nút mở popup + nút bật/tắt nhạc.
import gsap from "gsap";
import { track } from "../core/analytics.js";
import { toast } from "./toast.js";

/**
 * @param {Object<string,(item: HTMLElement) => void>} actions - { giá trị data-link: hàm xử lý khi bấm }
 * @param {() => HTMLAudioElement | null} getMusic - lấy audio hiện tại (null nếu chưa phát)
 */
export function initMenu(actions, getMusic) {
    document.querySelectorAll("#ui-overlay .menu-item[data-link]").forEach((item) => {
        item.addEventListener("click", () => {
            track("click", item.dataset.link.replace("#", ""));
            // Nảy nhẹ trong lúc popup mở ra từ chính nút này
            gsap.timeline()
                .to(item, { scale: 1.25, duration: 0.15, ease: "back.out(3)" })
                .to(item, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
            actions[item.dataset.link]?.(item);
        });
    });

    const soundToggle = document.querySelector("#sound-toggle");
    soundToggle?.addEventListener("click", () => {
        const music = getMusic();
        if (!music) return;
        music.muted = !music.muted;
        soundToggle.textContent = music.muted ? "🔇" : "🔊";
        toast(music.muted ? "Music off" : "Music on");
    });
}
