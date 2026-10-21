// core/video.js
// Tạo VideoTexture từ file mp4. Three.js tự cập nhật frame cho VideoTexture
// khi render, nên không cần set needsUpdate thủ công trong vòng lặp.
import * as THREE from "three";

// Trình duyệt có thể chặn autoplay: gom tất cả video lại và
// phát lại ở lần click đầu tiên của người dùng (chỉ 1 listener duy nhất).
const videos = new Set();
window.addEventListener("click", () => {
    videos.forEach((video) => {
        if (video.paused) video.play().catch(() => {});
    });
});

/**
 * @param {string} src - đường dẫn video (trong /public)
 * @param {object} [opt]
 * @param {boolean} [opt.flipX] - lật ngang (khi UV bị ngược)
 * @param {boolean} [opt.flipY] - lật dọc
 * @param {string}  [opt.colorSpace] - mặc định sRGB
 */
export function createVideoTexture(src, { flipX = false, flipY = false, colorSpace = THREE.SRGBColorSpace } = {}) {
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true; // bắt buộc muted thì autoplay mới được phép
    video.playsInline = true;
    video.autoplay = true;
    video.addEventListener("canplay", () => {
        video.play().catch((err) => console.warn(`Autoplay bị chặn (${src}):`, err));
    });
    videos.add(video);

    const texture = new THREE.VideoTexture(video);
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
