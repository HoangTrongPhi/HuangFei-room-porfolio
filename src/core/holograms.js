// core/holograms.js
// Màn hình hologram lơ lửng hai bên căn phòng, chiếu video các dự án trong WORK (content.js).
// Shader riêng: scanline, viền neon, nhấp nháy nhẹ, hiệu ứng "hiện hình" quét từ dưới lên.
// Các tấm luôn quay thẳng mặt về phía camera (nhìn từ trên xuống cũng không bị xiên) và lơ lửng nhấp nhô.
import * as THREE from "three";
import gsap from "gsap";
import { createVideoTexture, setVideoWanted } from "./video.js";

const PANEL_W = 0.11;            // mét
const PANEL_H = PANEL_W * 9 / 16;

const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = /* glsl */ `
    uniform sampler2D map;
    uniform float uTime;
    uniform float uHover;
    uniform float uReveal;
    uniform vec3 uTint;
    varying vec2 vUv;

    void main() {
        vec3 video = texture2D(map, vUv).rgb;

        // Khoảng cách tới mép gần nhất → viền phát sáng
        float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float border = 1.0 - smoothstep(0.006, 0.02, edge);

        float scan = 0.88 + 0.12 * sin(vUv.y * 420.0 - uTime * 7.0);
        float flicker = 0.96 + 0.04 * sin(uTime * 41.0) * sin(uTime * 7.3);

        // Hiện hình: vạch sáng chạy từ dưới lên, phía trên vạch chưa hiện
        float front = uReveal * 1.15 - 0.075;
        float shown = step(vUv.y, front);
        float line = smoothstep(0.035, 0.0, abs(vUv.y - front)) * step(uReveal, 0.999);

        // Nghỉ: pha màu hologram; hover: hiện màu video rõ hơn, sáng hơn
        vec3 holo = mix(video * 0.75 + uTint * 0.25, video, uHover);
        vec3 color = holo * scan * flicker * (0.95 + uHover * 0.35);
        color += uTint * (border * (1.2 + uHover) + line * 2.0);

        float alpha = (mix(0.78, 0.97, uHover) * scan + border) * shown + line;
        gl_FragColor = linearToOutputTexel(vec4(color, clamp(alpha, 0.0, 1.0)));
    }
`;

// Nhãn dưới mỗi tấm: vẽ chữ lên canvas làm texture
function createLabel(text, tint) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.font = "600 30px ui-monospace, Consolas, monospace";
    ctx.fillStyle = tint;
    ctx.shadowColor = tint;
    ctx.shadowBlur = 12;
    ctx.fillText(text, 8, 42);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(PANEL_W, PANEL_W / 8),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }),
    );
    mesh.position.set(0, -PANEL_H / 2 - PANEL_W / 14, 0);
    mesh.raycast = () => {}; // không chặn click vào tấm
    mesh.userData.skipIntro = true;
    return mesh;
}

/**
 * @param {THREE.Scene} scene
 * @param {Array<{id:string, title:string, video?:string}>} projects - WORK trong content.js (chỉ lấy dự án có video)
 * @param {Array<[number, number, number]>} slots - vị trí đặt các tấm (mét, toạ độ thế giới)
 */
export function createHolograms(scene, projects, slots) {
    const group = new THREE.Group();
    group.name = "Holograms";
    group.visible = false;
    scene.add(group);

    const tints = ["#66e0ff", "#ff6bd6", "#a07bff", "#7cf0c5"];
    const panels = projects.filter((p) => p.video).slice(0, slots.length).map((project, i) => {
        const tint = new THREE.Color(tints[i % tints.length]);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: createVideoTexture(project.video, { autoplay: false }) }, // chỉ tải / phát khi tấm đang hiện
                uTime: { value: 0 },
                uHover: { value: 0 },
                uReveal: { value: 0 },
                uTint: { value: tint },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), material);
        screen.userData.projectId = project.id;
        screen.userData.skipIntro = true; // hologram hiện sau intro bằng hiệu ứng riêng

        const holder = new THREE.Group();
        holder.add(screen, createLabel(`${String(i + 1).padStart(2, "0")} · ${project.title.toUpperCase()}`, tints[i % tints.length]));
        holder.position.set(...slots[i]);
        group.add(holder);
        return { holder, screen, material, base: holder.position.y, phase: i * 1.7 };
    });

    let time = 0;
    let revealed = false;
    let playing = false;
    const target = new THREE.Vector3();

    return {
        group,
        /** Mesh màn hình (để đăng ký hover/click) */
        screens: panels.map((p) => p.screen),
        update(delta, camera) {
            // Màn hình dọc (điện thoại): hai bên phòng không còn chỗ trống → ẩn
            group.visible = revealed && camera.aspect >= 1;
            if (playing !== group.visible) { // ẩn → dừng giải mã video (đỡ tốn pin / CPU trên điện thoại)
                playing = group.visible;
                panels.forEach((p) => setVideoWanted(p.material.uniforms.map.value, playing));
            }
            if (!group.visible) return;
            time += delta;
            panels.forEach((p) => {
                p.material.uniforms.uTime.value = time;
                p.holder.position.y = p.base + Math.sin(time * 0.9 + p.phase) * 0.004;
                // Quay thẳng mặt về camera, rồi lắc nhẹ quanh trục đứng cho sống động
                camera.getWorldPosition(target);
                p.holder.lookAt(target);
                p.holder.rotateY(Math.sin(time * 0.5 + p.phase) * 0.08);
            });
        },
        /** Hiện lần lượt với hiệu ứng quét từ dưới lên */
        reveal() {
            revealed = true;
            panels.forEach((p, i) => {
                gsap.fromTo(p.material.uniforms.uReveal, { value: 0 }, { value: 1, duration: 1.1, delay: i * 0.25, ease: "power2.out" });
            });
        },
        setHover(projectId) {
            panels.forEach((p) => {
                const on = p.screen.userData.projectId === projectId;
                gsap.to(p.material.uniforms.uHover, { value: on ? 1 : 0, duration: 0.3, overwrite: true });
                gsap.to(p.holder.scale, { x: on ? 1.12 : 1, y: on ? 1.12 : 1, z: on ? 1.12 : 1, duration: 0.35, ease: "power3.out", overwrite: true });
            });
        },
    };
}
