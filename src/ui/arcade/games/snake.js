// ui/arcade/games/snake.js — Neon Snake: rắn neon ăn chấm sáng, chạm tường/thân là thua.

const COLS = 32;
const ROWS = 18;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

export default {
    id: "snake",
    title: "Neon Snake",
    tagline: "Eat the light, don't bite yourself",
    controls: "Arrow keys, D-pad or click where to go",
    accent: "#7cf0c5",

    drawIcon(ctx, s) {
        ctx.fillStyle = "#061225";
        ctx.fillRect(0, 0, s, s);
        const c = s / 8;
        const body = [[1, 5], [2, 5], [3, 5], [3, 4], [3, 3], [4, 3], [5, 3]];
        ctx.shadowColor = "#7cf0c5";
        ctx.shadowBlur = c * 0.8;
        body.forEach(([x, y], i) => {
            ctx.fillStyle = `hsl(${160 + i * 10} 80% ${55 + i * 3}%)`;
            ctx.beginPath();
            ctx.roundRect(x * c + 2, y * c + 2, c - 4, c - 4, c * 0.3);
            ctx.fill();
        });
        ctx.shadowColor = "#ff6bd6";
        ctx.fillStyle = "#ff6bd6";
        ctx.beginPath();
        ctx.arc(6.5 * c, 1.5 * c, c * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    create({ W, H, sfx, onScore, onOver }) {
        const cell = Math.min(W / COLS, H / ROWS);
        const ox = (W - cell * COLS) / 2;
        const oy = (H - cell * ROWS) / 2;
        let snake = [[8, 9], [7, 9], [6, 9], [5, 9]];
        let dir = "right";
        let next = "right";
        let food = spawn();
        let step = 0.12;
        let acc = 0;
        let score = 0;
        let time = 0;

        function turn(to) {
            if (to === OPPOSITE[dir] || to === next || to === dir) return;
            next = to;
            sfx.move();
        }

        function spawn() {
            let p;
            do p = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)];
            while (snake.some(([x, y]) => x === p[0] && y === p[1]));
            return p;
        }

        function tick() {
            dir = next;
            const [dx, dy] = DIRS[dir];
            const head = [snake[0][0] + dx, snake[0][1] + dy];
            const out = head[0] < 0 || head[1] < 0 || head[0] >= COLS || head[1] >= ROWS;
            if (out || snake.some(([x, y]) => x === head[0] && y === head[1])) return onOver(score);
            snake.unshift(head);
            if (head[0] === food[0] && head[1] === food[1]) {
                score += 10;
                onScore(score);
                sfx.point();
                food = spawn();
                step = Math.max(0.06, step - 0.003);
            } else {
                snake.pop();
            }
        }

        return {
            update(dt) {
                time += dt;
                acc += dt;
                while (acc >= step) {
                    acc -= step;
                    tick();
                }
            },
            render(ctx) {
                ctx.fillStyle = "#061225";
                ctx.fillRect(0, 0, W, H);
                // Lưới mờ
                ctx.strokeStyle = "rgba(77,153,255,0.08)";
                ctx.lineWidth = 1;
                for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(ox + x * cell, oy); ctx.lineTo(ox + x * cell, oy + ROWS * cell); ctx.stroke(); }
                for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * cell); ctx.lineTo(ox + COLS * cell, oy + y * cell); ctx.stroke(); }

                // Mồi nhấp nháy
                const pulse = 0.35 + Math.sin(time * 8) * 0.08;
                ctx.shadowColor = "#ff6bd6";
                ctx.shadowBlur = 16;
                ctx.fillStyle = "#ff6bd6";
                ctx.beginPath();
                ctx.arc(ox + (food[0] + 0.5) * cell, oy + (food[1] + 0.5) * cell, cell * pulse, 0, Math.PI * 2);
                ctx.fill();

                // Thân rắn chuyển màu từ đầu tới đuôi
                ctx.shadowColor = "#7cf0c5";
                ctx.shadowBlur = 12;
                snake.forEach(([x, y], i) => {
                    ctx.fillStyle = `hsl(${165 + (i / snake.length) * 60} 85% ${i === 0 ? 75 : 58}%)`;
                    ctx.beginPath();
                    ctx.roundRect(ox + x * cell + 1.5, oy + y * cell + 1.5, cell - 3, cell - 3, cell * 0.3);
                    ctx.fill();
                });
                ctx.shadowBlur = 0;
            },
            input(action, down) {
                if (down && DIRS[action]) turn(action);
            },
            // Click/chạm: rẽ về phía điểm bấm theo trục lệch nhiều hơn so với đầu rắn;
            // nếu hướng đó là quay đầu ngược lại thì rẽ theo trục còn lại
            pointer(x, isDown, y) {
                if (!isDown) return;
                const dx = x - (ox + (snake[0][0] + 0.5) * cell);
                const dy = y - (oy + (snake[0][1] + 0.5) * cell);
                const horizontal = dx > 0 ? "right" : "left";
                const vertical = dy > 0 ? "down" : "up";
                const [main, other] = Math.abs(dx) > Math.abs(dy) ? [horizontal, vertical] : [vertical, horizontal];
                turn(main === OPPOSITE[dir] ? other : main);
            },
        };
    },
};
