// core/video.js
// Tạo VideoTexture từ file mp4. Three.js tự cập nhật frame cho VideoTexture
// khi render, nên không cần set needsUpdate thủ công trong vòng lặp.
// Mỗi video chỉ phát khi thật sự cần (giải mã video rất tốn trên điện thoại):
//   - "wanted": nơi dùng video muốn nó chạy (vd. hologram đang hiện)
//   - tạm dừng tất cả khi popup che cảnh 3D (suspendVideos) hoặc tab bị ẩn
// Video chưa từng được cần (preload "none") thì chưa tải về.
import * as THREE from "three";

const videos = new Set();
let suspended = false;

function sync(video) {
    const want = video._wanted && !suspended && !document.hidden;
    if (want && video.paused) video.play().catch(() => {}); // autoplay bị chặn → thử lại ở lần chạm/click sau
    else if (!want && !video.paused) video.pause();
}
const syncAll = () => videos.forEach(sync);

// Trình duyệt có thể chặn autoplay: thử phát lại ở lần click / chạm đầu tiên của người dùng
window.addEventListener("click", syncAll);
window.addEventListener("touchend", syncAll, { passive: true });
document.addEventListener("visibilitychange", syncAll);

// Mỗi file video chỉ tạo 1 thẻ <video>: nhiều texture (vd. màn monitor + hologram) dùng chung, không tải lại
const bySrc = new Map();
function getVideo(src, autoplay) {
    if (bySrc.has(src)) {
        const video = bySrc.get(src);
        if (autoplay) setWanted(video, true);
        return video;
    }
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true; // bắt buộc muted thì autoplay mới được phép
    video.playsInline = true;
    video.preload = autoplay ? "auto" : "none";
    video._wanted = autoplay;
    video.src = src;
    video.addEventListener("canplay", () => sync(video));
    videos.add(video);
    bySrc.set(src, video);
    return video;
}

function setWanted(video, on) {
    if (video._wanted === on) return;
    video._wanted = on;
    if (on && video.preload === "none") video.preload = "auto";
    sync(video);
}

/** Bật / tắt video của một texture (vd. hologram ẩn khi màn hình dọc → dừng giải mã). */
export function setVideoWanted(texture, on) {
    setWanted(texture.image, on);
}

/** Tạm dừng mọi video khi cảnh 3D không hiển thị (popup che kín). */
export function suspendVideos(on) {
    if (suspended === on) return;
    suspended = on;
    syncAll();
}

// Chỉ tải metadata, tua tới 0.5s rồi đẩy đúng khung hình đó lên GPU (video dừng thì VideoTexture không tự cập nhật)
function showStillFrame(video, texture) {
    if (video.preload === "none") video.preload = "metadata";
    const seek = () => { video.currentTime = Math.min(0.5, (video.duration || 1) / 2); };
    if (video.readyState >= video.HAVE_METADATA) seek();
    else video.addEventListener("loadedmetadata", seek, { once: true });
    video.addEventListener("seeked", () => { texture.needsUpdate = true; }, { once: true });
}

/**
 * @param {string} src - đường dẫn video (trong /public)
 * @param {object} [opt]
 * @param {boolean} [opt.flipX] - lật ngang (khi UV bị ngược)
 * @param {boolean} [opt.flipY] - lật dọc
 * @param {string}  [opt.colorSpace] - mặc định sRGB
 * @param {boolean} [opt.autoplay] - false: chưa tải / chưa phát cho tới khi setVideoWanted(texture, true)
 * @param {boolean} [opt.still] - chỉ hiện 1 khung hình tĩnh, không phát (điện thoại: đỡ giải mã + đẩy texture mỗi frame)
 */
export function createVideoTexture(src, { flipX = false, flipY = false, colorSpace = THREE.SRGBColorSpace, autoplay = true, still = false } = {}) {
    const video = getVideo(src, autoplay && !still);
    const texture = new THREE.VideoTexture(video);
    if (still) showStillFrame(video, texture);
    texture.colorSpace = colorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    // Lật texture quanh tâm bằng repeat âm
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.center.set(0.5, 0.5);
    texture.repeat.set(flipX ? -1 : 1, flipY ? -1 : 1);

    return texture;
}
