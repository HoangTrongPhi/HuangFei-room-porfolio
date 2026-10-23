// core/roomMotion.js
// Chuyển động nhẹ cho phòng "sống" hơn:
//  - Ghế: phần trên (Chair_top) xoay qua lại chậm như vừa có người đứng dậy; bấm vào → xoay một vòng
//  - Cây treo (Tree_01/02): lá đung đưa bằng vertex shader, phần càng rủ xa chậu càng lắc nhiều
import * as THREE from "three";
import gsap from "gsap";
import { createBlobShadow } from "./blobShadow.js";

const CHAIR_SWAY = 0.12;     // rad, biên độ xoay qua lại của ghế
const CHAIR_PERIOD = 9;      // giây cho một chu kỳ
// Cây: toạ độ cục bộ của phòng (cm). Trên TREE_TOP là chậu + lá mọc lên → đứng yên.
const TREE_TOP = 23.5;
const TREE_RANGE = 4;        // cm phía dưới TREE_TOP thì đạt biên độ tối đa
const TREE_AMPLITUDE = 0.25; // cm

/**
 * @param {THREE.Object3D} room - root của room_portfolio.glb
 */
export function createRoomMotion(room) {
    const chairTop = room.getObjectByName("Chair_top");
    const chairBottom = room.getObjectByName("Chair_bottom");
    const trees = ["Tree_01", "Tree_02"].map((n) => room.getObjectByName(n)).filter(Boolean);

    // Góc ghế = lắc qua lại + vòng xoay khi bấm (cộng dồn để không bị giật khi xoay xong)
    const chair = { sway: 0, spin: 0 };
    let started = false;
    let treesOn = false;

    // Pivot export từ Maya của Chair_top lệch khỏi ống hơi ~0.4 cm → xoay bị lắc tâm.
    // Đặt Chair_top vào một group có tâm đúng trục ống hơi rồi xoay group đó.
    let swivel = null;
    let chairShadow = null;
    if (chairTop && chairBottom) {
        room.updateMatrixWorld(true);
        const axis = findSwivelAxis(chairBottom);
        swivel = new THREE.Group();
        swivel.name = "Chair_swivel";
        swivel.position.set(axis.x, 0, axis.z);
        room.add(swivel);
        swivel.updateMatrixWorld();
        swivel.attach(chairTop); // giữ nguyên vị trí trên màn hình

        // Bóng mềm dưới chân ghế: tâm = trục ghế, cao = đáy chân ghế (mặt sàn)
        const floor = room.worldToLocal(new THREE.Vector3(0, new THREE.Box3().setFromObject(chairBottom).min.y, 0)).y;
        chairShadow = createBlobShadow(5.5, 0.45);
        chairShadow.position.set(axis.x, floor + 0.03, axis.z);
        room.add(chairShadow);
    }

    const treeUniforms = { uTime: { value: 0 } };
    const treeMaterial = trees[0]?.material;
    if (treeMaterial) {
        treeMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = treeUniforms.uTime;
            shader.vertexShader = shader.vertexShader
                .replace("#include <common>", "#include <common>\nuniform float uTime;")
                .replace("#include <begin_vertex>", /* glsl */ `#include <begin_vertex>
                float hang = clamp((${TREE_TOP.toFixed(2)} - position.y) / ${TREE_RANGE.toFixed(2)}, 0.0, 1.0);
                hang *= hang;
                transformed.x += sin(uTime * 1.3 + position.y * 0.9 + position.z * 0.4) * ${TREE_AMPLITUDE.toFixed(2)} * hang;
                transformed.z += cos(uTime * 1.1 + position.y * 0.7 + position.x * 0.4) * ${TREE_AMPLITUDE.toFixed(2)} * hang;`);
        };
        treeMaterial.customProgramCacheKey = () => "tree-sway";
        treeMaterial.needsUpdate = true;
    }

    return {
        chairMeshes: [chairTop, chairBottom].filter(Boolean),

        /** Bắt đầu sau intro (intro đang tween vị trí/góc của ghế). */
        start({ reduced = false } = {}) {
            if (chairShadow) gsap.to(chairShadow.material, { opacity: chairShadow.userData.opacity, duration: 0.6 });
            treesOn = !reduced;
            if (!swivel || reduced) return;
            // Bắt đầu từ 0 rồi lắc đều hai phía
            gsap.timeline()
                .to(chair, { sway: CHAIR_SWAY, duration: CHAIR_PERIOD / 4, ease: "sine.out" })
                .to(chair, { sway: -CHAIR_SWAY, duration: CHAIR_PERIOD / 2, ease: "sine.inOut", repeat: -1, yoyo: true });
            started = true;
        },

        /** Xoay ghế một vòng (bấm vào ghế). */
        spinChair() {
            if (!started || chair.spin !== 0) return; // đang xoay dở
            gsap.to(chair, { spin: Math.PI * 2, duration: 1.6, ease: "power2.out", onComplete: () => { chair.spin = 0; } });
        },

        update(delta) {
            if (treesOn) treeUniforms.uTime.value += delta;
            if (started) swivel.rotation.y = chair.sway + chair.spin;
        },
    };
}

// Trục ống hơi = tâm vòng đỉnh trên cùng của Chair_bottom (đầu ống hơi), toạ độ trong không gian của phòng
function findSwivelAxis(chairBottom) {
    const position = chairBottom.geometry.attributes.position;
    const v = new THREE.Vector3();
    let maxY = -Infinity;
    for (let i = 0; i < position.count; i++) maxY = Math.max(maxY, v.fromBufferAttribute(position, i).applyMatrix4(chairBottom.matrix).y);

    const sum = new THREE.Vector3();
    let n = 0;
    for (let i = 0; i < position.count; i++) {
        v.fromBufferAttribute(position, i).applyMatrix4(chairBottom.matrix);
        if (v.y < maxY - 1) continue; // 1 cm trên cùng = đoạn đầu ống hơi
        sum.add(v);
        n++;
    }
    return sum.divideScalar(n);
}
