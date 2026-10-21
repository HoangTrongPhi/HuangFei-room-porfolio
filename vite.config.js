// vite.config.js
import { resolve } from "node:path";

export default {
    server: {
        headers: {
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin"
        }
    },
    build: {
        rollupOptions: {
            // 2 trang: portfolio 3D (index.html) và dashboard admin (admin.html)
            input: {
                main: resolve(import.meta.dirname, "index.html"),
                admin: resolve(import.meta.dirname, "admin.html"),
            },
        },
    },
}
