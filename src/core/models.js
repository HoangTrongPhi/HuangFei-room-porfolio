import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

async function loadGLB(url, { manager, dracoPath = "/draco/", onProgress } = {}) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(dracoPath);

    const loader = new GLTFLoader(manager);
    loader.setDRACOLoader(draco);

    const gltf = await loader.loadAsync(url, onProgress);
    const root = gltf.scene || gltf.scenes?.[0];
    if (!root) throw new Error(`GLB không có scene: ${url}`);
    return root;
}

// Load scene mesh
export async function loadSceneModel(scene, options = {}) {
    const root = await loadGLB("/models/room_portfolio.glb", options);
    root.traverse((o) => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            if (o.material?.map) o.material.map.colorSpace = THREE.SRGBColorSpace;
        }
    });
    scene.add(root);
    return root;
}

// Load light setup
export async function loadLightModel(scene, options = {}) {
    const root = await loadGLB("/models/light.glb", options);
    scene.add(root);
    return root;
}
