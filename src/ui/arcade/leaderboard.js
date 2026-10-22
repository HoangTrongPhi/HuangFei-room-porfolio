// ui/arcade/leaderboard.js — gọi /api/leaderboard (Vercel Function). Khi chạy `npm run dev` không có API
// nên các hàm sẽ báo lỗi → giao diện hiện "offline".
import { getRef } from "../../core/analytics.js";

const NAME_KEY = "arcade-name";
export const NAME_PATTERN = /^[\p{L}\p{N} ._-]{1,14}$/u; // giống kiểm tra ở api/leaderboard.js

/** @returns {Promise<Array<{name:string, score:number}>>} */
export async function fetchTop(game) {
    const res = await fetch(`/api/leaderboard?game=${encodeURIComponent(game)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).top;
}

/** @returns {Promise<{rank:number, top:Array<{name:string, score:number}>}>} */
export async function submitScore(game, name, score) {
    const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, name, score, ref: getRef() }),
    });
    if (res.status === 429) throw new Error("rate");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/** Tên đã nhập lần trước (lưu trong trình duyệt người chơi). */
export function getSavedName() {
    try { return localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; }
}
export function saveName(name) {
    try { localStorage.setItem(NAME_KEY, name); } catch { /* bỏ qua */ }
}
