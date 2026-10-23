// core/models.js
import * as THREE from "three";
import { loadGLB } from "./loader.js";

// room_portfolio.glb được export ở đơn vị cm → thu về mét
const ROOM_SCALE = 0.01;

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

    scene.add(root);
    return root;
}
