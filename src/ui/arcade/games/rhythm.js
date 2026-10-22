// ui/arcade/games/rhythm.js — Rhythm Tap: 4 làn nốt rơi theo nhịp, bấm đúng lúc nốt chạm vạch.
// Game tự tạo nhịp (trống 8-bit) vì nhạc nền piano không có nhịp đều để bắt theo.

const LANES = ["left", "up", "down", "right"];
const COLORS = ["#ff6bd6", "#66e0ff", "#7cf0c5", "#ffd166"];
const ARROWS = ["◀", "▲", "▼", "▶"];
const BPM = 112;
const BEAT = 60 / BPM;
const HIT_Y = 300;
const LANE_W = 64;
const WINDOWS = [[0.05, "PERFECT", 300], [0.1, "GREAT", 200], [0.15, "GOOD", 100]]; // giây lệch, nhãn, điểm

export default {
    id: "rhythm",
    title: "Rhythm Tap",
    tagline: "Hit the notes on the beat",
    controls: "◀ ▲ ▼ ▶ or click a lane",
    accent: "#66e0ff",

    drawIcon(ctx, s) {
        ctx.fillStyle = "#061225";
        ctx.fillRect(0, 0, s, s);
        const lw = s / 5;
        COLORS.forEach((color, i) => {
            const x = s * 0.1 + i * lw;
            ctx.strokeStyle = "rgba(120,190,255,0.25)";
            ctx.strokeRect(x, s * 0.08, lw - 4, s * 0.84);
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x + 4, s * (0.2 + ((i * 37) % 50) / 100), lw - 12, s * 0.08, 4);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + lw / 2 - 2, s * 0.8, lw * 0.28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        });
    },

    create({ W, H, sfx, onScore, onOver }) {
        const left = (W - LANE_W * 4) / 2;
        const notes = [];   // { lane, time, hit, missed }
        const flashes = [0, 0, 0, 0];
        let time = -1.2;    // đếm ngược trước nốt đầu tiên
        let beatIndex = 0;
        let nextBeat = 0;
        let speed = 260;    // px/giây nốt rơi
        let score = 0;
        let combo = 0;
        let health = 100;
        let judge = null;   // { text, color, t }
        let pulse = 0;
        let lastLane = 0;

        // Sinh nốt trước 2 phách; mật độ tăng dần (thêm nốt móc đơn, nốt đôi)
        function schedule(beat) {
            const t = beat * BEAT;
            const level = Math.min(4, Math.floor(beat / 16));
            const pick = () => {
                let lane;
                do lane = Math.floor(Math.random() * 4); while (lane === lastLane && Math.random() < 0.6);
                lastLane = lane;
                return lane;
            };
            if (beat % 4 === 3 && level < 1) return; // nghỉ một phách mỗi ô nhịp lúc đầu
            notes.push({ lane: pick(), time: t });
            if (level >= 1 && Math.random() < 0.15 * level) notes.push({ lane: pick(), time: t + BEAT / 2 });
            if (level >= 3 && Math.random() < 0.12) {
                const other = (lastLane + 2) % 4;
                notes.push({ lane: other, time: t });
            }
        }

        function hit(lane) {
            flashes[lane] = 1;
            const candidate = notes
                .filter((n) => n.lane === lane && !n.hit && !n.missed)
                .sort((a, b) => Math.abs(a.time - time) - Math.abs(b.time - time))[0];
            if (!candidate) return;
            const diff = Math.abs(candidate.time - time);
            const win = WINDOWS.find(([w]) => diff <= w);
            if (!win) return;
            candidate.hit = true;
            combo++;
            const mult = 1 + Math.floor(combo / 10);
            score += win[2] * mult;
            health = Math.min(100, health + 2);
            onScore(score);
            sfx.note(lane);
            judge = { text: win[1], color: COLORS[lane], t: 0, combo };
        }

        for (let b = 0; b < 4; b++) schedule(b);

        return {
            update(dt) {
                time += dt;
                speed = Math.min(420, 260 + time * 1.2);
                pulse = Math.max(0, pulse - dt * 4);
                flashes.forEach((f, i) => { flashes[i] = Math.max(0, f - dt * 5); });
                if (judge) judge.t += dt;

                // Phách: phát trống + lên lịch nốt cho 4 phách sau
                if (time >= nextBeat) {
                    (beatIndex % 2 === 0 ? sfx.kick : sfx.tick)();
                    pulse = beatIndex % 2 === 0 ? 1 : 0.5;
                    schedule(beatIndex + 4);
                    beatIndex++;
                    nextBeat = beatIndex * BEAT;
                }

                // Nốt trôi qua vạch quá cửa sổ GOOD → trượt
                notes.forEach((n) => {
                    if (!n.hit && !n.missed && time - n.time > WINDOWS[2][0]) {
                        n.missed = true;
                        combo = 0;
                        health -= 12;
                        judge = { text: "MISS", color: "#7d97bd", t: 0, combo: 0 };
                        sfx.hit();
                    }
                });
                while (notes.length && (notes[0].hit || notes[0].missed) && time - notes[0].time > 1) notes.shift();

                if (health <= 0) onOver(score);
            },
            render(ctx) {
                ctx.fillStyle = "#061225";
                ctx.fillRect(0, 0, W, H);

                // Cột equalizer hai bên đập theo nhịp
                for (let i = 0; i < 8; i++) {
                    const hgt = 30 + pulse * (40 + ((i * 53) % 60));
                    ctx.fillStyle = `rgba(102,224,255,${0.08 + pulse * 0.12})`;
                    ctx.fillRect(20 + i * 18, H - hgt, 12, hgt);
                    ctx.fillRect(W - 32 - i * 18, H - hgt, 12, hgt);
                }

                // Làn + vạch đánh
                LANES.forEach((_, i) => {
                    const x = left + i * LANE_W;
                    ctx.fillStyle = `rgba(77,153,255,${0.05 + flashes[i] * 0.25})`;
                    ctx.fillRect(x + 2, 0, LANE_W - 4, H);
                    ctx.strokeStyle = COLORS[i];
                    ctx.shadowColor = COLORS[i];
                    ctx.shadowBlur = 8 + flashes[i] * 20;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(x + LANE_W / 2, HIT_Y, 20 + flashes[i] * 4, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = COLORS[i];
                    ctx.font = "16px system-ui, sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(ARROWS[i], x + LANE_W / 2, HIT_Y + 6);
                });

                // Nốt
                notes.forEach((n) => {
                    if (n.hit) return;
                    const y = HIT_Y - (n.time - time) * speed;
                    if (y < -20 || y > H + 20) return;
                    const x = left + n.lane * LANE_W;
                    ctx.globalAlpha = n.missed ? 0.25 : 1;
                    ctx.shadowColor = COLORS[n.lane];
                    ctx.shadowBlur = 14;
                    ctx.fillStyle = COLORS[n.lane];
                    ctx.beginPath();
                    ctx.roundRect(x + 8, y - 8, LANE_W - 16, 16, 8);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1;
                });

                // Thanh máu
                ctx.fillStyle = "rgba(255,255,255,0.1)";
                ctx.fillRect(left, H - 14, LANE_W * 4, 5);
                ctx.fillStyle = health > 30 ? "#7cf0c5" : "#ff4d61";
                ctx.fillRect(left, H - 14, (LANE_W * 4 * Math.max(0, health)) / 100, 5);

                // Đánh giá + combo
                if (judge && judge.t < 0.6) {
                    const a = 1 - judge.t / 0.6;
                    ctx.globalAlpha = a;
                    ctx.fillStyle = judge.color;
                    ctx.font = `bold ${22 + (1 - a) * 6}px ui-monospace, Consolas, monospace`;
                    ctx.textAlign = "center";
                    ctx.fillText(judge.text, W / 2, 150 - (1 - a) * 12);
                    if (judge.combo > 1) {
                        ctx.font = "13px ui-monospace, Consolas, monospace";
                        ctx.fillStyle = "#e8f6ff";
                        ctx.fillText(`${judge.combo} COMBO`, W / 2, 172);
                    }
                    ctx.globalAlpha = 1;
                }
                if (time < 0) {
                    ctx.fillStyle = "#b2e7ff";
                    ctx.font = "bold 28px ui-monospace, Consolas, monospace";
                    ctx.textAlign = "center";
                    ctx.fillText(String(Math.ceil(-time / 0.4)), W / 2, 140);
                }
            },
            input(action, down) {
                const lane = LANES.indexOf(action);
                if (down && lane >= 0) hit(lane);
            },
            pointer(x, isDown) {
                if (!isDown) return;
                const lane = Math.floor((x - left) / LANE_W);
                if (lane >= 0 && lane < 4) hit(lane);
            },
        };
    },
};
