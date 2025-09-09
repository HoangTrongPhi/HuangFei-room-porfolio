import * as THREE from "three";

//====== Load cube map từ 6 file ảnh. ============
export function loadEnvironmentMap(
    {
        basePath = "/textures/studio/",
        files = ["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"],
    } = {}
) {
    const env = new THREE.CubeTextureLoader().setPath(basePath).load(files);
    env.colorSpace = THREE.SRGBColorSpace;
    return env;
}

export function applyEnvironment(scene, envMap, { useAsBackground = false } = {}) {
    scene.environment = envMap;
    if (useAsBackground) scene.background = envMap;
}

/**
 * Tạo cấu hình đèn với default từ GLB, cho phép override bằng params
 * @param {THREE.Object3D} lightScene - scene chứa lights
 * @param {Object} params - config override
 * @returns {Object} dictionary các light đã setup
 */
export function setupLights(lightScene, params = {}) {
    const lights = {};

    lightScene.traverse((obj) => {
        if (obj.isPointLight) {
            const override = params[obj.name] || {};
            obj.castShadow = true;
            obj.shadow.mapSize.set(1024, 1024);
            obj.shadow.bias = -0.02;
            obj.shadow.camera.near = 0.01;
            obj.shadow.camera.far = 100;

            // giữ nguyên từ GLB, chỉ override nếu có
            obj.intensity = override.intensity !== undefined ? override.intensity : obj.intensity;
            obj.color     = override.color     !== undefined ? new THREE.Color(override.color) : obj.color;

            lights[obj.name] = obj;
        }

        if (obj.isSpotLight) {
            const override = params[obj.name] || {};
            obj.castShadow = true;
            obj.shadow.mapSize.set(1024, 1024);
            obj.shadow.bias = -0.01;
            obj.shadow.camera.near = 0.1;
            obj.shadow.camera.far = 800;

            obj.intensity = override.intensity !== undefined ? override.intensity : obj.intensity;
            obj.color     = override.color     !== undefined ? new THREE.Color(override.color) : obj.color;
            obj.angle     = override.angle     !== undefined ? override.angle : obj.angle;  // beam size
            obj.penumbra  = override.penumbra  !== undefined ? override.penumbra : obj.penumbra;

            lights[obj.name] = obj;
        }
    });

    return lights;
}
