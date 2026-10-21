// core/Case_PC.js
// Case PC: quạt quay, LED quạt chạy gradient, LED RAM đổi màu đuổi nhau,
// màn hình AIO phát video.
import * as THREE from "three";
import { loadGLB } from "./loader.js";
import { createVideoTexture } from "./video.js";

const RAM_COLORS = ["#fd38fd", "#69f6de", "#f44f4f", "#8bed70", "#fff68e", "#ff908f"];

// Texture gradient cầu vồng cho LED quạt; dịch offset.x để tạo hiệu ứng chạy vòng
function createGradientMaterial() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    ["#ff1f1f", "#ffa41d", "#ffff1f", "#74ff74", "#1d1dff", "#ff0cff"].forEach((c, i, arr) =>
        gradient.addColorStop(i / (arr.length - 1), c)
    );
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);

    return new THREE.MeshStandardMaterial({
        map: texture,
        emissive: 0xffffff,
        emissiveMap: texture,
        emissiveIntensity: 1,
        transparent: true,
    });
}

/**
 * Load Case_PC.glb. Tên mesh trong GLB quyết định hiệu ứng:
 *   Fan_Led*            → gradient chạy vòng
 *   Ram_Led*            → đổi màu đuổi nhau
 *   Fan_Dynamic*, Graphic_Fan* → quay
 *   AIO_Cooling_Display → phát video
 * @param {THREE.Scene} scene
 * @param {object} opt
 * @param {number} opt.fanSpeed      - tốc độ quay quạt (rad/s)
 * @param {number} opt.aioBrightness - độ sáng màn AIO
 * @param {{flipX:boolean, flipY:boolean}} opt.aioFlip
 * @returns {Promise<{root: THREE.Object3D, meshes: object, update: (delta:number, level:number)=>void}>}
 */
export async function loadCasePC(scene, { fanSpeed = 10, aioBrightness = 1, aioFlip = {} } = {}) {
    const root = await loadGLB("/models/Case_PC.glb");

    const meshes = {};
    const fanLeds = [];
    const ramLeds = [];
    const fans = [];
    let aioDisplay = null;

    root.traverse((mesh) => {
        if (!mesh.isMesh) return;
        meshes[mesh.name] = mesh;

        if (mesh.name.startsWith("Fan_Led")) {
            mesh.material = createGradientMaterial();
            fanLeds.push(mesh);
        } else if (mesh.name.startsWith("Ram_Led")) {
            mesh.material = new THREE.MeshStandardMaterial({ emissiveIntensity: 0.7 });
            ramLeds.push(mesh);
        } else if (mesh.name.startsWith("Fan_Dynamic") || mesh.name.startsWith("Graphic_Fan")) {
            fans.push(mesh);
        } else if (mesh.name === "AIO_Cooling_Display") {
            // NoColorSpace: giữ đúng màu như bản trước (texture không convert sRGB)
            const tex = createVideoTexture("/media/itachi.mp4", { ...aioFlip, colorSpace: THREE.NoColorSpace });
            mesh.material = new THREE.MeshStandardMaterial({
                map: tex,
                emissive: 0xffffff,
                emissiveMap: tex,
                transparent: true,
            });
            aioDisplay = mesh;
        }
    });

    const ramColors = RAM_COLORS.map((c) => new THREE.Color(c));
    let time = 0;

    // level: độ lớn nhạc 0 → 1 (LED quạt sáng theo nhịp)
    function update(delta, level = 0) {
        time += delta * 5;

        fanLeds.forEach((led) => {
            led.material.map.offset.x = (time * 0.02) % 1;
            led.material.emissiveIntensity = 1 + level * 2;
        });

        // Mỗi thanh RAM lệch 1 màu so với thanh trước → hiệu ứng chạy đuổi
        const step = Math.max(0, Math.floor(time)); // không để chỉ số âm nếu delta frame đầu bị âm
        ramLeds.forEach((led, i) => {
            const color = ramColors[(step + i) % ramColors.length];
            led.material.color.copy(color);
            led.material.emissive.copy(color);
        });

        // Quạt 01/02 nằm ngang nên quay quanh trục X, còn lại quay quanh Y
        fans.forEach((fan) => {
            const axis = fan.name === "Fan_Dynamic_01" || fan.name === "Fan_Dynamic_02" ? "x" : "y";
            fan.rotation[axis] += delta * fanSpeed;
        });

        // Màn AIO sáng nhấp nháy nhẹ
        if (aioDisplay) {
            aioDisplay.material.emissiveIntensity = aioBrightness * (10 + Math.sin(time * 0.5) * 0.25);
        }
    }

    scene.add(root);
    return { root, meshes, update };
}
