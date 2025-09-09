// core/camera.js
import * as THREE from "three";
import { OrbitControls } from "../utils/OrbitControls.js";

export const sizes = { width: window.innerWidth, height: window.innerHeight };

// Camera
export const camera = new THREE.PerspectiveCamera(
    35,
    sizes.width / sizes.height,
    0.1,
    200
);
camera.rotation.order = "XYZ";

// Renderer
export const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#experience-canvas"),
    antialias: true,
    alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Controls
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0.001;
controls.maxDistance = 1e6;

// ===== Helpers =====
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/**
 * Đặt vị trí camera khởi động (startup).
 * @param {{
 *   pos:[number,number,number],      // vị trí camera
 *   target:[number,number,number],   // điểm nhìn
 *   fov?:number,                     // vertical FOV (độ)
 *   near?:number,                    // near clip
 *   far?:number,                     // far clip
 *   zoom?:number                     // hệ số zoom (1.0 = gốc, >1 xa hơn, <1 gần hơn)
 * }} opt
 */
export function setStartupCamera(opt){
    const { pos, target, fov = 35, near = 0.1, far = 200, zoom = 1.0 } = opt;

    camera.fov  = clamp(fov, 1, 110);
    camera.near = Math.max(1e-4, near);
    camera.far  = Math.max(camera.near + 1e-3, far);
    camera.updateProjectionMatrix();

    const posVec = new THREE.Vector3(...pos);
    const targetVec = new THREE.Vector3(...target);
    const dir = posVec.clone().sub(targetVec).multiplyScalar(zoom);

    camera.position.copy(targetVec.clone().add(dir));
    controls.target.copy(targetVec);
    controls.update();
}

// Resize
window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ===== Áp startup mặc định =====
setStartupCamera({
    pos:    [7, 5, 7],     // vị trí khởi động
    target: [0, .1, 0],    // nhìn vào tâm phòng
    fov:    35,            // FOV (độ)
    near:   0.01,
    far:    200,
    zoom:   0.1,           // hệ số zoom khởi động
});
