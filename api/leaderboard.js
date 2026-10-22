// api/leaderboard.js — Vercel Function: bảng xếp hạng mini game trong máy Switch.
//   GET  /api/leaderboard?game=snake        → top 10 của game đó
//   POST /api/leaderboard {game,name,score,ref} → lưu điểm, trả về hạng + top 10
// Ghi bằng secret key ở server (RLS chặn ghi trực tiếp từ trình duyệt).
// Điểm do trình duyệt gửi lên nên không thể chống gian lận tuyệt đối: chỉ chặn giá trị vô lý + giới hạn tần suất theo IP.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../shared/supabase-config.js";

// Điểm tối đa hợp lý của từng game (vượt quá coi như gian lận)
const MAX_SCORE = { snake: 5000, breakout: 200000, stack: 2000, runner: 200000, rhythm: 2000000 };
const NAME = /^[\p{L}\p{N} ._-]{1,14}$/u; // chữ (kể cả tiếng Việt), số, khoảng trắng, . _ -
const SLUG = /^[a-zA-Z0-9_-]{1,40}$/;
const TOP = 10;
const RATE_LIMIT = 5; // lần gửi / phút / IP

const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

const header = (req, name) => {
    const v = req.headers[name];
    return v ? decodeURIComponent(Array.isArray(v) ? v[0] : v) : null;
};

async function top(game) {
    const { data, error } = await supabase
        .from("leaderboard")
        .select("name, score, created_at")
        .eq("game", game)
        .order("score", { ascending: false })
        .order("created_at", { ascending: true }) // bằng điểm thì ai đạt trước xếp trên
        .limit(TOP);
    if (error) throw error;
    return data;
}

export default async function handler(req, res) {
    if (!supabase) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình" });

    try {
        if (req.method === "GET") {
            const game = String(req.query.game ?? "");
            if (!(game in MAX_SCORE)) return res.status(400).end();
            res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
            return res.status(200).json({ top: await top(game) });
        }

        if (req.method !== "POST") return res.status(405).end();

        let body = req.body;
        if (typeof body === "string") {
            try { body = JSON.parse(body); } catch { body = null; }
        }
        const game = body?.game;
        const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
        const score = Number(body?.score);
        if (!(game in MAX_SCORE) || !NAME.test(name) || !Number.isInteger(score) || score <= 0 || score > MAX_SCORE[game]) {
            return res.status(400).json({ error: "invalid" });
        }

        const ip = header(req, "x-real-ip") ?? header(req, "x-forwarded-for")?.split(",")[0].trim() ?? null;
        if (ip) {
            const since = new Date(Date.now() - 60_000).toISOString();
            const { count } = await supabase
                .from("leaderboard")
                .select("id", { count: "exact", head: true })
                .eq("ip", ip)
                .gte("created_at", since);
            if ((count ?? 0) >= RATE_LIMIT) return res.status(429).json({ error: "too many" });
        }

        const { error } = await supabase.from("leaderboard").insert({
            game,
            name,
            score,
            ref: typeof body.ref === "string" && SLUG.test(body.ref) ? body.ref.toLowerCase() : null,
            ip,
        });
        if (error) throw error;

        // Hạng = số người điểm cao hơn + 1
        const { count: better } = await supabase
            .from("leaderboard")
            .select("id", { count: "exact", head: true })
            .eq("game", game)
            .gt("score", score);

        return res.status(200).json({ rank: (better ?? 0) + 1, top: await top(game) });
    } catch (err) {
        console.error("Leaderboard lỗi:", err.message);
        return res.status(500).end();
    }
}
