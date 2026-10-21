// core/analytics.js
// Gửi sự kiện truy cập tới /api/track. Mã công ty lấy từ link ?ref=congty và giữ trong suốt phiên.
// Không gửi khi chạy local, hoặc khi trình duyệt này đã đăng nhập trang /admin (để không đếm chính mình).

const DISABLED_KEY = "portfolio-no-track";

function storage(kind) {
    try { return kind === "session" ? window.sessionStorage : window.localStorage; } catch { return null; }
}

const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

function getSessionId() {
    const s = storage("session");
    let id = s?.getItem("portfolio-sid");
    if (!id) {
        id = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
        s?.setItem("portfolio-sid", id);
    }
    return id;
}

// ?ref= ưu tiên; nếu không có thì dùng ref đã lưu trong phiên
export function getRef() {
    const s = storage("session");
    const fromUrl = new URLSearchParams(location.search).get("ref");
    if (fromUrl) s?.setItem("portfolio-ref", fromUrl);
    return fromUrl || s?.getItem("portfolio-ref") || null;
}

/** Bật/tắt tracking cho trình duyệt hiện tại (trang admin gọi khi đăng nhập). */
export function setTrackingDisabled(disabled) {
    const l = storage("local");
    disabled ? l?.setItem(DISABLED_KEY, "1") : l?.removeItem(DISABLED_KEY);
}

/**
 * @param {"visit"|"enter"|"click"} event
 * @param {string} [target] - tên nút được click (mywork, contact, github...)
 */
export function track(event, target) {
    if (isLocal || storage("local")?.getItem(DISABLED_KEY)) return;
    const body = JSON.stringify({
        event,
        target,
        ref: getRef(),
        sessionId: getSessionId(),
        referrer: event === "visit" ? document.referrer : undefined,
    });
    // keepalive: vẫn gửi được khi click mở tab mới / rời trang
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
        .catch(() => {});
}
