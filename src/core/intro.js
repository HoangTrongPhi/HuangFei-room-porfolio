// core/intro.js
// Intro sau khi bấm Enter — căn phòng "được lắp ráp" như đi từ bản vẽ ra đời thật:
//   1. Camera quét vòng cung từ xa, cao, lệch góc → về vị trí xem mặc định
//   2. Tường mọc lên từ sàn; đồ đạc lớn rơi xuống đúng chỗ theo thứ tự từ thấp lên cao,
//      xoay nhẹ rồi đáp; đồ nhỏ (sách, bàn phím, cây...) bật ra tại chỗ
//   3. "Bật đèn": phòng sáng dần trong lúc lắp, cuối cùng màn hình/LED nhấp nháy rồi sáng hẳn (bloom)
import * as THREE from "three";
import gsap from "gsap";

const BUILD_SPREAD = 1.8;   // giây: khoảng thời gian từ vật đầu tiên tới vật cuối cùng bắt đầu xuất hiện
const DROP_HEIGHT = 0.12;   // mét (thế giới): độ cao rơi của đồ đạc
const SMALL_SIZE = 0.035;   // mét: cạnh lớn nhất nhỏ hơn mức này → coi là đồ nhỏ, bật ra tại chỗ
const CAMERA_TIME = 2.8;

/**
 * @param {object} opt
 * @param {THREE.Scene} opt.scene
 * @param {THREE.PerspectiveCamera} opt.camera
 * @param {import("../utils/OrbitControls.js").OrbitControls} opt.controls
 * @param {THREE.WebGLRenderer} opt.renderer
 * @param {{pass: {strength:number}} | null} [opt.bloom]
 * @param {boolean} [opt.reduced] - giảm chuyển động: chỉ mờ dần, không lắp ráp
 * @returns {Promise<void>} resolve khi intro xong
 */
