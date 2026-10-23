// core/adaptiveQuality.js
// Chất lượng tự động: đo FPS theo từng cửa sổ 2 giây; máy không kham nổi thì hạ pixel ratio
// từng bậc, chạy dư sức lâu thì nâng lại một bậc. Hạ tới bậc thấp nhất mà vẫn chậm → khoá 30fps
// (khung hình đều, đỡ nóng máy), định kỳ thử mở khoá lại. Điện thoại yếu vẫn mượt, máy mạnh vẫn nét.
import { isMobile, maxPixelRatio } from "./device.js";

const WINDOW = 2;        // giây mỗi lần đo
const LOW_FPS = 45;      // dưới mức này → hạ bậc
const HIGH_FPS = 57;     // trên mức này đủ lâu → thử nâng bậc
const RAISE_AFTER = 4;   // số cửa sổ liên tiếp đạt HIGH_FPS trước khi nâng
const CAP_FPS = 30;      // khoá FPS khi đã hạ hết độ phân giải mà vẫn chậm
const CAP_OK_FPS = 28;   // đang khoá mà giữ được mức này → máy kham được 30fps
const UNCAP_AFTER = 15;  // số cửa sổ ổn định (30 giây) trước lần đầu thử mở khoá; mỗi lần thử thất bại thì gấp đôi

/**
 * @param {import("three").WebGLRenderer} renderer
 * @param {(state: {pixelRatio: number, fpsCap: number}) => void} onChange - cập nhật các thứ phụ thuộc (hạt sáng, bảng debug...)
 */
export function createAdaptiveQuality(renderer, onChange) {
    const top = maxPixelRatio();
    const floor = isMobile ? 0.75 : 1;
    // Các bậc từ cao xuống thấp, vd. điện thoại DPR 3: 1.5 → 1.25 → 1 → 0.75
    const steps = [top];
    while (steps.at(-1) - 0.25 >= floor - 1e-6) steps.push(+(steps.at(-1) - 0.25).toFixed(2));

    let level = 0;
    let fpsCap = 0; // 0 = không khoá
    let time = 0;
    let frames = 0;
    let good = 0;
    let lowStreak = 0;
    let capOk = 0;
    let uncapAfter = UNCAP_AFTER;
    let triedUncap = false; // đã từng mở khoá thử → lần khoá lại sau đó nghĩa là thử thất bại

    const emit = () => onChange?.({ pixelRatio: steps[level], fpsCap });

    function setLevel(next) {
        level = Math.max(0, Math.min(steps.length - 1, next));
        renderer.setPixelRatio(steps[level]);
        emit();
    }

    function setCap(value) {
        fpsCap = value;
        capOk = 0;
        good = 0;
        lowStreak = 0;
        emit();
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

            if (fpsCap) {
                // Giữ được 30fps ổn định một thời gian → thử mở khoá xem máy đã đỡ tải chưa (vd. hết video, hết intro)
                capOk = fps >= CAP_OK_FPS ? capOk + 1 : 0;
                if (capOk >= uncapAfter) {
                    triedUncap = true;
                    setCap(0);
                }
                return;
            }
            if (fps < LOW_FPS) {
                good = 0;
                // Desktop: cần 2 lần đo thấp liên tiếp (tránh hạ vì một lần khựng)
                if (++lowStreak < (isMobile ? 1 : 2)) return;
                lowStreak = 0;
                if (level < steps.length - 1) setLevel(level + 1);
                else {
                    // Đã thấp nhất mà vẫn chậm → khoá 30fps; nếu đây là lần mở khoá thất bại thì lần sau chờ lâu hơn
                    if (triedUncap && uncapAfter < UNCAP_AFTER * 8) uncapAfter *= 2;
                    setCap(CAP_FPS);
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
        /** FPS tối đa đang khoá (0 = không khoá) — vòng render bỏ qua khung hình để giữ mức này */
        get fpsCap() {
            return fpsCap;
        },
    };
}
