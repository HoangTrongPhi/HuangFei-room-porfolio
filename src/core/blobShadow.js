// core/blobShadow.js
// Bóng mềm dạng đĩa mờ dưới vật thể đặt trên sàn (robot hút bụi, ghế). Rẻ hơn shadow map / contact shadow
// (không render thêm lần nào) — đủ cho phòng isometric nhìn từ trên xuống, chạy tốt cả trên điện thoại.
import * as THREE from "three";

let texture = null;

// Gradient tròn: đậm ở giữa, mờ dần ra mép
function getTexture() {
    if (texture) return texture;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.45, "rgba(0,0,0,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/**
 * Tạo đĩa bóng nằm ngang (mặt phẳng XZ). Ban đầu trong suốt — gọi show() sau intro.
 * @param {number} radius - bán kính, theo đơn vị của cha
 * @param {number} [opacity] - độ đậm khi hiện
 */
export function createBlobShadow(radius, opacity = 0.55) {
    const material = new THREE.MeshBasicMaterial({
        map: getTexture(),
        color: 0x000000,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true, // nằm sát sàn mà không nhấp nháy z-fighting
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 1;
    mesh.userData.skipIntro = true; // không tham gia hiệu ứng lắp ráp phòng
    mesh.raycast = () => {}; // không chặn click vào vật thể
    mesh.userData.opacity = opacity;
    return mesh;
}
