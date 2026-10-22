// core/pixelPresets.js
// Các mẫu animation pixel 16 × 16 cho màn hình loa Divoom (vẽ bằng code, không cần ảnh).
// Mỗi mẫu: { id, name, fps, create() → { draw(ctx, dt, env) } } — create() tạo trạng thái riêng,
// nên cùng một mẫu có thể chạy song song trên loa và trên ô xem trước trong popup.
// Mép trên/dưới màn hình loa bị UV cắt ~1–2 pixel → nội dung chính nằm trong hàng 2 → 13.

const S = 16;

// Font pixel 3 × 5 cho số
const DIGITS = {
    0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"],
    2: ["111", "001", "111", "100", "111"], 3: ["111", "001", "111", "001", "111"],
    4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"],
    6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"],
    8: ["111", "101", "111", "101", "111"], 9: ["111", "101", "111", "001", "111"],
};

const px = (ctx, x, y, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); };
const clear = (ctx, color = "#000") => { ctx.fillStyle = color; ctx.fillRect(0, 0, S, S); };
// Vẽ hình từ mảng chuỗi: mỗi ký tự là 1 pixel, tra màu trong bảng (dấu chấm = trong suốt)
function sprite(ctx, rows, x0, y0, palette) {
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (palette[ch]) px(ctx, x0 + x, y0 + y, palette[ch]);
    }));
}
function digit(ctx, d, x0, y0, color) {
    DIGITS[d].forEach((row, y) => [...row].forEach((on, x) => on === "1" && px(ctx, x0 + x, y0 + y, color)));
}
const hsl = (h, s = 90, l = 55) => `hsl(${h % 360} ${s}% ${l}%)`;

