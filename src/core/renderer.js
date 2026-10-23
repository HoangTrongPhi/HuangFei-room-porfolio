// core/renderer.js
// WebGLRenderer DUY NHẤT của app. Mọi module khác nhận renderer qua tham số,
// không tự tạo renderer mới trên cùng canvas.
import * as THREE from "three";
import { maxPixelRatio } from "./device.js";

export function createRenderer(canvas, { toneMapping, toneMappingExposure }) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(maxPixelRatio()); // giới hạn 2x (điện thoại 1.5x) cho nhẹ
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = toneMapping;
    renderer.toneMappingExposure = toneMappingExposure;

    // Phòng isometric tĩnh: tắt shadow realtime cho nhẹ (ánh sáng = env map + ambient/directional)
    renderer.shadowMap.enabled = false;

    return renderer;
}
