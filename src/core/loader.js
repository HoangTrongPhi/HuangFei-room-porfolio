// core/loader.js
// GLTFLoader dùng chung cho mọi model. Draco decoder lấy từ /public/draco/
// (hiện chưa GLB nào nén Draco, nhưng để sẵn nếu sau này export có nén).
// Đồng thời theo dõi tiến trình tải của mọi file GLB cho màn hình loading.
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const dracoLoader = new DRACOLoader().setDecoderPath("/draco/");
const gltfLoader = new GLTFLoader().setDRACOLoader(dracoLoader);

// url → { loaded, total, done } (byte)
const files = new Map();
const listeners = new Set();

// Tính theo byte khi mọi file đều biết dung lượng; nếu không thì mỗi file chiếm phần bằng nhau
function progress() {
    const list = [...files.values()];
    if (!list.length) return 0;
    if (list.every((f) => f.total)) {
        const total = list.reduce((s, f) => s + f.total, 0);
        const loaded = list.reduce((s, f) => s + (f.done ? f.total : f.loaded), 0);
        return loaded / total;
    }
    return list.reduce((s, f) => s + (f.done ? 1 : f.total ? f.loaded / f.total : 0), 0) / list.length;
}

function emit() {
    const p = progress();
    listeners.forEach((cb) => cb(p));
}

/** Trạng thái từng file: [{ url, loaded, total, done }] (dùng cho log trên màn hình loading). */
export function getLoadFiles() {
    return [...files].map(([url, f]) => ({ url, ...f }));
}

/** Đăng ký nhận tiến trình tải (0 → 1) của tất cả GLB. */
export function onLoadProgress(cb) {
    listeners.add(cb);
    cb(progress());
}

/** Load một file .glb và trả về scene gốc của nó. */
export async function loadGLB(url) {
    const file = { loaded: 0, total: 0, done: false };
    files.set(url, file);
    emit();

    try {
        const gltf = await gltfLoader.loadAsync(url, (e) => {
            file.loaded = e.loaded;
            file.total = e.lengthComputable ? e.total : 0;
            emit();
        });
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) throw new Error(`GLB không có scene: ${url}`);
        return root;
    } finally {
        file.done = true; // lỗi cũng tính là xong để thanh loading không bị treo
        emit();
    }
}
