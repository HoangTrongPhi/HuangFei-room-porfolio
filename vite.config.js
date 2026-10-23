// vite.config.js
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = import.meta.dirname;

// Dung lượng từng file GLB (byte) → màn loading tính % đúng kể cả khi server nén Brotli
// (Vercel nén .glb nên response không có Content-Length → trình duyệt không biết tổng dung lượng)
const modelSizes = Object.fromEntries(
    readdirSync(resolve(root, "public/models"))
        .filter((f) => f.endsWith(".glb"))
        .map((f) => [`/models/${f}`, statSync(resolve(root, "public/models", f)).size]),
);

// Header áp cho mọi trang trên Vercel (CSP...) → dùng lại cho `npm run preview` để thấy lỗi CSP ngay ở máy
const vercelHeaders = Object.fromEntries(
    JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"))
        .headers.find((rule) => rule.source === "/(.*)")
        .headers.map(({ key, value }) => [key, value]),
);
delete vercelHeaders["Strict-Transport-Security"]; // preview chạy http://localhost

export default {
    define: {
        __MODEL_SIZES__: JSON.stringify(modelSizes),
    },
    server: {
        headers: {
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin"
        }
    },
    preview: {
        headers: vercelHeaders,
    },
    build: {
        rollupOptions: {
            // 2 trang: portfolio 3D (index.html) và dashboard admin (admin.html)
            input: {
                main: resolve(root, "index.html"),
                admin: resolve(root, "admin.html"),
            },
        },
    },
}
