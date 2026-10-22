// core/Social_Link.js
// Logo mạng xã hội: hover → nhô nhẹ ra khỏi tường + sáng lên, click → mở link.
// Logo chỉ rộng ~2,2 cm và xếp sát nhau (khe ~5 mm) nên hiệu ứng phải nhỏ, không đè sang logo bên cạnh.
import * as THREE from "three";
import gsap from "gsap";
import { loadGLB } from "./loader.js";
import { track } from "./analytics.js";
import { setPointer } from "./interactions.js";

const BASE_SCALE = 0.01;
const HOVER_SCALE = BASE_SCALE * 1.08;
const HOVER_OFFSET_Z = 0.004; // mét: nhô ra 4 mm
const HOVER_GLOW = 0.35;      // độ sáng thêm (emissive) khi hover

/**
 * @param {THREE.Scene} scene
 * @param {string} path - đường dẫn Social_Link.glb
 * @param {Object<string,string>} links - { từ khoá trong tên mesh: URL }
 * @returns {Promise<{meshes: object, setupInteractions: (camera: THREE.Camera, domElement: HTMLElement) => void}>}
 */
export async function loadSocialLinks(scene, path, links) {
    const root = await loadGLB(path);

    // Tách từng logo ra thành mesh độc lập trong scene để animate riêng
    const meshes = {};
    root.traverse((child) => {
        if (!child.isMesh) return;
        const mesh = child.clone();
        mesh.material = child.material.clone();
        // Chuẩn bị lớp sáng khi hover: lấy chính texture logo làm emissive, mặc định tắt
        if (mesh.material.emissive) {
            mesh.material.emissive.set(0xffffff);
            mesh.material.emissiveMap ??= mesh.material.map;
            mesh.material.emissiveIntensity = 0;
        }
        mesh.scale.setScalar(BASE_SCALE);
        mesh.userData.initialScale = mesh.scale.clone();
        mesh.userData.initialPosition = mesh.position.clone();
        scene.add(mesh);
        meshes[child.name] = mesh;
    });
    const targets = Object.values(meshes);

    function setupInteractions(camera, domElement) {
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let hovered = null;

        // Trả về logo dưới con trỏ (hoặc null)
        function pick(event) {
            pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            return raycaster.intersectObjects(targets)[0]?.object ?? null;
        }

        // overwrite: "auto" chỉ thay tween trên cùng thuộc tính, không giết tween của intro khi hover sớm
        function hover(mesh) {
            const opts = { duration: 0.3, ease: "power3.out", overwrite: "auto" };
            gsap.to(mesh.scale, { x: HOVER_SCALE, y: HOVER_SCALE, z: HOVER_SCALE, ...opts });
            gsap.to(mesh.position, { z: mesh.userData.initialPosition.z + HOVER_OFFSET_Z, ...opts });
            if (mesh.material.emissive) gsap.to(mesh.material, { emissiveIntensity: HOVER_GLOW, ...opts });
        }

        function reset(mesh) {
            const { initialScale: s, initialPosition: p } = mesh.userData;
            const opts = { duration: 0.35, ease: "power2.out", overwrite: "auto" };
            gsap.to(mesh.scale, { x: s.x, y: s.y, z: s.z, ...opts });
            gsap.to(mesh.position, { x: p.x, y: p.y, z: p.z, ...opts });
            if (mesh.material.emissive) gsap.to(mesh.material, { emissiveIntensity: 0, ...opts });
        }

        domElement.addEventListener("pointermove", (event) => {
            const target = pick(event);
            if (target !== hovered) {
                if (hovered) reset(hovered);
                if (target) hover(target);
                hovered = target;
            }
            setPointer(domElement, "social", !!target);
        });

        domElement.addEventListener("click", (event) => {
            const clicked = pick(event);
            if (!clicked) return;
            const key = Object.keys(links).find((k) => clicked.name.includes(k));
            if (!key) return;
            track("click", key.toLowerCase());
            window.open(links[key], "_blank", "noopener,noreferrer");
        });
    }

    return { meshes, setupInteractions };
}
