// ui/statRadar.js
// Bảng chỉ số hình lục giác kiểu game (radar chart) bằng SVG: lưới lục giác, vùng chỉ số phát sáng neon,
// nhãn + số ở mỗi đỉnh. play() cho vùng chỉ số "bung" từ tâm ra và số đếm lên.
import gsap from "gsap";

const NS = "http://www.w3.org/2000/svg";
const R = 70; // bán kính lục giác ngoài cùng (đơn vị viewBox)

const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
};

/**
 * @param {Array<{label:string, value:number}>} stats - 0 → 100, thứ tự theo chiều kim đồng hồ từ đỉnh trên
 * @returns {{ el: Element, play: (instant?: boolean) => void }}
 */
export function createStatRadar(stats) {
    const n = stats.length;
    // Góc mỗi trục: bắt đầu từ đỉnh trên (-90°), đi theo chiều kim đồng hồ
    const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const point = (i, r) => [Math.cos(angle(i)) * r, Math.sin(angle(i)) * r];
    const ring = (r) => stats.map((_, i) => point(i, r).map((v) => v.toFixed(1)).join(",")).join(" ");

    const svg = svgEl("svg", { viewBox: "-128 -104 256 212", class: "radar", role: "img" });
    const title = svgEl("title");
    title.textContent = `Skill stats: ${stats.map((s) => `${s.label} ${s.value}`).join(", ")}`;
    svg.append(title);

    const defs = svgEl("defs");
    const grad = svgEl("linearGradient", { id: "radar-fill", x1: "0", y1: "0", x2: "1", y2: "1" });
    grad.append(svgEl("stop", { offset: "0%", "stop-color": "#66e0ff", "stop-opacity": "0.55" }));
    grad.append(svgEl("stop", { offset: "100%", "stop-color": "#a07bff", "stop-opacity": "0.45" }));
    defs.append(grad);
    svg.append(defs);

    // Lưới: 4 vòng lục giác + các trục
    [0.25, 0.5, 0.75, 1].forEach((k) => svg.append(svgEl("polygon", { points: ring(R * k), class: k === 1 ? "radar-ring radar-ring--outer" : "radar-ring" })));
    stats.forEach((_, i) => {
        const [x, y] = point(i, R);
        svg.append(svgEl("line", { x1: 0, y1: 0, x2: x.toFixed(1), y2: y.toFixed(1), class: "radar-axis" }));
    });

    // Vùng chỉ số + chấm đỉnh
    const area = svgEl("polygon", { class: "radar-area", points: ring(0) });
    svg.append(area);
    const dots = stats.map(() => {
        const c = svgEl("circle", { r: 3, class: "radar-dot" });
        svg.append(c);
        return c;
    });

    // Nhãn + số ở ngoài mỗi đỉnh; căn trái/phải tuỳ phía để không tràn
    const numbers = stats.map((s, i) => {
        const [x, y] = point(i, R + 14);
        const anchor = Math.abs(x) < 4 ? "middle" : x > 0 ? "start" : "end";
        const g = svgEl("g", { class: "radar-label" });
        const name = svgEl("text", { x: x.toFixed(1), y: (y - 3).toFixed(1), "text-anchor": anchor, class: "radar-name" });
        name.textContent = s.label;
        const num = svgEl("text", { x: x.toFixed(1), y: (y + 9).toFixed(1), "text-anchor": anchor, class: "radar-value" });
        num.textContent = "0";
        g.append(name, num);
        svg.append(g);
        // Rê chuột vào nhãn → chấm đỉnh tương ứng sáng lên
        g.addEventListener("pointerenter", () => dots[i].classList.add("is-active"));
        g.addEventListener("pointerleave", () => dots[i].classList.remove("is-active"));
        return num;
    });

    function draw(p) {
        const pts = stats.map((s, i) => point(i, (R * s.value * p) / 100));
        area.setAttribute("points", pts.map((v) => v.map((n2) => n2.toFixed(1)).join(",")).join(" "));
        pts.forEach(([x, y], i) => {
            dots[i].setAttribute("cx", x.toFixed(1));
            dots[i].setAttribute("cy", y.toFixed(1));
            numbers[i].textContent = String(Math.round(stats[i].value * Math.min(p, 1))); // số không vượt quá giá trị thật khi hình nảy quá đà
        });
    }
    draw(0);

    const state = { p: 0 };
    return {
        el: svg,
        play(instant = false) {
            gsap.killTweensOf(state);
            state.p = 0;
            gsap.to(state, { p: 1, duration: instant ? 0 : 1.1, delay: instant ? 0 : 0.5, ease: "elastic.out(1, 0.6)", onUpdate: () => draw(state.p) });
        },
    };
}
