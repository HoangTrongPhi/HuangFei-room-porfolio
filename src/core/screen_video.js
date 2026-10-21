// core/screen_video.js
// 3 màn hình monitor, mỗi màn phát một video riêng.
import * as THREE from "three";
import { loadGLB } from "./loader.js";
import { createVideoTexture } from "./video.js";

/**
 * @param {THREE.Scene} scene
 * @param {string} path - đường dẫn Monitor.glb
 * @param {Object<string,string>} videoPaths - { tên mesh màn hình: đường dẫn video }
 * @param {Object<string,{flipX:boolean, flipY:boolean}>} flips - lật video theo từng màn
 */
export async function loadMonitorScreens(scene, path, videoPaths, flips = {}) {
    const monitor = await loadGLB(path);

    const meshes = {};
    monitor.traverse((child) => {
        const src = child.isMesh && videoPaths[child.name];
        if (!src) return;

        // MeshBasicMaterial + toneMapped:false: màn hình tự phát sáng,
        // không bị đèn và exposure của scene làm cháy màu
        child.material = new THREE.MeshBasicMaterial({
            map: createVideoTexture(src, flips[child.name]),
            toneMapped: false,
        });
        meshes[child.name] = child;
    });

    scene.add(monitor);
    return meshes;
}
