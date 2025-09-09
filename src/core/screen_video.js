// screen_video.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Load Monitor.glb và phát video lên Screen_01, Screen_02, Screen_03
 * @param {THREE.Scene} scene - Scene chính
 * @param {string} path - Đường dẫn tới Monitor.glb
 * @param {string} videoPath - Đường dẫn video mp4
 * @param {object} options - Tùy chọn flip cho từng màn hình
 *   options.screens = {
 *      "Screen_01": { flipX: false, flipY: false },
 *      "Screen_02": { flipX: false, flipY: false },
 *      "Screen_03": { flipX: true,  flipY: false }
 *   }
 * @returns {Promise<{meshes: object, updateVideo: function}>}
 */
export async function loadMonitorScreens(
    scene,
    path = "/models/Monitor.glb",
    videoPath = "/media/test_Video.mp4",
    options = {
        screens: {
            Screen_01: { flipX: false, flipY: false },
            Screen_02: { flipX: false, flipY: false },
            Screen_03: { flipX: true, flipY: false } // mặc định Screen_03 flip X
        }
    }
) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();

        loader.load(
            path,
            (gltf) => {
                const monitor = gltf.scene;
                scene.add(monitor);

                // === Tạo video element ===
                const video = document.createElement("video");
                video.src = videoPath;
                video.crossOrigin = "anonymous";
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.autoplay = true;

                video.addEventListener("canplay", () => {
                    video.play().catch((err) => {
                        console.warn("Autoplay bị chặn, cần click để play:", err);
                    });
                });

                window.addEventListener("click", () => {
                    if (video.paused) {
                        video.play();
                    }
                });

                // === Tạo video texture ===
                const videoTexture = new THREE.VideoTexture(video);
                videoTexture.colorSpace = THREE.SRGBColorSpace;
                videoTexture.minFilter = THREE.LinearFilter;
                videoTexture.magFilter = THREE.LinearFilter;
                videoTexture.generateMipmaps = false;

                // === Danh sách mesh cần phát video ===
                const screenNames = ["Screen_01", "Screen_02", "Screen_03"];
                const meshes = {};

                monitor.traverse((child) => {
                    if (child.isMesh && screenNames.includes(child.name)) {
                        meshes[child.name] = child;

                        // Clone riêng texture cho từng màn hình để flip độc lập
                        const tex = videoTexture.clone();
                        tex.needsUpdate = true;

                        const flipCfg = options.screens[child.name] || { flipX: false, flipY: false };
                        tex.repeat.set(flipCfg.flipX ? -1 : 1, flipCfg.flipY ? -1 : 1);
                        tex.center.set(0.5, 0.5);

                        child.material = new THREE.MeshBasicMaterial({
                            map: tex,
                            toneMapped: false
                        });
                    }
                });

                console.log("Screens loaded:", Object.keys(meshes));

                resolve({
                    meshes,
                    updateVideo: () => {
                        if (video.readyState >= video.HAVE_CURRENT_DATA) {
                            videoTexture.needsUpdate = true;
                        }
                    }
                });
            },
            undefined,
            (error) => reject(error)
        );
    });
}
