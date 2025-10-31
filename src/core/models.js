// --- models.js ---
// ✅ Hỗ trợ ánh sáng trong GLB (KHR_lights_punctual) đã TÍCH HỢP SẴN

import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// -----------------------------------------------------------------------------
// HÀM LOAD GLB
// -----------------------------------------------------------------------------
async function loadGLB(url, { manager, dracoPath = "/draco/", onProgress } = {}) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(dracoPath);

    const loader = new GLTFLoader(manager);
    loader.setDRACOLoader(draco);

    // 💡 Đã xóa 'loader.register(...)' vì GLTFLoader hiện đại đã tích hợp KHR_lights_punctual.

    const gltf = await loader.loadAsync(url, onProgress);
    const root = gltf.scene || gltf.scenes?.[0];
    if (!root) throw new Error(`GLB không có scene: ${url}`);
    return root;
}

// -----------------------------------------------------------------------------
// ✅ HÀM LOAD ROOM MODEL CHÍNH
// -----------------------------------------------------------------------------
export async function loadSceneModel(scene, options = {}) {
    const root = await loadGLB("/models/room_portfolio.glb", options);

    // ✅ FIX LỖI SCALE: Thu nhỏ model (thử 50%)
    const scaleFactor = 0.01;
    root.scale.set(scaleFactor, scaleFactor, scaleFactor);

    let lightCount = 0;

    root.traverse(o => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            if (o.material?.map) o.material.map.colorSpace = THREE.SRGBColorSpace;
        }

        if (o.isLight) {
            o.castShadow = true;

            // ✅ FIX LỖI SỌC BÓNG (Shadow Aliasing):

            // 1. Tăng độ phân giải lên 2K (rất quan trọng)
            o.shadow.mapSize.width = 1024;
            o.shadow.mapSize.height = 1024;

            // 2. Tinh chỉnh vùng phủ bóng (thu hẹp camera.far để pixel tập trung hơn)
            o.shadow.camera.near = 0.01;
            o.shadow.camera.far = 25;// Giảm từ 50 xuống 25 (hoặc ít hơn)

            // 3. Tinh chỉnh bias để chống Shadow Acne (thử giá trị nhỏ hơn)
            o.shadow.bias = -0.001; // Gốc là -0.001

            // Nếu là DirectionalLight, bạn có thể cần chỉnh thêm:
            // o.shadow.camera.left = -10;
            // o.shadow.camera.right = 10;
            // o.shadow.camera.top = 10;
            // o.shadow.camera.bottom = -10;

            lightCount++;
            console.log("💡 Found Light (via built-in KHR):", o.name, o);
        }
    });

    // Nếu model không có ánh sáng, thêm fallback
    if (lightCount === 0) {
        console.warn("⚠️ Không phát hiện ánh sáng trong room_portfolio.glb — thêm Ambient fallback.");
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(3, 4, 2);
        dir.castShadow = true;
        scene.add(ambient, dir);
    }

    scene.add(root);
    return root;
}

// -----------------------------------------------------------------------------
// ✅ HÀM LOAD LIGHT MODEL (tuỳ chọn)
// -----------------------------------------------------------------------------
export async function loadLightModel(scene, options = {}) {
    const root = await loadGLB("/models/light.glb", options);
    scene.add(root);
    return root;
}