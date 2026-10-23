// ui/debugStats.js
// Bảng số liệu hiệu năng, chỉ hiện khi mở trang với ?debug (vd. https://.../?debug) — để đo trên điện thoại thật.
// FPS thật (khung hình đã render), thời gian mỗi khung, draw call, tam giác, độ phân giải render, giới hạn FPS.
import { h } from "./dom.js";

/** @returns {null | { frame: (delta: number, info: object) => void, set: (key: string, value: string) => void }} */
export function createDebugStats() {
    if (!new URLSearchParams(location.search).has("debug")) return null;

    const el = h("pre", {
        style: "position:fixed;left:8px;top:50%;z-index:99;margin:0;padding:8px 10px;border-radius:8px;"
            + "background:rgba(0,0,0,.75);color:#7cf0c5;font:11px/1.45 ui-monospace,Consolas,monospace;pointer-events:none;",
    });
    document.body.append(el);

    const extra = new Map();
    let frames = 0;
    let time = 0;
    let calls = 0;
    let triangles = 0;

    return {
        /** Gọi sau mỗi lần render cảnh, ngay sau renderer.render (trước bloom). */
        frame(delta, info) {
            frames++;
            time += delta;
            calls = info.render.calls;
            triangles = info.render.triangles;
            if (time < 0.5) return;
            const lines = [
                `fps    ${(frames / time).toFixed(0)}`,
                `frame  ${((time / frames) * 1000).toFixed(1)} ms`,
                `calls  ${calls}`,
                `tris   ${(triangles / 1000).toFixed(1)}k`,
                ...[...extra].map(([k, v]) => `${k.padEnd(6)} ${v}`),
            ];
            el.textContent = lines.join("\n");
            frames = 0;
            time = 0;
        },
        set(key, value) {
            extra.set(key, value);
        },
    };
}
