// core/loader.js
// GLTFLoader dùng chung cho mọi model. Draco decoder lấy từ /public/draco/
// (room_portfolio, Case_PC, Social_Link, Monitor đều nén Draco).
// Texture nén KTX2 (Basis: ETC1S cho màu/ORM, UASTC cho normal) → giải mã bằng transcoder ở /public/basis/,
// lên GPU ở dạng nén nên tốn ít VRAM hơn WebP nhiều lần.
// Đồng thời theo dõi tiến trình tải của mọi file GLB cho màn hình loading.
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { isMobile } from "./device.js";
import { useLiteMaterials, applyLiteMaterials } from "./liteMaterials.js";

const dracoLoader = new DRACOLoader().setDecoderPath("/draco/");
const ktx2Loader = new KTX2Loader().setTranscoderPath("/basis/");
const gltfLoader = new GLTFLoader().setDRACOLoader(dracoLoader).setKTX2Loader(ktx2Loader);

/** Phải gọi trước loadGLB: KTX2Loader cần renderer để chọn định dạng nén GPU hỗ trợ (BC7/ASTC/ETC...). */
export function initLoader(renderer) {
    ktx2Loader.detectSupport(renderer);
}

// url → { loaded, total, done } (byte)
const files = new Map();
// Dung lượng GLB đọc sẵn lúc build (vite.config.js): dùng khi server nén Brotli nên thiếu Content-Length
const knownSizes = __MODEL_SIZES__;
export const liteMaterials = useLiteMaterials(isMobile); // điện thoại: PBR → Lambert ngay khi tải, trước khi module khác giữ tham chiếu vật liệu
const LOAD_TIMEOUT = 120_000; // ms — đủ rộng cho mạng 3G chậm tải hết ~8MB
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
    const file = { loaded: 0, total: knownSizes[url] ?? 0, done: false };
    files.set(url, file);
    emit();

    // Worker giải nén Draco / KTX2 lỗi (vd. bị CSP chặn) thì promise không bao giờ xong → hết giờ coi như lỗi
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Hết thời gian tải / giải nén: ${url}`)), LOAD_TIMEOUT);
    });
    try {
        const gltf = await Promise.race([gltfLoader.loadAsync(url, (e) => {
            // e.loaded đếm byte đã giải nén → so được với dung lượng file gốc
            file.loaded = e.loaded;
            file.total = e.lengthComputable ? e.total : knownSizes[url] ?? 0;
            emit();
        }), timeout]);
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) throw new Error(`GLB không có scene: ${url}`);
        if (liteMaterials) applyLiteMaterials(root);
        return root;
    } catch (err) {
        file.failed = true;
        throw err;
    } finally {
        clearTimeout(timer);
        file.done = true; // lỗi cũng tính là xong để thanh loading không bị treo
        emit();
    }
}
