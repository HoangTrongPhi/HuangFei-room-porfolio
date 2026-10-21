// ui/isoRoom.js
// Bản vẽ nét isometric của căn phòng cho màn hình loading.
// Các nét "structure" được vẽ dần theo tiến trình tải; "screen" và "accent" (LED) sáng lên khi tải xong.

const NS = "http://www.w3.org/2000/svg";
const U = 10; // 1 đơn vị phòng = 10px trong viewBox

// Toạ độ phòng (x sang phải-xuống, y sang trái-xuống, z lên trên) → toạ độ SVG
const iso = ([x, y, z]) => [((x - y) * 0.866 * U).toFixed(1), ((x + y) * 0.5 * U - z * U).toFixed(1)];
const line = (pts, close = false) => `M${pts.map((p) => iso(p).join(" ")).join(" L")}${close ? " Z" : ""}`;
const quadX = (x, y0, y1, z0, z1) => line([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], true); // mặt phẳng x = const
const quadY = (y, x0, x1, z0, z1) => line([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], true); // mặt phẳng y = const

// Thứ tự trong mảng = thứ tự được vẽ
const STRUCTURE = [
    line([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], true),                 // sàn
    line([[10, 0, 0], [10, 0, -1.2], [10, 10, -1.2], [0, 10, -1.2], [0, 10, 0]]),  // bệ
    line([[10, 10, 0], [10, 10, -1.2]]),
    line([[0, 10, 0], [0, 10, 9], [0, 0, 9], [0, 0, 0]]),                          // tường trái
    line([[10, 0, 0], [10, 0, 9], [0, 0, 9]]),                                     // tường phải
    line([[0, 1.2, 3.2], [3, 1.2, 3.2], [3, 8.8, 3.2], [0, 8.8, 3.2]]),            // mặt bàn
    line([[3, 1.2, 3.2], [3, 1.2, 2.9], [3, 8.8, 2.9], [3, 8.8, 3.2]]),
    line([[3, 7.2, 2.9], [3, 7.2, 0], [3, 8.8, 0], [3, 8.8, 2.9]]),                // tủ ngăn kéo
    line([[3, 7.2, 1.5], [3, 8.8, 1.5]]),
    line([[3, 1.6, 2.9], [3, 1.6, 0]]),                                            // chân bàn
    line([[2.6, 1.4, 3.2], [2.6, 2.8, 3.2], [2.6, 2.8, 6.4], [2.6, 1.4, 6.4]], true), // case PC
    line([[2.6, 1.4, 6.4], [0.4, 1.4, 6.4], [0.4, 2.8, 6.4], [2.6, 2.8, 6.4]]),
    line([[2.6, 2.8, 3.2], [0.4, 2.8, 3.2], [0.4, 2.8, 6.4]]),
    quadX(0.5, 3.1, 4.7, 4, 6.1),                                                 // 3 màn hình
    quadX(0.5, 4.9, 6.5, 4, 6.1),
    quadX(0.5, 6.7, 8.3, 4, 6.1),
    line([[0.5, 5.7, 4], [0.9, 5.7, 3.2]]),                                        // chân màn hình
    line([[2.2, 4.2, 3.2], [2.2, 6.6, 3.2]]),                                      // bàn phím
    line([[6.6, 4, 2.4], [4.6, 4, 2.4], [4.6, 6, 2.4], [6.6, 6, 2.4]], true),      // ghế
    quadX(6.6, 4, 6, 2.4, 6.2),
    line([[5.6, 5, 2.4], [5.6, 5, 0.5], [4.6, 5, 0], [5.6, 5, 0.5], [6.6, 5, 0], [5.6, 5, 0.5], [5.6, 4, 0], [5.6, 5, 0.5], [5.6, 6, 0]]),
    line([[4.6, 0, 6], [4.6, 1.4, 6], [9.2, 1.4, 6], [9.2, 0, 6]]),                // kệ tường phải
    line([[4.6, 0, 7.6], [4.6, 1.4, 7.6], [9.2, 1.4, 7.6], [9.2, 0, 7.6]]),
    quadY(0, 1.2, 3.6, 4.6, 8.2),                                                 // poster
    line([[8.2, 1.2, 0], [9.4, 1.2, 0], [9.4, 1.2, 1.2], [8.2, 1.2, 1.2]], true),  // robot hút bụi
];

const SCREENS = [quadX(0.5, 3.1, 4.7, 4, 6.1), quadX(0.5, 4.9, 6.5, 4, 6.1), quadX(0.5, 6.7, 8.3, 4, 6.1)];

const ACCENTS = [
    { d: line([[0.1, 10, 0.15], [0.1, 0.1, 0.15], [10, 0.1, 0.15]]), color: "#ff6bd6" },   // LED chân tường
    { d: line([[0, 10, 9], [0, 0, 9], [10, 0, 9]]), color: "#66e0ff" },                    // LED trần
    { d: line([[2.6, 1.6, 3.6], [2.6, 2.6, 6.1]]), color: "#a07bff" },                     // RGB trong case
    // Đèn tam giác trên tường trái
    { d: line([[0, 3.4, 7], [0, 4.4, 7], [0, 3.9, 7.9]], true), color: "#7cf0c5" },
    { d: line([[0, 4.4, 7], [0, 3.9, 7.9], [0, 4.9, 7.9]], true), color: "#ffd166" },
    { d: line([[0, 4.9, 7.9], [0, 4.4, 8.8], [0, 3.9, 7.9]], true), color: "#ff6bd6" },
    // Logo mạng xã hội trên kệ
    ...["#ff4d4d", "#4d7dff", "#4dd6ff", "#e6e6e6"].map((color, i) => ({
        d: quadY(0.05, 5.2 + i * 1, 5.9 + i * 1, 7.8, 8.5), color,
    })),
];

/** @returns {{ el: SVGSVGElement, setProgress: (p:number) => void, lightUp: () => void }} */
export function createIsoRoom() {
    const path = (d, cls, extra = {}) => {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("class", cls);
        p.setAttribute("pathLength", "1");
        Object.entries(extra).forEach(([k, v]) => p.style.setProperty(k, v));
        return p;
    };

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "-100 -102 200 216");
    svg.setAttribute("class", "iso-room");
    svg.setAttribute("aria-hidden", "true");

    const screens = SCREENS.map((d) => path(d, "iso-screen"));
    const structure = STRUCTURE.map((d) => path(d, "iso-line"));
    const accents = ACCENTS.map(({ d, color }) => path(d, "iso-accent", { "--c": color }));
    svg.append(...screens, ...structure, ...accents);

    return {
        el: svg,
        // Mỗi nét được vẽ nối tiếp nhau theo tiến trình 0 → 1
        setProgress(p) {
            const n = structure.length;
            structure.forEach((el, i) => {
                const f = Math.min(1, Math.max(0, p * n - i));
                el.style.strokeDashoffset = String(1 - f);
            });
        },
        lightUp() {
            svg.classList.add("is-lit");
        },
    };
}
