// core/audioLevel.js
// Đo độ lớn nhạc nền theo thời gian thực (Web Audio) để LED trong phòng nháy theo nhạc.
// Phải tạo sau một thao tác của người dùng (nút Enter) thì trình duyệt mới cho chạy AudioContext.

/**
 * @param {HTMLAudioElement} audio
 * @returns {{ getLevel: () => number, getBands: () => number[] }}
 *   getLevel: độ lớn chung 0 → 1, gọi mỗi frame (cập nhật luôn các dải)
 *   getBands: 4 dải tần 0 → 1 (trầm → cao) cho thanh equalizer, đọc sau getLevel
 */
export function createAudioLevel(audio) {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    // Sau khi nối vào AudioContext, âm thanh chỉ phát ra qua context → phải nối tiếp ra loa
    ctx.createMediaElementSource(audio).connect(analyser);
    analyser.connect(ctx.destination);

    const data = new Uint8Array(analyser.frequencyBinCount);
    let peak = 0.05;
    let level = 0;

    // Các dải tần cho equalizer (chỉ số bin, mỗi bin ≈ 170 Hz); mỗi dải tự cân bằng theo đỉnh riêng
    const BAND_RANGES = [[1, 3], [3, 8], [8, 18], [18, 40]];
    const bands = BAND_RANGES.map(() => 0);
    const bandPeaks = BAND_RANGES.map(() => 0.05);

    function updateBands() {
        BAND_RANGES.forEach(([from, to], i) => {
            let sum = 0;
            for (let b = from; b < to; b++) sum += data[b];
            const value = sum / (to - from) / 255;
            bandPeaks[i] = Math.max(value, bandPeaks[i] * 0.995, 0.05);
            const target = Math.min(1, (value / bandPeaks[i]) ** 2);
            bands[i] += (target - bands[i]) * (target > bands[i] ? 0.6 : 0.15);
        });
    }

    function getLevel() {
        if (audio.paused || audio.muted) {
            bands.forEach((v, i) => (bands[i] = v * 0.9));
            return (level *= 0.9);
        }
        analyser.getByteFrequencyData(data);
        updateBands();

        // Dải trầm–trung (khoảng 170 Hz → 4 kHz): nhạc piano ít bass nên lấy rộng
        let sum = 0;
        for (let i = 1; i < 24; i++) sum += data[i];
        const value = sum / 23 / 255;

        // Tự cân bằng theo đoạn to nhất gần đây, để bài nhỏ hay to đều nháy rõ
        peak = Math.max(value, peak * 0.995, 0.05);
        const target = Math.min(1, (value / peak) ** 3);
        level += (target - level) * (target > level ? 0.5 : 0.12); // lên nhanh, xuống chậm
        return level;
    }

    return { getLevel, getBands: () => bands };
}