export function playIntro({ scene, camera, controls, renderer, bloom, reduced = false }) {
    const exposure = renderer.toneMappingExposure;
    const bloomStrength = bloom?.pass.strength ?? 0;

    if (reduced) {
        renderer.toneMappingExposure = 0;
        return new Promise((resolve) => {
            gsap.to(renderer, { toneMappingExposure: exposure, duration: 0.8, onComplete: resolve });
        });
    }

    const pieces = collectPieces(scene);
    const tl = gsap.timeline();

    // ===== 1. Camera quét vòng cung =====
    controls.enabled = false;
    const target = controls.target.clone();
    const home = camera.position.clone();
    camera.lookAt(target);
    const offset = home.clone().sub(target);
    const up = new THREE.Vector3(0, 1, 0);
    const tmp = new THREE.Vector3();
    const orbit = { t: 0 };
    // Nội suy theo cung tròn (xoay + co khoảng cách + hạ độ cao) thay vì đường thẳng → cảm giác bay vòng quanh phòng
    const placeCamera = () => {
        const { lerp, degToRad } = THREE.MathUtils;
        tmp.copy(offset)
            .applyAxisAngle(up, lerp(degToRad(-50), 0, orbit.t))
            .multiplyScalar(lerp(1.7, 1, orbit.t));
        tmp.y += lerp(offset.length() * 0.6, 0, orbit.t);
        camera.position.copy(target).add(tmp);
    };
    placeCamera();
    tl.to(orbit, { t: 1, duration: CAMERA_TIME, ease: "power3.inOut", onUpdate: placeCamera }, 0);

    // ===== 2. Lắp ráp từ dưới lên =====
    pieces.forEach((p, i) => {
        // Đồ lớn lệch ngẫu nhiên chút cho tự nhiên; đồ nhỏ cùng tầng bật lần lượt trái → phải (gợn sóng)
        const at = 0.25 + (i / Math.max(1, pieces.length - 1)) * BUILD_SPREAD
            + (p.kind === "small" ? Math.min(p.rank, 6) * 0.07 : Math.random() * 0.12);
        const { obj, kind } = p;
        const pos = obj.position.clone();
        const scale = obj.scale.clone();

        if (kind === "wall") {
            // Mọc lên từ sàn (gốc toạ độ của tường nằm ở sàn)
            obj.scale.y = 0.001;
            tl.to(obj.scale, { y: scale.y, duration: 0.9, ease: "power3.out" }, at * 0.4);
        } else if (kind === "small") {
            obj.scale.set(0, 0, 0);
            tl.to(obj.scale, { x: scale.x, y: scale.y, z: scale.z, duration: 0.45, ease: "back.out(1.6)" }, at);
        } else {
            // Rơi từ trên xuống, xoay nhẹ quanh trục đứng rồi đáp, kèm nhún (scale) lúc chạm
            const rotY = obj.rotation.y;
            obj.position.y = pos.y + p.drop;
            obj.rotation.y = rotY + (Math.random() - 0.5) * 0.6;
            obj.scale.set(scale.x * 0.7, scale.y * 0.7, scale.z * 0.7);
            tl.to(obj.position, { y: pos.y, duration: 0.7, ease: "bounce.out" }, at)
                .to(obj.rotation, { y: rotY, duration: 0.7, ease: "power2.out" }, at)
                .to(obj.scale, { x: scale.x, y: scale.y, z: scale.z, duration: 0.6, ease: "back.out(2)" }, at);
        }
        obj.visible = true;
    });

    // ===== 3. Bật đèn =====
    renderer.toneMappingExposure = exposure * 0.15;
    if (bloom) bloom.pass.strength = 0;
    const buildEnd = 0.25 + BUILD_SPREAD + 0.7;
    tl.to(renderer, { toneMappingExposure: exposure * 0.7, duration: buildEnd, ease: "power1.in" }, 0)
        // Nhấp nháy như công tắc bật chập chờn rồi sáng hẳn
        .to(renderer, {
            keyframes: [
                { toneMappingExposure: exposure * 1.15, duration: 0.08 },
                { toneMappingExposure: exposure * 0.5, duration: 0.08 },
                { toneMappingExposure: exposure * 1.1, duration: 0.1 },
                { toneMappingExposure: exposure * 0.75, duration: 0.12 },
                { toneMappingExposure: exposure, duration: 0.3 },
            ],
        }, buildEnd);
    if (bloom) {
        tl.to(bloom.pass, {
            keyframes: [
                { strength: bloomStrength * 1.8, duration: 0.08 },
                { strength: 0, duration: 0.08 },
                { strength: bloomStrength * 1.5, duration: 0.1 },
                { strength: bloomStrength * 0.6, duration: 0.12 },
                { strength: bloomStrength, duration: 0.4 },
            ],
        }, buildEnd);
    }

    return new Promise((resolve) => {
        tl.eventCallback("onComplete", () => {
            controls.enabled = true;
            resolve();
        });
    });
}

// Các mesh tham gia intro, sắp theo độ cao đáy (thấp → cao) để lắp từ dưới lên;
// cùng tầng (lệch nhau < 1 cm) thì từ trái sang phải — vd. 4 logo trên kệ bật ra lần lượt
function collectPieces(scene) {
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const parentScale = new THREE.Vector3();
    const pieces = [];

    scene.updateMatrixWorld(true);
    scene.traverse((obj) => {
        if (!obj.isMesh || obj.userData.skipIntro) return;
        const name = obj.name.toLowerCase();
        if (name.includes("background")) return;

        box.setFromObject(obj);
        box.getSize(size);
        const kind = name === "wall" ? "wall" : Math.max(size.x, size.y, size.z) < SMALL_SIZE ? "small" : "drop";

        // Độ cao rơi tính theo mét thế giới → đổi sang đơn vị của cha (phòng bị scale 0.01)
        obj.parent.getWorldScale(parentScale);
        pieces.push({ obj, kind, bottom: box.min.y, left: box.min.x, drop: DROP_HEIGHT / (parentScale.y || 1) });
    });

    const tier = (y) => Math.round(y / 0.01);
    pieces.sort((a, b) => tier(a.bottom) - tier(b.bottom) || a.left - b.left);
    // rank = thứ tự trong cùng tầng (dùng cho hiệu ứng gợn sóng của đồ nhỏ)
    pieces.forEach((p, i) => {
        const prev = pieces[i - 1];
        p.rank = prev && tier(prev.bottom) === tier(p.bottom) ? prev.rank + 1 : 0;
    });
    return pieces;
}
