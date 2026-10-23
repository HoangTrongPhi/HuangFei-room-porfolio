// utils/meshIslands.js
// Tách mesh thành các khối hình học rời ("đảo"): nối đỉnh cùng tam giác và đỉnh trùng vị trí (seam UV/normal).
// Dùng khi nhiều vật được gộp chung một mesh lúc export (robot + dock, từng phím trên bàn phím...).

/**
 * @param {import("three").BufferGeometry} geometry - geometry có index
 * @returns {number[][]} danh sách đảo, mỗi đảo là mảng chỉ số đỉnh
 */
export function findIslands(geometry) {
    const index = geometry.index.array;
    const position = geometry.attributes.position;
    const parent = Int32Array.from({ length: position.count }, (_, i) => i);
    const find = (i) => {
        while (parent[i] !== i) i = parent[i] = parent[parent[i]];
        return i;
    };
    const union = (a, b) => { parent[find(a)] = find(b); };

    for (let i = 0; i < index.length; i += 3) {
        union(index[i], index[i + 1]);
        union(index[i], index[i + 2]);
    }
    const byPosition = new Map();
    for (let i = 0; i < position.count; i++) {
        const key = `${position.getX(i).toFixed(4)},${position.getY(i).toFixed(4)},${position.getZ(i).toFixed(4)}`;
        byPosition.has(key) ? union(i, byPosition.get(key)) : byPosition.set(key, i);
    }

    const groups = new Map();
    for (let i = 0; i < position.count; i++) {
        const root = find(i);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root).push(i);
    }
    return [...groups.values()];
}
