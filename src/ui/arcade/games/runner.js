// ui/arcade/games/runner.js — Neon Runner: chạy vô tận, nhảy qua cột neon, cúi tránh drone bay.

const GROUND = 300;     // y của mặt đất
const GRAVITY = 2300;
const JUMP_V = -760;
const PLAYER = { x: 90, w: 26, h: 34, duckH: 18 };

export default {
    id: "runner",
    title: "Neon Runner",
    tagline: "Run the synthwave highway",
    controls: "A / ▲ / click to jump · ▼ to duck",
    accent: "#ff6bd6",

    drawIcon(ctx, s) {
        const sky = ctx.createLinearGradient(0, 0, 0, s);
        sky.addColorStop(0, "#1a0b3a");
        sky.addColorStop(1, "#061225");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, s, s);
        // Mặt trời synthwave
        ctx.fillStyle = "#ff6bd6";
        ctx.shadowColor = "#ff6bd6";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.55, s * 0.22, Math.PI, 0);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#66e0ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.7);
        ctx.lineTo(s, s * 0.7);
        ctx.stroke();
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(s * 0.5 + i * s * 0.06, s * 0.7);
            ctx.lineTo(s * 0.5 + i * s * 0.3, s);
            ctx.stroke();
        }
        ctx.fillStyle = "#b2e7ff";
        ctx.shadowColor = "#66e0ff";
        ctx.shadowBlur = 10;
        ctx.fillRect(s * 0.22, s * 0.48, s * 0.1, s * 0.14);
        ctx.fillStyle = "#ff6bd6";
        ctx.fillRect(s * 0.66, s * 0.56, s * 0.07, s * 0.14);
        ctx.shadowBlur = 0;
    },

    create({ W, H, sfx, onScore, onOver }) {
        const player = { y: GROUND - PLAYER.h, vy: 0, ducking: false, onGround: true };
        const obstacles = [];
        const skyline = Array.from({ length: 24 }, (_, i) => ({
            x: i * 40, w: 26 + Math.random() * 20, h: 40 + Math.random() * 90,
            lit: Array.from({ length: 6 }, () => Math.random() > 0.6),
        }));
        let speed = 320;
        let distance = 0;
        let spawnIn = 1.2;
        let time = 0;
        let lastScore = 0;
        let dead = false;

        function jump() {
            if (!player.onGround || dead) return;
            player.vy = JUMP_V;
            player.onGround = false;
            sfx.select();
        }

        function spawn() {
            // Cột thấp / cột cao / drone bay ở độ cao đầu (phải cúi)
            const roll = Math.random();
            if (roll < 0.45) obstacles.push({ x: W + 20, w: 18, h: 30, y: GROUND - 30, color: "#ff6bd6" });
            else if (roll < 0.75) obstacles.push({ x: W + 20, w: 22, h: 52, y: GROUND - 52, color: "#a07bff" });
            // Drone: đáy cách đất 26px → đứng thẳng (cao 34) bị đụng, cúi (cao 18) thì lọt qua
            else obstacles.push({ x: W + 20, w: 34, h: 14, y: GROUND - 40, color: "#ffd166", drone: true });
            // Khoảng cách tối thiểu tăng theo tốc độ để luôn nhảy kịp
            spawnIn = 0.75 + Math.random() * 0.9 + 90 / speed;
        }

        return {
            update(dt) {
                if (dead) return;
                time += dt;
                speed = Math.min(780, speed + dt * 9);
                distance += speed * dt;

                const score = Math.floor(distance / 20);
                if (score !== lastScore) {
                    lastScore = score;
                    onScore(score);
                    if (score % 100 === 0) sfx.point();
                }

                // Nhân vật
                player.vy += GRAVITY * dt;
                player.y += player.vy * dt;
                const h = player.ducking && player.onGround ? PLAYER.duckH : PLAYER.h;
                if (player.y >= GROUND - h) {
                    player.y = GROUND - h;
                    player.vy = 0;
                    player.onGround = true;
                }

                // Chướng ngại
                spawnIn -= dt;
                if (spawnIn <= 0) spawn();
                obstacles.forEach((o) => { o.x -= speed * dt; });
                while (obstacles.length && obstacles[0].x + obstacles[0].w < -10) obstacles.shift();

                // Va chạm (thu hẹp hitbox 3px cho dễ chịu)
                const px = PLAYER.x + 3;
                const py = player.y + 3;
                const pw = PLAYER.w - 6;
                const ph = h - 6;
                for (const o of obstacles) {
                    if (px < o.x + o.w && px + pw > o.x && py < o.y + o.h && py + ph > o.y) {
                        dead = true;
                        return onOver(score);
                    }
                }

                // Toà nhà nền trôi chậm (parallax)
                skyline.forEach((b) => {
                    b.x -= speed * 0.15 * dt;
                    if (b.x + b.w < 0) b.x += skyline.length * 40;
                });
            },
            render(ctx) {
                const sky = ctx.createLinearGradient(0, 0, 0, H);
                sky.addColorStop(0, "#1a0b3a");
                sky.addColorStop(0.75, "#061225");
                ctx.fillStyle = sky;
                ctx.fillRect(0, 0, W, H);

                // Mặt trời
                ctx.fillStyle = "rgba(255,107,214,0.85)";
                ctx.shadowColor = "#ff6bd6";
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(W * 0.7, GROUND - 40, 70, Math.PI, 0);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Toà nhà + cửa sổ sáng
                skyline.forEach((b) => {
                    ctx.fillStyle = "#0b1630";
                    ctx.fillRect(b.x, GROUND - b.h, b.w, b.h);
                    b.lit.forEach((on, i) => {
                        if (!on) return;
                        ctx.fillStyle = i % 2 ? "rgba(102,224,255,0.6)" : "rgba(255,209,102,0.6)";
                        ctx.fillRect(b.x + 5 + (i % 2) * 10, GROUND - b.h + 8 + Math.floor(i / 2) * 14, 5, 6);
                    });
                });

                // Mặt đường lưới phối cảnh chạy về phía người xem
                ctx.fillStyle = "#061225";
                ctx.fillRect(0, GROUND, W, H - GROUND);
                ctx.strokeStyle = "rgba(102,224,255,0.45)";
                ctx.lineWidth = 1;
                const scroll = (distance * 0.5) % 24;
                for (let y = 0; y < H - GROUND; y += 12) {
                    const yy = GROUND + y + ((scroll / 24) * 12);
                    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
                }
                for (let i = -12; i <= 12; i++) {
                    ctx.beginPath();
                    ctx.moveTo(W / 2 + i * 30, GROUND);
                    ctx.lineTo(W / 2 + i * 120, H);
                    ctx.stroke();
                }
                ctx.strokeStyle = "#66e0ff";
                ctx.shadowColor = "#66e0ff";
                ctx.shadowBlur = 12;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

                // Chướng ngại
                obstacles.forEach((o) => {
                    ctx.shadowColor = o.color;
                    ctx.fillStyle = o.color;
                    if (o.drone) {
                        ctx.beginPath();
                        ctx.roundRect(o.x, o.y, o.w, o.h, 6);
                        ctx.fill();
                        // Cánh quạt nhấp nháy
                        ctx.fillRect(o.x - 4, o.y - 3 + Math.sin(time * 40) * 1.5, 12, 2);
                        ctx.fillRect(o.x + o.w - 8, o.y - 3 - Math.sin(time * 40) * 1.5, 12, 2);
                    } else {
                        ctx.fillRect(o.x, o.y, o.w, o.h);
                    }
                });

                // Nhân vật: khối neon, cúi thì bẹp xuống, chạy thì nhún nhẹ
                const h = player.ducking && player.onGround ? PLAYER.duckH : PLAYER.h;
                const bob = player.onGround ? Math.abs(Math.sin(time * 18)) * 2 : 0;
                ctx.shadowColor = "#66e0ff";
                ctx.shadowBlur = 16;
                ctx.fillStyle = "#b2e7ff";
                ctx.beginPath();
                ctx.roundRect(PLAYER.x, player.y - bob, PLAYER.w, h, 5);
                ctx.fill();
                ctx.fillStyle = "#061225";
                ctx.fillRect(PLAYER.x + PLAYER.w - 9, player.y - bob + 7, 4, 4); // mắt
                ctx.shadowBlur = 0;
            },
            input(action, down) {
                if (action === "down") player.ducking = down;
                if (down && (action === "a" || action === "up")) jump();
            },
            pointer(_x, isDown) {
                if (isDown) jump();
            },
        };
    },
};
