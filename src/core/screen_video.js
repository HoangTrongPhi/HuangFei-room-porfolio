// screen_video.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Load Monitor.glb và phát video riêng biệt trên Screen_01, Screen_02, Screen_03
 * @param {THREE.Scene} scene - Scene chính
 * @param {string} path - Đường dẫn tới Monitor.glb
 * @param {object} videoPaths - Đường dẫn video cho từng màn hình
 *   videoPaths = {
 *      "Screen_01": "/media/video1.mp4",
 *      "Screen_02": "/media/video2.mp4",
 *      "Screen_03": "/media/video3.mp4"
 *   }
 * @param {object} options - Tùy chọn flip cho từng màn hình
 *   options.screens = {
 *      "Screen_01": { flipX: false, flipY: false },
 *      "Screen_02": { flipX: false, flipY: false },
 *      "Screen_03": { flipX: true,  flipY: false }
 *   }
 * @returns {Promise<{meshes: object, updateVideos: function}>}
 */
export async function loadMonitorScreens(
    scene,
    path = "/models/Monitor.glb",
    videoPaths = {
        Screen_01: "/media/monitor_1.mp4",
        Screen_02: "/media/monitor_2.mp4",
        Screen_03: "/media/monitor_3.mp4"
    },
    options = {
        screens: {
            Screen_01: { flipX: false, flipY: false },
            Screen_02: { flipX: false, flipY: false },
            Screen_03: { flipX: true,  flipY: false }
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

                const screenNames = Object.keys(videoPaths);
                const meshes = {};
                const videos = {};
                const textures = {};

                // === Khởi tạo video + texture riêng cho từng màn hình ===
                screenNames.forEach((name) => {
                    const video = document.createElement("video");
                    video.src = videoPaths[name];
                    video.crossOrigin = "anonymous";
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    video.autoplay = true;

                    video.addEventListener("canplay", () => {
                        video.play().catch((err) => {
                            console.warn(`Autoplay bị chặn (${name}), cần click:`, err);
                        });
                    });

                    window.addEventListener("click", () => {
                        if (video.paused) video.play();
                    });

                    const tex = new THREE.VideoTexture(video);
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.minFilter = THREE.LinearFilter;
                    tex.magFilter = THREE.LinearFilter;
                    tex.generateMipmaps = false;

                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;

                    const flipCfg = options.screens[name] || { flipX: false, flipY: false };
                    tex.repeat.set(flipCfg.flipX ? -1 : 1, flipCfg.flipY ? -1 : 1);
                    tex.center.set(0.5, 0.5);


                    videos[name] = video;
                    textures[name] = tex;
                });

                // === Traverse model và gán video texture tương ứng ===
                monitor.traverse((child) => {
                    if (child.isMesh && screenNames.includes(child.name)) {
                        meshes[child.name] = child;

                        child.material = new THREE.MeshBasicMaterial({
                            map: textures[child.name],
                            toneMapped: false
                        });
                    }
                });

                console.log("Screens loaded:", Object.keys(meshes));

                resolve({
                    meshes,
                    updateVideos: () => {
                        screenNames.forEach((name) => {
                            if (videos[name].readyState >= videos[name].HAVE_CURRENT_DATA) {
                                textures[name].needsUpdate = true;
                            }
                        });
                    }
                });
            },
            undefined,
            (error) => reject(error)
        );
    });
}
