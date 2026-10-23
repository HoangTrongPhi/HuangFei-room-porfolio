// core/adaptiveQuality.js
// Độ phân giải tự động: đo FPS theo từng cửa sổ 2 giây; máy không kham nổi thì hạ pixel ratio
// từng bậc, chạy dư sức lâu thì nâng lại một bậc. Điện thoại yếu vẫn mượt, máy mạnh vẫn nét.
import { isMobile, maxPixelRatio } from "./device.js";

const WINDOW = 2;        // giây mỗi lần đo
const LOW_FPS = 45;      // dưới mức này → hạ bậc
const HIGH_FPS = 57;     // trên mức này đủ lâu → thử nâng bậc
const RAISE_AFTER = 4;   // số cửa sổ liên tiếp đạt HIGH_FPS trước khi nâng

/**
 * @param {import("three").WebGLRenderer} renderer
 * @param {(pixelRatio: number) => void} onChange - cập nhật các thứ phụ thuộc pixel ratio (bloom, hạt sáng...)
 */
export function createAdaptiveQuality(renderer, onChange) {
    const top = maxPixelRatio();
    const floor = isMobile ? 0.75 : 1;
    // Các bậc từ cao xuống thấp, vd. điện thoại DPR 3: 1.5 → 1.25 → 1 → 0.75
    const steps = [top];
    while (steps.at(-1) - 0.25 >= floor - 1e-6) steps.push(+(steps.at(-1) - 0.25).toFixed(2));

    let level = 0;
    let time = 0;
    let frames = 0;
    let good = 0;
    let lowStreak = 0;

    function setLevel(next) {
        level = Math.max(0, Math.min(steps.length - 1, next));
        renderer.setPixelRatio(steps[level]);
        onChange?.(steps[level]);
    }

    return {
        /** Gọi mỗi frame có render, với delta (giây). */
        update(delta) {
            if (delta > 0.25) return; // vừa quay lại tab / bị khựng do tải: không tính
            time += delta;
            frames++;
            if (time < WINDOW) return;
            const fps = frames / time;
            time = 0;
            frames = 0;
            if (fps < LOW_FPS) {
                good = 0;
                // Desktop: cần 2 lần đo thấp liên tiếp (tránh hạ vì một lần khựng)
                if (++lowStreak >= (isMobile ? 1 : 2) && level < steps.length - 1) {
                    lowStreak = 0;
                    setLevel(level + 1);
                }
            } else {
                lowStreak = 0;
                if (fps > HIGH_FPS && level > 0 && ++good >= RAISE_AFTER) {
                    good = 0;
                    setLevel(level - 1);
                }
            }
        },
        /** Cửa sổ đổi kích thước: giữ bậc hiện tại (maxPixelRatio có thể đổi khi xoay màn hình) */
        reset() {
            steps[0] = maxPixelRatio();
            setLevel(level);
        },
        get pixelRatio() {
            return steps[level];
        },
    };
}
