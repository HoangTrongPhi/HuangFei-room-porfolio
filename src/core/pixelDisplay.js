// core/pixelDisplay.js
// Màn hình pixel 16 × 16 của loa Divoom trên bàn: thay texture mặc định bằng canvas vẽ mẫu animation
// (core/pixelPresets.js). Mẫu đang chọn được nhớ trong trình duyệt người xem.
import * as THREE from "three";
import { PIXEL_PRESETS } from "./pixelPresets.js";

const STORAGE_KEY = "divoom-preset";

/**
 * @param {THREE.Mesh} display - mesh "Display" của loa trong room_portfolio.glb
 * @param {{ getBands?: () => number[] | undefined }} [opt] - dải tần nhạc cho mẫu Equalizer
 */
export function createPixelDisplay(display, { getBands } = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 16;
    const ctx = canvas.getContext("2d");

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter; // giữ pixel vuông sắc nét, không bị nhoè
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.flipY = false; // UV của mesh theo quy ước glTF
    // Tự phát sáng, không qua tone mapping → màu pixel đúng như thiết kế (giống màn monitor)
    display.material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });

    const listeners = new Set();
    let preset = null;
    let instance = null;
    let acc = 0;

    function setPreset(id) {
        preset = PIXEL_PRESETS.find((p) => p.id === id) ?? PIXEL_PRESETS[0];
        instance = preset.create();
        acc = Infinity; // vẽ ngay frame tiếp theo
        try { localStorage.setItem(STORAGE_KEY, preset.id); } catch { /* bỏ qua */ }
        listeners.forEach((cb) => cb(preset));
    }

    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* bỏ qua */ }
    setPreset(saved ?? "rainbow");

    return {
        presets: PIXEL_PRESETS,
        /** Gọi mỗi frame; mỗi mẫu tự giới hạn tốc độ khung hình (fps) của nó */
        update(delta) {
            acc += delta;
            if (acc < 1 / preset.fps) return;
            instance.draw(ctx, Math.min(acc, 0.5), { bands: getBands?.() });
            texture.needsUpdate = true;
            acc = 0;
        },
        setPreset,
        get current() { return preset; },
        /** Chuyển mẫu kế tiếp / trước đó (dir = 1 | -1) */
        cycle(dir) {
            const i = PIXEL_PRESETS.indexOf(preset);
            setPreset(PIXEL_PRESETS[(i + dir + PIXEL_PRESETS.length) % PIXEL_PRESETS.length].id);
        },
        /** cb(preset) mỗi khi đổi mẫu — để popup và Room Control cùng cập nhật */
        onChange(cb) {
            listeners.add(cb);
        },
    };
}
