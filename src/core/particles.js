// core/particles.js
// Hạt bụi ánh sáng / đom đóm neon trôi lơ lửng quanh căn phòng.
// Trôi lên chậm + lắc ngang; màu pha theo màu LED hiện tại; nháy và to ra theo nhạc (Party mode mạnh hơn).
import * as THREE from "three";
import gsap from "gsap";
import { roomFx } from "./roomFx.js";

const COUNT = 220;

const vertexShader = /* glsl */ `
    attribute float aSeed;
    uniform float uTime;
    uniform float uSize;
    uniform float uLevel;
    uniform float uPixelRatio;
    uniform vec3 uMin;
    uniform vec3 uMax;
    varying float vTwinkle;
    varying float vSeed;

    void main() {
        vec3 size = uMax - uMin;
        vec3 p = position;
        // Trôi lên rồi quay vòng xuống đáy; lắc ngang theo sin riêng từng hạt
        p.y = uMin.y + mod(p.y - uMin.y + uTime * (0.004 + aSeed * 0.006), size.y);
        p.x += sin(uTime * 0.6 + aSeed * 40.0) * 0.012;
        p.z += cos(uTime * 0.5 + aSeed * 23.0) * 0.012;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        vTwinkle = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 60.0);
        vSeed = aSeed;
        float s = uSize * (0.5 + aSeed) * (1.0 + uLevel * 1.4);
        gl_PointSize = s * uPixelRatio * 300.0 / -mv.z; // to dần khi lại gần camera
    }
`;

const fragmentShader = /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uOpacity;
    uniform float uLevel;
    varying float vTwinkle;
    varying float vSeed;

    void main() {
        // Chấm tròn mềm: sáng ở tâm, mờ dần ra mép
        float d = length(gl_PointCoord - 0.5);
        float glow = smoothstep(0.5, 0.0, d);
        glow *= glow;
        vec3 color = mix(uColorA, uColorB, step(0.5, vSeed));
        float a = glow * vTwinkle * uOpacity * (0.7 + uLevel * 0.8);
        gl_FragColor = linearToOutputTexel(vec4(color * (1.0 + uLevel), a));
    }
`;

/**
 * @param {THREE.Scene} scene
 * @param {THREE.Box3} bounds - vùng hạt bay (mét, toạ độ thế giới)
 * @param {number} pixelRatio
 */
export function createParticles(scene, bounds, pixelRatio) {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const size = bounds.getSize(new THREE.Vector3());
    for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = bounds.min.x + Math.random() * size.x;
        positions[i * 3 + 1] = bounds.min.y + Math.random() * size.y;
        positions[i * 3 + 2] = bounds.min.z + Math.random() * size.z;
        seeds[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uSize: { value: 0.025 },
            uLevel: { value: 0 },
            uPixelRatio: { value: pixelRatio },
            uOpacity: { value: 0 },
            uMin: { value: bounds.min.clone() },
            uMax: { value: bounds.max.clone() },
            uColorA: { value: new THREE.Color("#66e0ff") },
            uColorB: { value: new THREE.Color("#ff6bd6") },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; // vị trí thật tính trong shader, bounding sphere gốc không đúng
    points.raycast = () => {};
    scene.add(points);

    const pink = new THREE.Color("#ff6bd6");
    const u = material.uniforms;

    // Mặc định tắt; chỉ hiện khi đã qua intro (ready) VÀ người xem bật ở bảng điều khiển (enabled)
    let ready = false;
    let enabled = false;
    points.visible = false;
    function apply() {
        const on = ready && enabled;
        if (on) points.visible = true;
        gsap.to(u.uOpacity, {
            value: on ? 1 : 0,
            duration: on ? 1.5 : 0.6,
            ease: "power1.inOut",
            overwrite: true,
            onComplete: () => { points.visible = on; },
        });
    }

    return {
        update(delta, level) {
            if (!points.visible) return;
            u.uTime.value += delta;
            u.uLevel.value = level * (roomFx.party ? 1.6 : 0.8);
            // Một nửa số hạt theo màu LED hiện tại, nửa còn lại pha hồng (màu dải LED chân tường)
            u.uColorA.value.lerp(roomFx.accent, 0.08);
            u.uColorB.value.copy(pink).lerp(roomFx.accent, roomFx.ledColor ? 0.6 : 0.15);
        },
        /** Gọi khi intro xong; hạt chỉ hiện nếu đang bật */
        show() {
            ready = true;
            apply();
        },
        /** Bật/tắt hạt sáng (nút "Sparkles" ở bảng điều khiển) */
        setEnabled(value) {
            enabled = value;
            apply();
        },
        setPixelRatio(value) {
            u.uPixelRatio.value = value;
        },
    };
}
