// admin/admin.js — trang /admin: đăng nhập Supabase, đọc bảng visits (RLS chỉ cho admin đọc), vẽ dashboard.
import "./admin.css";
import { createClient } from "@supabase/supabase-js";
import { Chart, registerables } from "chart.js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../../shared/supabase-config.js";
import { setTrackingDisabled } from "../core/analytics.js";

Chart.register(...registerables);
Chart.defaults.color = "#7d97bd";
Chart.defaults.borderColor = "#1c3357";
Chart.defaults.font.family = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const PAGE_SIZE = 1000; // Supabase trả tối đa 1000 dòng / request
const MAX_ROWS = 20000;
const TABLE_ROWS = 300;
const NO_REF = "(không có ref)";
const ACCENT = "#4d99ff";

const $ = (id) => document.getElementById(id);
const charts = {};
let allRows = [];

// ================== Auth ==================
async function showView() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return showLogin();

    // Chỉ user nằm trong bảng admins mới được xem
    const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
    if (!admin) {
        await supabase.auth.signOut();
        return showLogin("Tài khoản này không có quyền admin.");
    }

    setTrackingDisabled(true); // không đếm lượt xem portfolio từ trình duyệt của admin
    $("login-view").hidden = true;
    $("dash-view").hidden = false;
    $("logout").hidden = false;
    $("user-email").textContent = session.user.email ?? "";
    await loadData();
}

function showLogin(message = "") {
    $("dash-view").hidden = true;
    $("logout").hidden = true;
    $("user-email").textContent = "";
    $("login-view").hidden = false;
    $("login-error").textContent = message;
}

$("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const button = form.querySelector("button");
    button.disabled = true;
    $("login-error").textContent = "";
    const { error } = await supabase.auth.signInWithPassword({
        email: form.email.value.trim(),
        password: form.password.value,
    });
    button.disabled = false;
    form.password.value = "";
    if (error) return ($("login-error").textContent = "Sai email hoặc mật khẩu.");
    showView();
});

$("logout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    showLogin();
});

// ================== Data ==================
async function loadData() {
    const days = Number($("f-range").value);
    $("status").textContent = "Đang tải…";
    $("refresh").disabled = true;

    const rows = [];
    try {
        for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
            let q = supabase.from("visits").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
            if (days) q = q.gte("created_at", new Date(Date.now() - days * 864e5).toISOString());
            const { data, error } = await q;
            if (error) throw error;
            rows.push(...data);
            if (data.length < PAGE_SIZE) break;
        }
        allRows = rows;
        fillRefFilter();
        render();
        $("status").textContent = `Cập nhật lúc ${new Date().toLocaleTimeString("vi-VN")}`;
    } catch (err) {
        $("status").textContent = `Lỗi tải dữ liệu: ${err.message}`;
    } finally {
        $("refresh").disabled = false;
    }
}

function fillRefFilter() {
    const select = $("f-ref");
    const current = select.value;
    const refs = [...new Set(allRows.map((r) => r.ref ?? NO_REF))].sort();
    select.replaceChildren(new Option("Tất cả", ""), ...refs.map((r) => new Option(r, r)));
    select.value = refs.includes(current) ? current : "";
}

