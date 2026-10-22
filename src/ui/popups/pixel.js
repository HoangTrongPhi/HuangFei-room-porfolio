// ui/popups/pixel.js
// Popup chọn hình cho màn pixel của loa Divoom (mở khi bấm vào loa). Popup dạng "live": nằm cạnh phải,
// cảnh 3D không bị che nên thấy loa đổi hình ngay khi chọn. Mỗi ô có bản xem trước chạy trực tiếp.
import { h } from "../dom.js";
import { createPopup } from "../popup.js";
import { track } from "../../core/analytics.js";

/**
 * @param {ReturnType<import("../../core/pixelDisplay.js").createPixelDisplay>} display
 * @param {() => number[] | undefined} getBands - dải tần nhạc cho bản xem trước Equalizer
 */
export function createPixelPopup(display, getBands) {
    const tiles = display.presets.map((preset) => {
        const canvas = h("canvas", { class: "px-preview", width: 16, height: 16, "aria-hidden": "true" });
        const button = h("button", {
            class: "px-tile", type: "button", "aria-pressed": "false",
            onClick: () => {
                display.setPreset(preset.id);
                track("click", `pixel-${preset.id}`);
            },
        }, canvas, h("span", {}, preset.name));
        return { preset, button, ctx: canvas.getContext("2d"), instance: null, acc: 0 };
    });

    const body = h("div", { class: "px" },
        h("p", { class: "px-intro", "data-stagger": true }, "Pick an animation — it plays live on the speaker."),
        h("div", { class: "px-grid", "data-stagger": true }, tiles.map((t) => t.button)),
        h("p", { class: "px-hint", "data-stagger": true }, "◀ ▶ to switch · Esc to close"),
    );

    function markActive(preset) {
        tiles.forEach((t) => {
            const on = t.preset === preset;
            t.button.classList.toggle("is-active", on);
            t.button.setAttribute("aria-pressed", String(on));
        });
    }
    display.onChange(markActive);
    markActive(display.current);

    // Bản xem trước: chỉ chạy khi popup đang mở
    let raf = 0;
    let last = 0;
    function loop(now) {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        const env = { bands: getBands() };
        tiles.forEach((t) => {
            t.acc += dt;
            if (t.acc < 1 / t.preset.fps) return;
            t.instance.draw(t.ctx, Math.min(t.acc, 0.5), env); // lần vẽ đầu acc = Infinity → kẹp lại
            t.acc = 0;
        });
        raf = requestAnimationFrame(loop);
    }

    const onKey = (e) => {
        if (e.key === "ArrowRight") display.cycle(1);
        else if (e.key === "ArrowLeft") display.cycle(-1);
    };

    return createPopup("pixel", {
        title: "divoom_pixel",
        anim: "window",
        className: "popup-panel--pixel",
        live: true,
        body,
        onOpen() {
            tiles.forEach((t) => { t.instance = t.preset.create(); t.acc = Infinity; });
            last = performance.now();
            raf = requestAnimationFrame(loop);
            window.addEventListener("keydown", onKey);
        },
        onClose() {
            cancelAnimationFrame(raf);
            window.removeEventListener("keydown", onKey);
        },
    });
}
