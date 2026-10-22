// ui/arcade/console.js
// Màn hình máy chơi game cầm tay (mở khi bấm vào máy Switch trên bàn):
// khung máy + 2 Joy-Con (nút bấm được — trên điện thoại chính là tay cầm), màn hình Home chọn game,
// chạy mini game trên canvas, lưu điểm cao trong trình duyệt + bảng xếp hạng chung (api/leaderboard.js).
import gsap from "gsap";
import { h } from "../dom.js";
import { createPopup } from "../popup.js";
import { track } from "../../core/analytics.js";
import { sfx } from "./sfx.js";
import snake from "./games/snake.js";
import breakout from "./games/breakout.js";
import stack from "./games/stack.js";
import runner from "./games/runner.js";
import rhythm from "./games/rhythm.js";
import { fetchTop, submitScore, getSavedName, saveName, NAME_PATTERN } from "./leaderboard.js";

const GAMES = [snake, runner, rhythm, breakout, stack];
const W = 640;
const H = 360;

// Bàn phím → hành động (A = Space/Enter/J/Z, B = Backspace/K/X; Esc đóng cả màn hình — do popup.js xử lý)
const KEYS = {
    ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
    Space: "a", Enter: "a", KeyJ: "a", KeyZ: "a",
    Backspace: "b", KeyK: "b", KeyX: "b",
    KeyP: "plus", KeyH: "home", KeyY: "y", KeyL: "y",
};

// Điểm cao lưu trong localStorage của từng người xem (có thể bị chặn → bỏ qua)
const bestKey = (id) => `arcade-best-${id}`;
function getBest(id) {
    try { return Number(localStorage.getItem(bestKey(id))) || 0; } catch { return 0; }
}
function setBest(id, score) {
    try { localStorage.setItem(bestKey(id), String(score)); } catch { /* bỏ qua */ }
}

