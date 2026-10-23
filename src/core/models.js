// core/models.js
import * as THREE from "three";
import { loadGLB, liteMaterials } from "./loader.js";

// room_portfolio.glb được export ở đơn vị cm → thu về mét
const ROOM_SCALE = 0.01;
// Vật liệu nhẹ (Lambert) không nhận ánh sáng từ env map → bù bằng ambient.
// 2.0: đo độ sáng trung bình khung hình khớp bản PBR (~61/255) ở góc nhìn mặc định
const LITE_AMBIENT = 2.0;

/** Load phòng chính (room_portfolio.glb) và thêm vào scene. */
export async function loadSceneModel(scene) {
    const root = await loadGLB("/models/room_portfolio.glb");
    root.scale.setScalar(ROOM_SCALE);

    let hasLights = false;
    root.traverse((o) => {
        if (o.isMesh && o.material?.map) o.material.map.colorSpace = THREE.SRGBColorSpace;
        // Tấm nền quanh phòng giữ màu tối, không nhận env map (nếu không sẽ thành xám)
        if (o.isMesh && o.material?.name === "M_BG") o.material.envMapIntensity = 0;
        if (o.isLight) hasLights = true; // đèn KHR_lights_punctual export từ Blender
    });

    // GLB hiện tại không chứa đèn → thêm ánh sáng cơ bản để vật liệu không bị đen
    // (ambient thấp vì env map trong core/light.js đã góp phần sáng nền)
    if (!hasLights) {
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(3, 4, 2);
        scene.add(ambient, dir);
    }
    if (liteMaterials) scene.add(new THREE.AmbientLight(0xffffff, LITE_AMBIENT));

    const poster = root.getObjectByName("Poster");
    if (poster) fixFrameInnerWalls(poster);

    scene.add(root);
    return root;
}

/**
 * Khung tranh (Poster): tranh nằm lùi sau mặt khung, nên nhìn chéo sẽ thấy các thành trong của khung.
 * UV của các thành này nằm sát mép giữa viền đen và vùng xám thừa trong texture → texture nén bị lem
 * thành dải xám sáng, trông như tranh bị hở. Trỏ UV các thành trong vào giữa thanh viền đen bên trái.
 * Chỉ sửa UV, không đụng hình học (giữ khớp ánh sáng đã bake).
 */
function fixFrameInnerWalls(mesh) {
    const { position, normal, uv } = mesh.geometry.attributes;
    if (!normal || !uv) return;
    const facesFront = (i) => normal.getZ(i) > 0.9;

    // Mặt tranh = các đỉnh hướng ra trước nằm sâu nhất; mặt khung = các đỉnh hướng ra trước còn lại
    let backZ = Infinity;
    for (let i = 0; i < position.count; i++) if (facesFront(i)) backZ = Math.min(backZ, position.getZ(i));
    const picture = new THREE.Box2();
    for (let i = 0; i < position.count; i++) {
        if (facesFront(i) && Math.abs(position.getZ(i) - backZ) < 1e-3) picture.expandByPoint(new THREE.Vector2(position.getX(i), position.getY(i)));
    }
    if (picture.isEmpty()) return;

    // UV giữa thanh viền đen bên trái = trung bình UV các đỉnh mặt khung nằm bên trái tranh
    const bar = new THREE.Vector2();
    let count = 0;
    for (let i = 0; i < position.count; i++) {
        if (facesFront(i) && position.getZ(i) > backZ + 1e-3 && position.getX(i) <= picture.min.x) {
            bar.add(new THREE.Vector2(uv.getX(i), uv.getY(i)));
            count++;
        }
    }
    if (!count) return;
    bar.divideScalar(count);

    // Thành trong: pháp tuyến nằm ngang, vị trí nằm trong lỗ khung
    const opening = picture.clone().expandByScalar(0.02);
    for (let i = 0; i < position.count; i++) {
        if (Math.abs(normal.getZ(i)) < 0.5 && opening.containsPoint(new THREE.Vector2(position.getX(i), position.getY(i)))) {
            uv.setXY(i, bar.x, bar.y);
        }
    }
    uv.needsUpdate = true;
}
