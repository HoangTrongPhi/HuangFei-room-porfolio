// api/track.js — Vercel Function: nhận sự kiện từ trình duyệt, gắn IP + vị trí (do Vercel cung cấp), ghi vào Supabase.
// IP và vị trí lấy từ header của Vercel ở phía server, nên client không giả mạo được.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../shared/supabase-config.js";

const EVENTS = new Set(["visit", "enter", "click"]);
const SLUG = /^[a-zA-Z0-9_-]{1,40}$/;

const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

// Chuỗi tuỳ chọn, cắt ngắn; trả null nếu rỗng hoặc không hợp lệ
const clip = (v, max) => (typeof v === "string" && v ? v.slice(0, max) : null);
const slug = (v) => (typeof v === "string" && SLUG.test(v) ? v.toLowerCase() : null);
const header = (req, name) => {
    const v = req.headers[name];
    return v ? decodeURIComponent(Array.isArray(v) ? v[0] : v) : null;
};

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();
    if (!supabase) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình" });

    let body = req.body;
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { body = null; }
    }
    if (!body || !EVENTS.has(body.event)) return res.status(400).end();

    const ip = header(req, "x-real-ip") ?? header(req, "x-forwarded-for")?.split(",")[0].trim() ?? null;

    const { error } = await supabase.from("visits").insert({
        event: body.event,
        target: slug(body.target),
        ref: slug(body.ref),
        session_id: slug(body.sessionId),
        ip,
        country: header(req, "x-vercel-ip-country"),
        region: header(req, "x-vercel-ip-country-region"),
        city: header(req, "x-vercel-ip-city"),
        user_agent: clip(req.headers["user-agent"], 300),
        referrer: clip(body.referrer, 300),
    });

    if (error) {
        console.error("Ghi Supabase lỗi:", error.message);
        return res.status(500).end();
    }
    return res.status(204).end();
}
