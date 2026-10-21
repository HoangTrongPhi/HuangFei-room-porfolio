// core/bloom.js
// Hiệu ứng phát sáng (bloom) cho LED, màn hình, quạt case.
// Cảnh vẫn được render thẳng ra màn hình như cũ (giữ nguyên tone mapping và màu màn hình monitor);
// bloom tính từ một lần render phụ ở nửa độ phân giải (chưa tone map) rồi cộng đè lên trên.
// Render target 8-bit nên giá trị bị kẹp về 0 → 1: vật cực sáng (màn AIO emissive ~1000)
// không nổ thành quầng trắng khổng lồ. Trước khi nhân exposure, phòng bake lightmap khá tối
// nên threshold chỉ bắt các vật tự phát sáng.
import * as THREE from "three";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {object} opt
 * @param {number} opt.strength   - độ mạnh vầng sáng
 * @param {number} opt.radius     - độ toả (0 → 1)
 * @param {number} opt.threshold  - độ sáng tối thiểu để phát sáng (0 → 1, tuyến tính, trước exposure)
 * @param {number} [opt.resolution] - tỉ lệ độ phân giải của lần render phụ
 */
export function createBloom(renderer, { strength, radius, threshold, resolution = 0.5 }) {
    const target = new THREE.WebGLRenderTarget(1, 1);
    const pass = new UnrealBloomPass(new THREE.Vector2(1, 1), strength, radius, threshold);
    pass.highPassUniforms.smoothWidth.value = 0.2; // chuyển mềm quanh threshold thay vì cắt gắt

    // Không dùng pass.renderToScreen vì chế độ đó xoá màn hình rồi vẽ lại ảnh gốc.
    // Thay vào đó lấy riêng lớp bloom (renderTargetsHorizontal[0]) và cộng lên ảnh đã có trên màn hình.
    const overlay = new FullScreenQuad(new THREE.MeshBasicMaterial({
        map: pass.renderTargetsHorizontal[0].texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
    }));

    function setSize(width, height) {
        const w = Math.max(1, Math.round(width * resolution));
        const h = Math.max(1, Math.round(height * resolution));
        target.setSize(w, h);
        pass.setSize(w, h);
    }
    setSize(window.innerWidth, window.innerHeight);

    /** Gọi ngay sau renderer.render(scene, camera) ra màn hình. */
    function render(scene, camera) {
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        pass.render(renderer, null, target);

        renderer.setRenderTarget(null);
        const autoClear = renderer.autoClear;
        renderer.autoClear = false;
        overlay.render(renderer);
        renderer.autoClear = autoClear;
    }

    return { render, setSize, pass };
}
