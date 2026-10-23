// core/liteMaterials.js
// Vật liệu nhẹ cho điện thoại: MeshStandardMaterial (PBR: 4–5 texture + env map mỗi điểm ảnh)
// → MeshLambertMaterial (chỉ màu + emissive + AO). GPU điện thoại đỡ rất nhiều phép tính mỗi điểm ảnh,
// và các texture normal / roughness / metalness không còn ai dùng nên không bị đẩy lên GPU (đỡ VRAM).
// Đánh đổi: mất độ bóng / phản chiếu kim loại và chi tiết normal map.
import * as THREE from "three";

/** Có dùng vật liệu nhẹ không: mặc định theo thiết bị; ép bằng ?lite=1 / ?lite=0 để so sánh */
export function useLiteMaterials(isMobile) {
    const param = new URLSearchParams(location.search).get("lite");
    return param === null ? isMobile : param !== "0";
}

const cache = new WeakMap(); // vật liệu gốc → bản Lambert (giữ nguyên việc dùng chung vật liệu giữa các mesh)

/** @param {THREE.Material} m */
function toLambert(m) {
    if (!m?.isMeshStandardMaterial) return m;
    if (cache.has(m)) return cache.get(m);

    const lite = new THREE.MeshLambertMaterial({
        name: m.name,
        color: m.color,
        map: m.map,
        emissive: m.emissive,
        emissiveMap: m.emissiveMap,
        emissiveIntensity: m.emissiveIntensity,
        aoMap: m.aoMap,
        aoMapIntensity: m.aoMapIntensity,
        lightMap: m.lightMap,
        lightMapIntensity: m.lightMapIntensity,
        alphaMap: m.alphaMap,
        alphaTest: m.alphaTest,
        transparent: m.transparent,
        opacity: m.opacity,
        side: m.side,
        vertexColors: m.vertexColors,
        depthWrite: m.depthWrite,
        toneMapped: m.toneMapped,
    });
    // PBR: kim loại gần như không có màu khuếch tán (chỉ phản chiếu) → Lambert sẽ sáng quá, hạ bớt cho gần bản gốc
    lite.color.multiplyScalar(1 - 0.6 * (m.metalness ?? 0));
    lite.userData = { ...m.userData, liteFrom: m.type };
    cache.set(m, lite);
    return lite;
}

/** Đổi mọi MeshStandardMaterial trong cây đối tượng sang bản Lambert. */
export function applyLiteMaterials(root) {
    root.traverse((o) => {
        if (!o.isMesh) return;
        o.material = Array.isArray(o.material) ? o.material.map(toLambert) : toLambert(o.material);
    });
}
