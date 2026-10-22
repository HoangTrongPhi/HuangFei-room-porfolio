// ui/arcade/games/breakout.js — Brick Breaker: phá gạch màu dải LED RGB của căn phòng.

const BRICK_COLS = 10;
const BRICK_ROWS = 5;
const ROW_COLORS = ["#ff6bd6", "#a07bff", "#4d99ff", "#66e0ff", "#7cf0c5"];

export default {
    id: "breakout",
    title: "Brick Breaker",
    tagline: "Smash the RGB wall",
    controls: "◀ ▶ or drag to move · A to launch",
    accent: "#a07bff",

    drawIcon(ctx, s) {
        ctx.fillStyle = "#061225";
        ctx.fillRect(0, 0, s, s);
        const bw = s / 5;
        ROW_COLORS.slice(0, 4).forEach((color, r) => {
            for (let c = 0; c < 4; c++) {
                if ((r + c) % 3 === 2) continue;
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.fillStyle = color;
                ctx.fillRect(s * 0.1 + c * bw + 2, s * 0.14 + r * s * 0.1, bw - 4, s * 0.07);
            }
        });
        ctx.shadowColor = "#b2e7ff";
        ctx.fillStyle = "#b2e7ff";
        ctx.beginPath();
        ctx.arc(s * 0.6, s * 0.66, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(s * 0.32, s * 0.82, s * 0.36, s * 0.05);
        ctx.shadowBlur = 0;
    },

    create({ W, H, sfx, onScore, onOver }) {
        const paddle = { w: 96, h: 10, x: W / 2 - 48, y: H - 28, vx: 0 };
        const ball = { r: 6, x: 0, y: 0, vx: 0, vy: 0, stuck: true };
        const held = { left: false, right: false };
        let bricks = [];
        let level = 1;
        let lives = 3;
        let score = 0;
        let pointerX = null;

        function buildLevel() {
            const gap = 6;
            const bw = (W - 40 - gap * (BRICK_COLS - 1)) / BRICK_COLS;
            bricks = [];
            for (let r = 0; r < BRICK_ROWS; r++) {
                for (let c = 0; c < BRICK_COLS; c++) {
                    bricks.push({ x: 20 + c * (bw + gap), y: 40 + r * 22, w: bw, h: 14, color: ROW_COLORS[r], alive: true });
                }
            }
        }

        function resetBall() {
            ball.stuck = true;
            ball.vx = 0;
            ball.vy = 0;
        }

        function launch() {
            if (!ball.stuck) return;
            const speed = 300 + (level - 1) * 40;
            const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 0.8;
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
            ball.stuck = false;
            sfx.select();
        }

        buildLevel();

        return {
            update(dt) {
                // Thanh đỡ: phím giữ hoặc kéo chuột/ngón tay
                if (pointerX !== null) paddle.x += (pointerX - paddle.w / 2 - paddle.x) * Math.min(1, dt * 18);
                else paddle.x += ((held.right ? 1 : 0) - (held.left ? 1 : 0)) * 460 * dt;
                paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

                if (ball.stuck) {
                    ball.x = paddle.x + paddle.w / 2;
                    ball.y = paddle.y - ball.r - 1;
                    return;
                }

                ball.x += ball.vx * dt;
                ball.y += ball.vy * dt;

                if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; sfx.hit(); }
                if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx *= -1; sfx.hit(); }
                if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; sfx.hit(); }

                // Chạm thanh đỡ: góc bật phụ thuộc chỗ chạm (giữa → thẳng, mép → xiên)
                if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y < paddle.y + paddle.h
                    && ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) {
                    const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
                    const speed = Math.hypot(ball.vx, ball.vy) * 1.01;
                    const angle = -Math.PI / 2 + hit * 1.05;
                    ball.vx = Math.cos(angle) * speed;
                    ball.vy = Math.sin(angle) * speed;
                    ball.y = paddle.y - ball.r;
                    sfx.hit();
                }

                // Gạch: bật theo trục bị xuyên ít hơn
                for (const b of bricks) {
                    if (!b.alive) continue;
                    if (ball.x + ball.r < b.x || ball.x - ball.r > b.x + b.w || ball.y + ball.r < b.y || ball.y - ball.r > b.y + b.h) continue;
                    b.alive = false;
                    const overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
                    const overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
                    if (overlapX < overlapY) ball.vx *= -1; else ball.vy *= -1;
                    score += 10 * level;
                    onScore(score);
                    sfx.point();
                    break;
                }

                if (bricks.every((b) => !b.alive)) {
                    level++;
                    sfx.perfect();
                    buildLevel();
                    resetBall();
                }

                if (ball.y > H + ball.r) {
                    lives--;
                    if (lives <= 0) return onOver(score);
                    sfx.back();
                    resetBall();
                }
            },
            render(ctx) {
                ctx.fillStyle = "#061225";
                ctx.fillRect(0, 0, W, H);

                bricks.forEach((b) => {
                    if (!b.alive) return;
                    ctx.shadowColor = b.color;
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = b.color;
                    ctx.beginPath();
                    ctx.roundRect(b.x, b.y, b.w, b.h, 3);
                    ctx.fill();
                });

                ctx.shadowColor = "#66e0ff";
                ctx.shadowBlur = 14;
                ctx.fillStyle = "#b2e7ff";
                ctx.beginPath();
                ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Mạng + màn chơi
                ctx.fillStyle = "#7d97bd";
                ctx.font = "12px ui-monospace, Consolas, monospace";
                ctx.textAlign = "left";
                ctx.fillText(`LV ${level}  ${"♥".repeat(lives)}`, 12, H - 8);
                if (ball.stuck) {
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#b2e7ff";
                    ctx.fillText("PRESS A TO LAUNCH", W / 2, paddle.y - 30);
                }
            },
            input(action, down) {
                if (action === "left" || action === "right") {
                    held[action] = down;
                    pointerX = null;
                }
                if (action === "a" && down) launch();
            },
            pointer(x, isDown) {
                pointerX = x;
                if (isDown) launch();
            },
        };
    },
};
