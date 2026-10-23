// core/keyboardHover.js
// Rê chuột qua bàn phím trong phòng → phím dưới con trỏ đổi màu theo màu LED (roomFx.accent), rời đi thì mờ dần
// (quét chuột qua sẽ để lại vệt sáng). Chỉ là lớp sáng bằng shader — KHÔNG dời vị trí phím
// (ánh sáng/AO đã bake vào texture). Từng phím là một khối hình học rời trong mesh "Keyboard".
import * as THREE from "three";
import { roomFx } from "./roomFx.js";
import { findIslands } from "../utils/meshIslands.js";

const FADE = 4;   // tốc độ mờ sau khi con trỏ rời phím (1/giây)
const GLOW = 0.9; // độ sáng phím đang được trỏ

/**
 * @param {THREE.Mesh} keyboard
 * @param {THREE.Camera} camera
 * @param {HTMLElement} domElement - canvas nhận sự kiện chuột
 */
export function createKeyboardHover(keyboard, camera, domElement) {
    const source = keyboard.geometry;
    const position = source.attributes.position;

    // Tấm nền = khối chiếm diện tích lớn nhất; các khối còn lại là phím
    const islands = findIslands(source);
    const area = (island) => {
        const box = new THREE.Box3();
        island.forEach((v) => box.expandByPoint(new THREE.Vector3().fromBufferAttribute(position, v)));
        const size = box.getSize(new THREE.Vector3());
        return size.x * size.z;
    };
    const base = islands.reduce((a, b) => (area(b) > area(a) ? b : a));
    const caps = islands.filter((i) => i !== base);

    // Chỉ số phím của từng đỉnh (-1 = tấm nền), dùng cho cả shader lẫn raycast
    const aKey = new Float32Array(position.count).fill(-1);
    caps.forEach((island, i) => island.forEach((v) => { aKey[v] = i; }));

    // Lớp phủ dùng chung position/index với bàn phím
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", position);
    geometry.setAttribute("aKey", new THREE.BufferAttribute(aKey, 1));
    geometry.setIndex(source.index);

    const levels = new Float32Array(caps.length);
    const material = new THREE.ShaderMaterial({
        uniforms: { uGlow: { value: levels }, uColor: { value: new THREE.Color() } },
        vertexShader: /* glsl */ `
            #define KEY_COUNT ${caps.length}
            attribute float aKey;
            uniform float uGlow[KEY_COUNT];
            varying float vGlow;
            void main() {
                vGlow = aKey < 0.0 ? 0.0 : uGlow[int(aKey + 0.5)];
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            varying float vGlow;
            void main() {
                if (vGlow < 0.004) discard;
                gl_FragColor = vec4(uColor * vGlow, 1.0);
                #include <colorspace_fragment>
            }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        polygonOffset: true, // vẽ đè đúng bề mặt gốc, không nhấp nháy z-fighting
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
    });
    const overlay = new THREE.Mesh(geometry, material);
    overlay.userData.skipIntro = true;
    overlay.raycast = () => {}; // không chặn raycast của các tương tác khác
    overlay.renderOrder = 2;
    overlay.visible = false;
    keyboard.add(overlay);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pending = null; // sự kiện chuột mới nhất, xử lý một lần mỗi frame
    let hovered = -1;
    let enabled = false;

    domElement.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "touch") pending = e;
    });
    domElement.addEventListener("pointerleave", () => {
        pending = null;
        hovered = -1;
    });

    function pick(event) {
        const rect = domElement.getBoundingClientRect();
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(keyboard, false)[0];
        return hit ? aKey[hit.face.a] : -1;
    }

    return {
        /** Bật sau intro; tắt khi camera đang bay tới vật thể / popup mở. */
        setEnabled(value) {
            enabled = value;
            if (!value) hovered = -1;
        },
        update(delta) {
            if (enabled && pending) hovered = pick(pending);
            pending = null;
            const k = Math.exp(-FADE * delta);
            let lit = false;
            for (let i = 0; i < levels.length; i++) {
                levels[i] = i === hovered ? 1 : levels[i] * k;
                if (levels[i] > 0.004) lit = true;
            }
            overlay.visible = lit; // không phím nào sáng → khỏi vẽ thêm cả bàn phím một lần nữa
            material.uniforms.uColor.value.copy(roomFx.accent).multiplyScalar(GLOW);
        },
    };
}
