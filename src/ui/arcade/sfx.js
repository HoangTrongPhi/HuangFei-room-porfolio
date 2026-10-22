// ui/arcade/sfx.js — âm thanh 8-bit tạo bằng Web Audio (không cần file âm thanh).

let ctx = null;
let isMuted = () => false;

/** @param {() => boolean} fn - trả về true khi người xem đã tắt tiếng (dùng chung nút nhạc của HUD) */
export function setMutedSource(fn) {
    isMuted = fn;
}

function tone(freq, duration = 0.08, type = "square", volume = 0.04, slideTo = null) {
    if (isMuted()) return;
    try {
        ctx ??= new AudioContext();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
    } catch {
        // trình duyệt không hỗ trợ Web Audio → im lặng
    }
}

export const sfx = {
    move: () => tone(520, 0.04, "square", 0.025),
    select: () => tone(780, 0.07, "square", 0.04, 1180),
    back: () => tone(500, 0.07, "square", 0.035, 320),
    point: () => tone(990, 0.08, "triangle", 0.05, 1480),
    hit: () => tone(360, 0.05, "square", 0.03),
    perfect: () => { tone(1046, 0.08, "triangle", 0.05); setTimeout(() => tone(1568, 0.12, "triangle", 0.05), 70); },
    over: () => tone(330, 0.45, "sawtooth", 0.04, 90),
    // Nhịp cho Rhythm Tap: trống trầm ở phách mạnh, tiếng tick nhẹ ở phách thường
    kick: () => tone(140, 0.14, "sine", 0.12, 45),
    tick: () => tone(2400, 0.03, "square", 0.012),
    /** Nốt theo làn (0–3) khi bấm trúng */
    note: (lane) => tone([523, 659, 784, 988][lane] ?? 660, 0.09, "triangle", 0.045),
};
