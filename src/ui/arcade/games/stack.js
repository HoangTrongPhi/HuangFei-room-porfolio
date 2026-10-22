// ui/arcade/games/stack.js — Stack Tower: khối trượt qua lại, bấm A để thả; phần thừa bị cắt rơi xuống.

const BLOCK_H = 20;
const START_W = 240;
const PERFECT = 4; // px: lệch ít hơn mức này → khớp hoàn hảo, giữ nguyên bề rộng

export default {
    id: "stack",
    title: "Stack Tower",
    tagline: "Build it as high as you can",
    controls: "A / Space / tap to drop",
    accent: "#ffd166",

    drawIcon(ctx, s) {
        ctx.fillStyle = "#061225";
        ctx.fillRect(0, 0, s, s);
        const widths = [0.62, 0.56, 0.5, 0.5, 0.42, 0.36];
        widths.forEach((w, i) => {
            const color = `hsl(${30 + i * 28} 90% 62%)`;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = color;
            const offset = (i % 2 ? 1 : -1) * s * 0.03;
            ctx.fillRect(s * (0.5 - w / 2) + offset, s * (0.82 - i * 0.11), s * w, s * 0.09);
        });
        ctx.shadowBlur = 0;
    },

    create({ W, H, sfx, onScore, onOver }) {
        const colorOf = (i) => `hsl(${(30 + i * 14) % 360} 85% 62%)`;
        const tower = [{ x: W / 2 - START_W / 2, w: START_W }];
        const debris = [];
        let moving = null;
        let dir = 1;
        let speed = 170;
        let camera = 0; // cuộn lên khi tháp cao dần
        let flash = 0;
        let over = false;

        const levelY = (i) => H - 30 - (i + 1) * BLOCK_H + camera;

        function spawn() {
            const top = tower[tower.length - 1];
            dir = tower.length % 2 ? 1 : -1;
            // Xuất phát ló sẵn một phần ở mép màn hình để không phải chờ khối trượt vào
            moving = { x: dir > 0 ? -top.w * 0.3 : W - top.w * 0.7, w: top.w };
        }

        function drop() {
            if (!moving || over) return;
            const top = tower[tower.length - 1];
            let left = Math.max(moving.x, top.x);
            let right = Math.min(moving.x + moving.w, top.x + top.w);
            const overlap = right - left;

            if (overlap <= 0) {
                debris.push({ x: moving.x, y: levelY(tower.length), w: moving.w, vy: 0, color: colorOf(tower.length) });
                moving = null;
                over = true;
                sfx.over();
                setTimeout(() => onOver(tower.length - 1), 700);
                return;
            }

            if (Math.abs(moving.x - top.x) <= PERFECT) {
                left = top.x;
                right = top.x + top.w;
                flash = 1;
                sfx.perfect();
            } else {
                // Phần thừa rơi xuống
                const cutX = moving.x < top.x ? moving.x : right;
                debris.push({ x: cutX, y: levelY(tower.length), w: moving.w - overlap, vy: 0, color: colorOf(tower.length) });
                sfx.hit();
            }

            tower.push({ x: left, w: right - left });
            onScore(tower.length - 1);
            speed = Math.min(420, speed + 9);
            spawn();
        }

        spawn();

        return {
            update(dt) {
                if (moving) {
                    moving.x += dir * speed * dt;
                    if (moving.x > W - moving.w * 0.25) dir = -1;
                    if (moving.x < -moving.w * 0.75) dir = 1;
                }
                // Camera cuộn mượt để khối đang trượt luôn ở khoảng 1/3 trên màn hình
                const target = Math.max(0, (tower.length + 1) * BLOCK_H - H * 0.62);
                camera += (target - camera) * Math.min(1, dt * 5);
                debris.forEach((d) => { d.vy += 900 * dt; d.y += d.vy * dt; });
                flash = Math.max(0, flash - dt * 2.5);
            },
            render(ctx) {
                const grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0, "#0d2346");
                grad.addColorStop(1, "#061225");
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);

                const block = (x, y, w, color) => {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, w, BLOCK_H - 2);
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "rgba(255,255,255,0.25)";
                    ctx.fillRect(x, y, w, 3);
                };

                tower.forEach((b, i) => {
                    const y = levelY(i);
                    if (y < H + BLOCK_H) block(b.x, y, b.w, colorOf(i));
                });
                if (moving) block(moving.x, levelY(tower.length), moving.w, colorOf(tower.length));
                debris.forEach((d) => block(d.x, d.y, d.w, d.color)); // toạ độ màn hình, rơi ra ngoài là xong

                if (flash > 0) {
                    ctx.fillStyle = `rgba(255,255,255,${flash * 0.25})`;
                    ctx.fillRect(0, 0, W, H);
                    ctx.fillStyle = `rgba(255,209,102,${flash})`;
                    ctx.font = "bold 22px ui-monospace, Consolas, monospace";
                    ctx.textAlign = "center";
                    ctx.fillText("PERFECT!", W / 2, 60);
                }
            },
            input(action, down) {
                if (down && action === "a") drop();
            },
            pointer(_x, isDown) {
                if (isDown) drop();
            },
        };
    },
};