export function createArcade() {
    let selected = 0;
    let mode = "home"; // home | ready | playing | paused | over
    let game = null;   // instance của game đang chạy
    let session = 0;   // tăng mỗi lần vào game, để bỏ qua callback trễ của lượt chơi cũ
    let raf = 0;
    let last = 0;
    let isOpen = false;

    // ===== Màn hình Home =====
    const clock = h("span", { class: "arc-clock" });
    const tiles = GAMES.map((g, i) => {
        const icon = h("canvas", { class: "arc-tile-icon", width: 160, height: 160, "aria-hidden": "true" });
        g.drawIcon(icon.getContext("2d"), 160);
        return h("button", {
            class: "arc-tile", type: "button", "aria-label": g.title, style: `--accent: ${g.accent}`,
            onClick: () => { if (selected === i) start(); else select(i); },
        }, icon);
    });
    const tileTitle = h("strong", { class: "arc-home-title" });
    const tileInfo = h("span", { class: "arc-home-info" });

    const home = h("div", { class: "arc-home" },
        h("div", { class: "arc-topbar" },
            h("span", { class: "arc-user", "aria-hidden": "true" }, "HP"),
            h("span", { class: "arc-topbar-right" }, clock, h("span", { class: "arc-battery", "aria-hidden": "true" })),
        ),
        h("div", { class: "arc-tiles", role: "listbox", "aria-label": "Games" }, tiles),
        h("div", { class: "arc-home-text" }, tileTitle, tileInfo),
        h("div", { class: "arc-hints" },
            h("span", {}, h("b", {}, "A"), " Start"),
            h("span", {}, h("b", {}, "◀ ▶"), " Select"),
            h("span", {}, h("b", {}, "Y"), " Ranking"),
            h("span", {}, h("b", {}, "Esc"), " Close"),
        ),
    );

    // ===== Màn hình chơi =====
    const canvas = h("canvas", { class: "arc-canvas", "aria-label": "Game screen" });
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const hudTitle = h("span", {});
    const hudScore = h("strong", {}, "0");
    const hudBest = h("span", {});
    const message = h("div", { class: "arc-message" });
    const play = h("div", { class: "arc-play", hidden: true },
        h("div", { class: "arc-play-hud" }, hudTitle, hudScore, hudBest),
        h("div", { class: "arc-canvas-wrap" }, canvas, message),
    );

    // ===== Bảng xếp hạng (phủ lên màn hình) =====
    const boardTitle = h("strong", {});
    const boardList = h("ol", { class: "arc-board-list" });
    const boardEl = h("div", { class: "arc-board", hidden: true, role: "dialog", "aria-label": "Leaderboard" },
        h("div", { class: "arc-board-head" }, h("span", { "aria-hidden": "true" }, "🏆"), boardTitle),
        boardList,
        h("button", { class: "arc-board-close", type: "button", onClick: () => closeBoard() }, "B  Back"),
    );
    let boardOpen = false;

    // tabindex để nhận focus: không để nút nào đang focus, tránh Space/Enter vừa điều khiển game vừa "bấm" nút đó
    const screen = h("div", { class: "arc-screen", tabindex: "-1" }, home, play, boardEl);

    // ===== Joy-Con (nút bấm được) =====
    const pad = (action, label, cls) => {
        const btn = h("button", { class: `arc-btn ${cls}`, type: "button", "aria-label": label, "data-action": action }, cls.includes("dpad") ? "" : label);
        const press = (down) => (e) => { e.preventDefault(); input(action, down); btn.classList.toggle("is-down", down); };
        btn.addEventListener("pointerdown", press(true));
        ["pointerup", "pointerleave", "pointercancel"].forEach((t) => btn.addEventListener(t, press(false)));
        return btn;
    };

    const left = h("div", { class: "arc-joycon arc-joycon--left" },
        pad("minus", "−", "arc-btn--small arc-minus"),
        h("span", { class: "arc-stick", "aria-hidden": "true" }),
        h("div", { class: "arc-dpad" },
            pad("up", "Up", "arc-dpad-btn arc-dpad--up"),
            pad("left", "Left", "arc-dpad-btn arc-dpad--left"),
            pad("right", "Right", "arc-dpad-btn arc-dpad--right"),
            pad("down", "Down", "arc-dpad-btn arc-dpad--down"),
        ),
        h("span", { class: "arc-capture", "aria-hidden": "true" }),
    );
    const right = h("div", { class: "arc-joycon arc-joycon--right" },
        pad("plus", "+", "arc-btn--small arc-plus"),
        h("div", { class: "arc-abxy" },
            pad("x", "X", "arc-face arc-face--x"),
            pad("y", "Y", "arc-face arc-face--y"),
            pad("a", "A", "arc-face arc-face--a"),
            pad("b", "B", "arc-face arc-face--b"),
        ),
        h("span", { class: "arc-stick", "aria-hidden": "true" }),
        pad("home", "Home", "arc-btn--small arc-home-btn"),
    );

    const body = h("div", { class: "arc" }, left, screen, right);

    // ===== Điều hướng =====
    function select(i, silent = false) {
        selected = (i + GAMES.length) % GAMES.length;
        tiles.forEach((t, j) => {
            t.classList.toggle("is-selected", j === selected);
            t.setAttribute("aria-selected", String(j === selected));
        });
        const g = GAMES[selected];
        tileTitle.textContent = g.title;
        const best = getBest(g.id);
        tileInfo.textContent = `${g.tagline}${best ? ` · Best ${best}` : ""}`;
        if (silent) return;
        gsap.fromTo(tiles[selected], { scale: 0.92 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
        sfx.move();
    }

    function start() {
        const g = GAMES[selected];
        track("click", `game-${g.id}`);
        sfx.select();
        home.hidden = true;
        play.hidden = false;
        hudTitle.textContent = g.title;
        newRound();
        gsap.fromTo(play, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
    }

    function newRound() {
        const g = GAMES[selected];
        const id = ++session;
        hudScore.textContent = "0";
        hudBest.textContent = `BEST ${getBest(g.id)}`;
        game = g.create({
            W, H, sfx,
            onScore: (score) => {
                if (id !== session) return;
                hudScore.textContent = String(score);
                gsap.fromTo(hudScore, { scale: 1.4 }, { scale: 1, duration: 0.25, ease: "back.out(3)" });
            },
            onOver: (score) => {
                if (id !== session || mode !== "playing") return;
                gameOver(score);
            },
        });
        mode = "ready";
        game.render(ctx);
        showMessage(g.title, g.controls, "A to start");
    }

    function gameOver(score) {
        const g = GAMES[selected];
        const best = getBest(g.id);
        const record = score > best;
        if (record) setBest(g.id, score);
        mode = "over";
        stopLoop();
        sfx.over();

        const buttons = h("div", { class: "arc-actions" },
            h("button", { type: "button", onClick: () => { sfx.select(); newRound(); } }, "A  Retry"),
            h("button", { type: "button", onClick: () => openBoard() }, "Y  Ranking"),
            h("button", { type: "button", onClick: () => { sfx.back(); backToHome(); } }, "B  Menu"),
        );
        const extra = score > 0 ? [scoreForm(g, score), buttons] : [buttons];
        showMessage(record ? "NEW RECORD!" : "GAME OVER", `Score ${score} · Best ${Math.max(best, score)}`, null, extra);
    }

    // Form gửi điểm lên bảng xếp hạng chung. Không tự focus ô nhập: để phím Space/Enter vẫn là A (chơi lại)
    function scoreForm(g, score) {
        const field = h("input", {
            class: "arc-name", type: "text", maxlength: "14", placeholder: "Your name",
            "aria-label": "Your name for the leaderboard", value: getSavedName(), autocomplete: "nickname",
        });
        const submit = h("button", { type: "submit" }, "Submit");
        const status = h("small", { class: "arc-form-status", role: "status" });
        const form = h("form", { class: "arc-form" }, field, submit, status);

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = field.value.trim().replace(/\s+/g, " ");
            if (!NAME_PATTERN.test(name)) {
                status.textContent = "1–14 letters, numbers, space . _ -";
                return;
            }
            submit.disabled = true;
            field.disabled = true;
            status.textContent = "Saving…";
            try {
                const result = await submitScore(g.id, name, score);
                saveName(name);
                track("click", `rank-${g.id}`);
                form.replaceChildren(h("small", { class: "arc-form-status" }, `Saved · rank #${result.rank}`));
                openBoard({ top: result.top, name, score });
            } catch (err) {
                submit.disabled = false;
                field.disabled = false;
                status.textContent = err.message === "rate" ? "Too many tries — wait a minute." : "Leaderboard is offline right now.";
            }
        });
        return form;
    }

    /** @param {Node[] | null} extra - nội dung bấm được (form, nút) → overlay nhận chuột */
    function showMessage(title, sub, hint, extra = null) {
        // replaceChildren không tự bỏ null/trải mảng như h() → lọc trước
        message.replaceChildren(...[h("strong", {}, title), h("span", {}, sub), hint && h("em", {}, hint), ...(extra ?? [])].filter(Boolean));
        message.classList.toggle("is-interactive", !!extra);
        message.hidden = false;
        gsap.fromTo(message, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 });
    }

    // ===== Bảng xếp hạng =====
    /** @param {{top?: Array, name?: string, score?: number}} [mine] - kết quả vừa gửi, để tô sáng dòng của người chơi */
    async function openBoard(mine = {}) {
        const g = GAMES[selected];
        boardOpen = true;
        boardEl.hidden = false;
        boardEl.style.setProperty("--accent", g.accent);
        boardTitle.textContent = `${g.title} · Top 10`;
        gsap.fromTo(boardEl, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" });
        sfx.select();

        let top = mine.top;
        if (!top) {
            boardList.replaceChildren(h("li", { class: "arc-board-empty" }, "Loading…"));
            try {
                top = await fetchTop(g.id);
            } catch {
                if (boardOpen) boardList.replaceChildren(h("li", { class: "arc-board-empty" }, "Leaderboard is offline right now."));
                return;
            }
        }
        if (!boardOpen) return;
        if (!top.length) {
            boardList.replaceChildren(h("li", { class: "arc-board-empty" }, "No scores yet — be the first!"));
            return;
        }
        let marked = false;
        boardList.replaceChildren(...top.map((row, i) => {
            const isMine = !marked && row.name === mine.name && row.score === mine.score;
            if (isMine) marked = true;
            return h("li", { class: isMine ? "is-mine" : "" },
                h("span", { class: "arc-rank" }, ["🥇", "🥈", "🥉"][i] ?? String(i + 1)),
                h("span", { class: "arc-board-name" }, row.name),
                h("span", { class: "arc-board-score" }, String(row.score)),
            );
        }));
        gsap.from(boardList.children, { x: 12, opacity: 0, duration: 0.25, stagger: 0.03 });
    }

    function closeBoard() {
        if (!boardOpen) return;
        boardOpen = false;
        boardEl.hidden = true;
        sfx.back();
    }

    function backToHome() {
        session++;
        stopLoop();
        game = null;
        mode = "home";
        play.hidden = true;
        home.hidden = false;
        select(selected, true);
    }

    function loop(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        game.update(dt);
        if (mode === "playing") game.render(ctx);
        if (mode === "playing") raf = requestAnimationFrame(loop);
    }
    function startLoop() {
        message.hidden = true;
        mode = "playing";
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }
    function stopLoop() {
        cancelAnimationFrame(raf);
    }

    function input(action, down) {
        if (!isOpen) return;
        if (boardOpen) {
            if (down && ["a", "b", "y", "home"].includes(action)) closeBoard();
            return;
        }
        if (mode === "home") {
            if (!down) return;
            if (action === "y") return openBoard();
            if (action === "left" || action === "up") select(selected - 1);
            else if (action === "right" || action === "down") select(selected + 1);
            else if (action === "a") start();
            return;
        }
        if (down && action === "home") { sfx.back(); return backToHome(); }
        if (mode === "ready") {
            if (down && action === "a") startLoop();
            else if (down && action === "b") { sfx.back(); backToHome(); }
            return;
        }
        if (mode === "over") {
            if (down && action === "y") openBoard();
            else if (down && action === "a") { sfx.select(); newRound(); }
            else if (down && action === "b") { sfx.back(); backToHome(); }
            return;
        }
        if (mode === "paused") {
            if (down && (action === "plus" || action === "a")) startLoop();
            else if (down && action === "b") { sfx.back(); backToHome(); }
            return;
        }
        // playing
        if (down && action === "plus") {
            mode = "paused";
            stopLoop();
            return showMessage("PAUSED", GAMES[selected].controls, "A resume · B menu");
        }
        game.input(action, down);
    }

    // Chuột / chạm trên canvas (Breakout kéo thanh đỡ, Stack chạm để thả)
    // Đổi toạ độ chuột sang toạ độ canvas W × H (canvas dùng object-fit: contain nên có thể có viền trống)
    const toCanvas = (e) => {
        const r = canvas.getBoundingClientRect();
        const scale = Math.min(r.width / W, r.height / H);
        const offX = (r.width - W * scale) / 2;
        const offY = (r.height - H * scale) / 2;
        return [(e.clientX - r.left - offX) / scale, (e.clientY - r.top - offY) / scale];
    };
    canvas.addEventListener("pointerdown", (e) => {
        if (mode === "ready" || mode === "paused") return startLoop();
        if (mode === "playing") {
            const [x, y] = toCanvas(e);
            game.pointer?.(x, true, y);
        }
    });
    canvas.addEventListener("pointermove", (e) => {
        if (mode !== "playing" || !(e.pointerType === "mouse" || e.buttons)) return;
        const [x, y] = toCanvas(e);
        game.pointer?.(x, false, y);
    });

    // Đang gõ tên vào ô nhập thì để phím hoạt động bình thường
    const typing = (e) => e.target instanceof HTMLInputElement;
    window.addEventListener("keydown", (e) => {
        const action = KEYS[e.code];
        if (!isOpen || !action || e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
        e.preventDefault();
        if (!e.repeat) input(action, true);
    });
    window.addEventListener("keyup", (e) => {
        const action = KEYS[e.code];
        if (isOpen && action && !typing(e)) input(action, false);
    });

    const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
    const tickClock = () => { clock.textContent = timeFormat.format(new Date()); };

    select(0, true);

    return createPopup("arcade", {
        title: "switch_arcade",
        anim: "window",
        className: "popup-panel--arcade",
        body,
        onOpen() {
            isOpen = true;
            tickClock();
            setTimeout(() => screen.focus({ preventScroll: true })); // popup.js focus nút ✕ ngay sau onOpen
        },
        onClose() {
            isOpen = false;
            boardOpen = false;
            boardEl.hidden = true;
            backToHome();
        },
    });
}