// ================== Render ==================
const countBy = (rows, key) => {
    const map = new Map();
    rows.forEach((r) => {
        const k = key(r);
        if (k != null) map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
};

function render() {
    const ref = $("f-ref").value;
    const rows = ref ? allRows.filter((r) => (r.ref ?? NO_REF) === ref) : allRows;
    const visits = rows.filter((r) => r.event === "visit");
    const clicks = rows.filter((r) => r.event === "click");

    $("k-visits").textContent = visits.length;
    $("k-sessions").textContent = new Set(visits.map((r) => r.session_id)).size;
    $("k-ips").textContent = new Set(visits.map((r) => r.ip).filter(Boolean)).size;
    $("k-refs").textContent = new Set(visits.map((r) => r.ref).filter(Boolean)).size;
    $("k-clicks").textContent = clicks.length;

    drawDaily(visits);
    drawBar("c-refs", countBy(visits, (r) => r.ref ?? NO_REF).slice(0, 12));
    drawBar("c-clicks", countBy(clicks, (r) => r.target ?? "?"));
    drawBar("c-countries", countBy(visits, (r) => r.country ?? "?").slice(0, 10));
    drawTable(rows);
}

function drawDaily(visits) {
    const days = Number($("f-range").value) || spanDays(visits);
    const labels = [];
    const counts = new Map();
    for (let i = days - 1; i >= 0; i--) {
        const key = dayKey(new Date(Date.now() - i * 864e5));
        labels.push(key);
        counts.set(key, 0);
    }
    visits.forEach((r) => {
        const k = dayKey(new Date(r.created_at));
        if (counts.has(k)) counts.set(k, counts.get(k) + 1);
    });
    upsertChart("c-daily", {
        type: "line",
        data: {
            labels: labels.map((k) => k.slice(5).split("-").reverse().join("/")),
            datasets: [{ data: labels.map((k) => counts.get(k)), borderColor: ACCENT, backgroundColor: "rgba(77,153,255,0.15)", fill: true, cubicInterpolationMode: "monotone", pointRadius: 2 }],
        },
    });
}

function drawBar(id, entries) {
    upsertChart(id, {
        type: "bar",
        data: {
            labels: entries.map(([k]) => k),
            datasets: [{ data: entries.map(([, v]) => v), backgroundColor: ACCENT, borderRadius: 4, maxBarThickness: 28 }],
        },
        options: { indexAxis: "y" },
    });
}

function upsertChart(id, config) {
    charts[id]?.destroy();
    charts[id] = new Chart($(id), {
        ...config,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
            ...config.options,
        },
    });
}

// Bảng chi tiết — dùng textContent (không innerHTML) vì user_agent/referrer do khách gửi lên
function drawTable(rows) {
    const shown = rows.slice(0, TABLE_ROWS);
    $("table-count").textContent = `(${shown.length}/${rows.length})`;
    $("rows").replaceChildren(...shown.map((r) => {
        const tr = document.createElement("tr");
        const cells = [
            new Date(r.created_at).toLocaleString("vi-VN"),
            r.event === "click" ? `click: ${r.target ?? "?"}` : r.event,
            r.ref ?? "–",
            r.ip ?? "–",
            [r.city, r.region, r.country].filter(Boolean).join(", ") || "–",
            shortUA(r.user_agent),
            r.referrer || "–",
        ];
        cells.forEach((text, i) => {
            const td = document.createElement("td");
            if (i === 1 || i === 2) {
                const tag = document.createElement("span");
                tag.className = "tag";
                tag.textContent = text;
                td.append(tag);
            } else {
                td.textContent = text;
            }
            if (i >= 5) {
                td.className = "wrap";
                td.title = i === 5 ? r.user_agent ?? "" : text;
            }
            tr.append(td);
        });
        return tr;
    }));
}

// ================== Helpers ==================
function dayKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function spanDays(rows) {
    if (!rows.length) return 30;
    const oldest = new Date(rows[rows.length - 1].created_at);
    return Math.min(365, Math.max(7, Math.ceil((Date.now() - oldest) / 864e5) + 1));
}

function shortUA(ua) {
    if (!ua) return "–";
    const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "?";
    const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "?";
    return `${browser} · ${os}`;
}

// ================== Link generator ==================
$("link-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("link-name").value.trim().toLowerCase();
    $("link-text").textContent = `${location.origin}/?ref=${encodeURIComponent(name)}`;
    $("link-out").hidden = false;
});

$("link-copy").addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText($("link-text").textContent);
        $("link-copy").textContent = "Đã copy";
        setTimeout(() => ($("link-copy").textContent = "Copy"), 1500);
    } catch { /* clipboard bị chặn — người dùng tự bôi đen để copy */ }
});

// ================== Events ==================
$("f-range").addEventListener("change", loadData);
$("f-ref").addEventListener("change", render);
$("refresh").addEventListener("click", loadData);

showView();
