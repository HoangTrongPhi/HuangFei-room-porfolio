// core/renderer.js
// WebGLRenderer DUY NHẤT của app. Mọi module khác nhận renderer qua tham số,
// không tự tạo renderer mới trên cùng canvas.
import * as THREE from "three";

export function createRenderer(canvas, { toneMapping, toneMappingExposure }) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // giới hạn 2x cho nhẹ
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = toneMapping;
    renderer.toneMappingExposure = toneMappingExposure;

    // Ánh sáng đã bake vào lightmap nên tắt shadow realtime
    renderer.shadowMap.enabled = false;

    return renderer;
}
