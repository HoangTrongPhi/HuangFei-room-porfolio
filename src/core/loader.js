// core/loader.js
// GLTFLoader dùng chung cho mọi model. Draco decoder lấy từ /public/draco/
// (hiện chưa GLB nào nén Draco, nhưng để sẵn nếu sau này export có nén).
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const dracoLoader = new DRACOLoader().setDecoderPath("/draco/");
const gltfLoader = new GLTFLoader().setDRACOLoader(dracoLoader);

/** Load một file .glb và trả về scene gốc của nó. */
export async function loadGLB(url) {
    const gltf = await gltfLoader.loadAsync(url);
    const root = gltf.scene || gltf.scenes?.[0];
    if (!root) throw new Error(`GLB không có scene: ${url}`);
    return root;
}
