import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

// Material LED đơn giản với emissive (hỗ trợ hex string)
function createLedMaterial(color = "#ffffff", intensity = 2) {
    const col = new THREE.Color(color);

    return new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: intensity,
        transparent: true,
    });
}

// Tạo materials màu thay đổi cho RAM LED chạy đuổi
function createChasingMaterials() {
    const colors = [
        "#fd38fd",
        "#69f6de",
        "#f44f4f",
        "#8bed70",
        "#fff68e",
        "#ff908f"
    ];

    return colors.map(color =>
        new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            emissive: new THREE.Color(color),
            emissiveIntensity: 12000
        })
    );
}

// Tạo material gradient cho Fan LED
function createGradientMaterial() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#ff1f1f");
    gradient.addColorStop(0.2, "#ffa41d");
    gradient.addColorStop(0.4, "#ffff1f");
    gradient.addColorStop(0.6, "#74ff74");
    gradient.addColorStop(0.8, "#1d1dff");
    gradient.addColorStop(1, "#ff0cff");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);

    return new THREE.MeshStandardMaterial({
        map: texture,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: texture,
        emissiveIntensity: 1500,
        transparent: true,
    });
}

/**
 * Load Case_PC.glb
 * @param {THREE.Scene} scene
 * @param {number} fanRotationSpeed - tốc độ quay quạt
 * @param {number} aioBrightness - độ sáng màn AIO
 * @param {object} aioFlip - cấu hình flip cho AIO (flipX, flipY)
 */
export async function loadCasePC(
    scene,
    fanRotationSpeed = 10,
    aioBrightness = 2.0,
    aioFlip = { flipX: false, flipY: false }
) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
        loader.setDRACOLoader(dracoLoader);

        loader.load("/models/Case_PC.glb", (gltf) => {
            const root = gltf.scene;
            const meshes = {};
            const ramLeds = [];
            const fanLeds = [];
            const dynamicFans = [];
            let aioDisplay = null; // Màn hình AIO

            const chasingMaterials = createChasingMaterials();

            // === Tạo video texture cho AIO ===
            const video = document.createElement("video");
            video.src = "media/test_Video.mp4"; // path trong public/
            video.loop = true;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;

            video.addEventListener("canplay", () => {
                video.play().catch(err => {
                    console.warn("Autoplay bị chặn:", err);
                });
            });

            window.addEventListener("click", () => {
                if (video.paused) video.play();
            });

            const baseVideoTexture = new THREE.VideoTexture(video);
            baseVideoTexture.minFilter = THREE.LinearFilter;
            baseVideoTexture.magFilter = THREE.LinearFilter;
            baseVideoTexture.encoding = THREE.sRGBEncoding;

            root.traverse((child) => {
                if (child.isMesh) {
                    const mesh = child;
                    mesh.name = child.name || `Mesh_${Object.keys(meshes).length}`;

                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    // Fan LEDs gradient
                    if (mesh.name.startsWith("Fan_Led")) {
                        mesh.material = createGradientMaterial();
                        fanLeds.push(mesh);
                    }

                    // RAM LEDs chạy đuổi
                    if (mesh.name.startsWith("Ram_Led")) {
                        mesh.material = chasingMaterials[0].clone();
                        ramLeds.push(mesh);
                    }

                    // Fan động (quay cánh)
                    if (
                        mesh.name.startsWith("Fan_Dynamic") ||
                        mesh.name.startsWith("Graphic_Fan")
                    ) {
                        dynamicFans.push(mesh);
                    }

                    // AIO Cooling Display
                    if (mesh.name === "AIO_Cooling_Display") {
                        // Clone texture riêng để flip
                        const tex = baseVideoTexture.clone();
                        tex.needsUpdate = true;
                        tex.repeat.set(aioFlip.flipX ? -1 : 1, aioFlip.flipY ? -1 : 1);
                        tex.center.set(0.5, 0.5);

                        mesh.material = new THREE.MeshStandardMaterial({
                            map: tex,
                            emissive: new THREE.Color(0xffffff),
                            emissiveMap: tex,
                            emissiveIntensity: aioBrightness,
                            transparent: true,
                        });
                        aioDisplay = mesh;
                    }

                    meshes[mesh.name] = mesh;
                }
            });

            // Animation LEDs + quạt + AIO
            let time = 0;
            const updateLEDs = (delta) => {
                time += delta * 5;

                // Fan LEDs gradient chạy vòng
                fanLeds.forEach((fan) => {
                    if (fan.material.map) {
                        fan.material.map.offset.x = (time * 0.02) % 1;
                    }
                });

                // RAM LEDs chạy đuổi
                if (ramLeds.length > 0) {
                    const index = Math.floor(time) % chasingMaterials.length;
                    ramLeds.forEach((led, i) => {
                        const matIndex = (index + i) % chasingMaterials.length;
                        led.material.color.copy(chasingMaterials[matIndex].color);
                        led.material.emissive.copy(chasingMaterials[matIndex].emissive);
                    });
                }

                // Fan động quay
                dynamicFans.forEach((fan) => {
                    if (fan.name === "Fan_Dynamic_01" || fan.name === "Fan_Dynamic_02") {
                        fan.rotation.x += delta * fanRotationSpeed;
                    } else {
                        fan.rotation.y += delta * fanRotationSpeed;
                    }
                });

                // AIO Display: pulsating emissiveIntensity dựa trên aioBrightness
                if (aioDisplay) {
                    aioDisplay.material.emissiveIntensity =
                        aioBrightness * (10 + Math.sin(time * 0.5) * 0.25);
                }
            };

            scene.add(root);
            resolve({ meshes, updateLEDs });
        }, undefined, (error) => reject(error));
    });
}
