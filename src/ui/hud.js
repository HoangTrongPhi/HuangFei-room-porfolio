// ui/hud.js
// Lớp thông tin cố định trên cảnh 3D sau khi vào phòng:
//   - thẻ tên góc trái trên: tên, vai trò, trạng thái nhận việc, giờ địa phương
//   - widget nhạc góc trái dưới: tên bài, thanh equalizer nhảy theo nhạc, bấm để bật/tắt tiếng
import gsap from "gsap";
import { h } from "./dom.js";
import { toast } from "./toast.js";
import { makeDraggable } from "./draggable.js";

/**
 * @param {object} opt
 * @param {{name:string, role:string, status?:string, location?:string, timeZone?:string}} opt.profile
 * @param {string} opt.trackTitle
 * @param {() => HTMLAudioElement | null} opt.getMusic
 */
export function createHud({ profile, trackTitle, getMusic }) {
    // ===== Thẻ tên =====
    const words = profile.name.split(/\s+/).filter(Boolean);
    const initials = (words[0][0] + (words.length > 1 ? words.at(-1)[0] : "")).toUpperCase();
    const clock = h("span", { class: "hud-clock" });

    const card = h("aside", { class: "hud hud-card", "aria-label": "Profile" },
        h("div", { class: "hud-avatar", "aria-hidden": "true" }, initials),
        h("div", { class: "hud-card-text" },
            h("strong", { class: "hud-name" }, profile.name),
            h("span", { class: "hud-role" }, profile.role),
            h("span", { class: "hud-meta" },
                profile.status && h("span", { class: "hud-status" }, h("i", { "aria-hidden": "true" }), profile.status),
                clock,
            ),
        ),
    );

    const timeFormat = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: profile.timeZone || undefined,
    });
    const tickClock = () => {
        clock.textContent = `${profile.location ? `${profile.location} · ` : ""}${timeFormat.format(new Date())}`;
    };
    tickClock();
    setInterval(tickClock, 30_000);

    // ===== Widget nhạc =====
    const bars = [0, 1, 2, 3].map(() => h("span", { class: "eq-bar" }));
    const state = h("span", { class: "hud-music-state" }, "Now playing");
    const music = h("button", { class: "hud hud-music", type: "button", "aria-label": "Mute music", "aria-pressed": "false", onClick: toggle },
        h("span", { class: "eq", "aria-hidden": "true" }, bars),
        h("span", { class: "hud-music-text" }, state, h("strong", {}, trackTitle)),
    );

    function toggle() {
        const audio = getMusic();
        if (!audio) return;
        audio.muted = !audio.muted;
        music.classList.toggle("is-muted", audio.muted);
        music.setAttribute("aria-pressed", String(audio.muted));
        music.setAttribute("aria-label", audio.muted ? "Unmute music" : "Mute music");
        state.textContent = audio.muted ? "Muted" : "Now playing";
        toast(audio.muted ? "Music off" : "Music on");
    }

    const root = h("div", { class: "hud-root", hidden: true }, card, music);
    document.body.append(root);
    makeDraggable(card, { key: "profile" });

    return {
        show() {
            root.hidden = false;
            gsap.from(card, { x: -30, opacity: 0, duration: 0.6, ease: "power3.out", clearProps: "transform,opacity" }); // giữ left/top nếu thẻ đã bị kéo đi
            gsap.from(music, { y: 30, opacity: 0, duration: 0.6, delay: 0.15, ease: "power3.out", clearProps: "all" });
        },
        /** Gọi mỗi frame với 4 dải tần 0 → 1. */
        updateBands(values) {
            if (root.hidden) return;
            bars.forEach((bar, i) => {
                bar.style.transform = `scaleY(${0.15 + (values?.[i] ?? 0) * 0.85})`;
            });
        },
    };
}
