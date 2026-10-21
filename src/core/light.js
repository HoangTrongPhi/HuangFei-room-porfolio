// core/light.js
// Environment map (IBL). Hiện đang TẮT vì phòng dùng lightmap bake sẵn;
// giữ lại để bật thử khi cần phản chiếu cho vật liệu kim loại/kính.
import * as THREE from "three";

/** Load cube map từ 6 ảnh (px, nx, py, ny, pz, nz). */
export function loadEnvironmentMap({
    basePath = "/textures/studio/",
    files = ["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"],
} = {}) {
    const env = new THREE.CubeTextureLoader().setPath(basePath).load(files);
    env.colorSpace = THREE.SRGBColorSpace;
    return env;
}

export function applyEnvironment(scene, envMap, { useAsBackground = false } = {}) {
    scene.environment = envMap;
    if (useAsBackground) scene.background = envMap;
}