export const PIXEL_PRESETS = [
    {
        id: "clock",
        name: "Clock",
        fps: 2,
        create: () => ({
            draw(ctx) {
                clear(ctx, "#020814");
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, "0");
                const mm = String(now.getMinutes()).padStart(2, "0");
                // Giờ hàng trên (cyan), phút hàng dưới (hồng), 2 chấm nhấp nháy ở giữa
                digit(ctx, hh[0], 4, 2, "#66e0ff");
                digit(ctx, hh[1], 9, 2, "#66e0ff");
                digit(ctx, mm[0], 4, 9, "#ff6bd6");
                digit(ctx, mm[1], 9, 9, "#ff6bd6");
                if (now.getSeconds() % 2) { px(ctx, 1, 7, "#ffd166"); px(ctx, 14, 8, "#ffd166"); }
            },
        }),
    },
    {
        id: "heart",
        name: "Heart",
        fps: 6,
        create: () => {
            const big = [".11...11.", "1111.1111", "111111111", "111111111", ".1111111.", "..11111..", "...111...", "....1...."];
            const small = ["..1...1..", ".111.111.", ".1111111.", "..11111..", "...111...", "....1...."];
            let frame = 0;
            return {
                draw(ctx) {
                    clear(ctx, "#12020a");
                    frame++;
                    const beat = frame % 6 < 2; // nhịp tim: đập mạnh 2 frame / 6
                    if (beat) sprite(ctx, big, 3, 4, { 1: "#ff3d6e" });
                    else sprite(ctx, small, 3, 5, { 1: "#ff6b8e" });
                    px(ctx, 5, beat ? 5 : 6, "#ffd1dc"); // điểm sáng trên tim
                },
            };
        },
    },
    {
        id: "equalizer",
        name: "Equalizer",
        fps: 15,
        create: () => {
            const heights = Array(8).fill(0);
            let t = 0;
            return {
                draw(ctx, dt, env) {
                    t += dt;
                    clear(ctx);
                    const bands = env?.bands;
                    heights.forEach((h, i) => {
                        // Có nhạc: lấy 4 dải tần (mỗi dải 2 cột); không có: sóng giả cho vẫn sống động
                        const v = bands ? bands[Math.floor(i / 2)] * (0.75 + 0.25 * Math.sin(t * 9 + i)) : 0.35 + 0.3 * Math.sin(t * 4 + i * 0.9);
                        heights[i] += (Math.max(0.08, v) * 12 - h) * 0.5;
                        const top = 14 - Math.round(heights[i]);
                        for (let y = 13; y >= top; y--) {
                            const color = y < 5 ? "#ff3df2" : y < 9 ? "#ffd166" : "#3dff9a";
                            ctx.fillStyle = color;
                            ctx.fillRect(i * 2, y, 2, 1);
                        }
                    });
                },
            };
        },
    },
    {
        id: "pacman",
        name: "Pac-Man",
        fps: 8,
        create: () => {
            const open = [".1111.", "111111", "1111..", "111...", "1111..", "111111", ".1111."];
            const shut = [".1111.", "111111", "111111", "111111", "111111", "111111", ".1111."];
            const ghost = [".1111.", "111111", "1.11.1", "111111", "111111", "1.1.11"];
            let x = -8;
            let frame = 0;
            return {
                draw(ctx) {
                    clear(ctx, "#00001a");
                    frame++;
                    x = x > 22 ? -14 : x + 1;
                    for (let dx = 0; dx < S; dx += 3) if (dx > x + 5) px(ctx, dx, 8, "#ffd1a6"); // chấm ăn
                    sprite(ctx, frame % 2 ? open : shut, x, 5, { 1: "#ffe14d" });
                    sprite(ctx, ghost, x - 9, 5, { 1: frame % 4 < 2 ? "#ff4d61" : "#ff7a8a" });
                    px(ctx, x - 8, 7, "#fff"); px(ctx, x - 5, 7, "#fff");
                },
            };
        },
    },
    {
        id: "invader",
        name: "Invader",
        fps: 3,
        create: () => {
            const a = ["..1.....1..", "...1...1...", "..1111111..", ".11.111.11.", "11111111111", "1.1111111.1", "1.1.....1.1", "...11.11..."];
            const b = ["..1.....1..", "1..1...1..1", "1.1111111.1", "111.111.111", "11111111111", ".111111111.", "..1.....1..", ".1.......1."];
            const stars = Array.from({ length: 6 }, () => [Math.floor(Math.random() * S), Math.floor(Math.random() * S)]);
            let frame = 0;
            return {
                draw(ctx) {
                    clear(ctx, "#030014");
                    frame++;
                    stars.forEach(([sx, sy], i) => (frame + i) % 3 && px(ctx, sx, sy, "#3a4a7a"));
                    sprite(ctx, frame % 2 ? a : b, 2, 4, { 1: "#7cf0c5" });
                },
            };
        },
    },
    {
        id: "fire",
        name: "Fire",
        fps: 14,
        create: () => {
            // Thuật toán lửa kiểu DOOM: hàng đáy luôn nóng nhất, nhiệt lan lên trên và nguội dần ngẫu nhiên
            const heat = new Float32Array(S * S);
            const color = (v) => (v < 0.05 ? "#000" : v < 0.3 ? `rgb(${Math.round(v * 600)},0,0)` : v < 0.6 ? `rgb(255,${Math.round((v - 0.3) * 700)},0)` : `rgb(255,${Math.min(255, 200 + v * 60)},${Math.round((v - 0.6) * 500)})`);
            return {
                draw(ctx) {
                    for (let x = 0; x < S; x++) heat[(S - 1) * S + x] = 0.7 + Math.random() * 0.3;
                    for (let y = 0; y < S - 1; y++) {
                        for (let x = 0; x < S; x++) {
                            const src = (y + 1) * S + Math.min(S - 1, Math.max(0, x + Math.round(Math.random() * 2 - 1)));
                            heat[y * S + x] = Math.max(0, heat[src] - Math.random() * 0.14);
                        }
                    }
                    for (let i = 0; i < S * S; i++) px(ctx, i % S, Math.floor(i / S), color(heat[i]));
                },
            };
        },
    },
    {
        id: "matrix",
        name: "Matrix",
        fps: 12,
        create: () => {
            const drops = Array.from({ length: S }, () => Math.random() * S);
            const speed = Array.from({ length: S }, () => 0.3 + Math.random() * 0.6);
            return {
                draw(ctx) {
                    ctx.fillStyle = "rgba(0,0,0,0.35)"; // để lại vệt mờ phía sau giọt
                    ctx.fillRect(0, 0, S, S);
                    drops.forEach((y, x) => {
                        px(ctx, x, Math.floor(y), "#c8ffd8");
                        px(ctx, x, Math.floor(y) - 1, "#3dff9a");
                        drops[x] = y > S + 4 ? -Math.random() * 6 : y + speed[x];
                    });
                },
            };
        },
    },
    {
        id: "rainbow",
        name: "Rainbow",
        fps: 12,
        create: () => {
            let t = 0;
            return {
                draw(ctx, dt) {
                    t += dt;
                    // Sóng cầu vồng chéo, giống chế độ LED mặc định của loa
                    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
                        px(ctx, x, y, hsl((x + y) * 14 + t * 120, 95, 50 + 10 * Math.sin(t * 3 + x * 0.6)));
                    }
                },
            };
        },
    },
];
