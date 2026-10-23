// ui/popups/pipeline.js
// Popup PIPELINE: cây kỹ năng kiểu game RPG đặt trên pipeline làm game (bấm chồng sách trong phòng).
//   - Trục ngang = các giai đoạn pipeline (Pre-prod → Ship), trục dọc = 3 làn Art / Tech Art / Code
//   - Node gốc bên trái toả ra hai con đường Art và Code; dây nét đứt = nhánh giao thoa giữa hai làn
//   - Cuối mỗi làn là một "class" (nghề); class hiện tại có huy hiệu YOU ARE HERE
//   - Rê / bấm node: sáng đường đi từ gốc tới node + bảng chi tiết bên dưới
import gsap from "gsap";
import { h, prefersReducedMotion } from "../dom.js";
import { createPopup } from "../popup.js";
import { track } from "../../core/analytics.js";

const SVG_NS = "http://www.w3.org/2000/svg";
// Toạ độ % trong khung đồ thị: cột 0 → 6 cho node, class card ở mép phải
const colX = (col) => 5 + col * 12.5;
const rowY = (row) => 10 + row * 20;
const CLASS_X = 87;

/**
 * @param {typeof import("../../content.js").PIPELINE} data
 */
export function createPipelinePopup(data) {
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    const stateOf = (n) => (n.level <= 0 ? "locked" : n.level >= n.max ? "max" : "on");
    const laneColor = (lane) => data.lanes[lane]?.color ?? "#66e0ff";
    const points = data.nodes.reduce((sum, n) => sum + (n.id === "core" ? 0 : n.level), 0);

    // ===== Dây nối =====
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "pl-links");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");

    const edges = []; // { el, from, to, col }
    const addEdge = (x1, y1, x2, y2, cls, color, from, to, col) => {
        const mx = (x1 + x2) / 2;
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", y1 === y2 ? `M${x1} ${y1}L${x2} ${y2}` : `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`);
        path.setAttribute("class", `pl-link ${cls}`);
        path.setAttribute("vector-effect", "non-scaling-stroke");
        path.style.setProperty("--c", color);
        svg.append(path);
        edges.push({ el: path, from, to, col });
    };
    data.nodes.forEach((n) => (n.from ?? []).forEach((pid) => {
        const p = byId.get(pid);
        if (!p) return;
        const cross = p.id !== "core" && p.lane !== n.lane;
        const on = p.level > 0 && n.level > 0;
        addEdge(colX(p.col), rowY(p.row), colX(n.col), rowY(n.row),
            `${on ? "is-on" : "is-locked"}${cross ? " is-cross" : ""}`, laneColor(n.lane), pid, n.id, n.col);
    }));
    data.classes.forEach((c) => (c.from ?? []).forEach((pid) => {
        const p = byId.get(pid);
        if (p) addEdge(colX(p.col), rowY(p.row), CLASS_X, rowY(c.row), p.level > 0 ? "is-on" : "is-locked", laneColor(c.lane), pid, `class-${c.id}`, 7);
    }));

    // ===== Node =====
    const nodeEls = new Map();
    data.nodes.forEach((n) => {
        const state = stateOf(n);
        const el = h("button", {
            type: "button",
            class: `pl-node pl-node--${state}${n.id === "core" ? " pl-node--core" : ""}`,
            style: `left: ${colX(n.col)}%; top: ${rowY(n.row)}%; --c: ${laneColor(n.lane)}`,
            "aria-label": `${n.label}: ${state === "locked" ? "locked" : `level ${n.level} of ${n.max}`}`,
            onPointerenter: () => select(n.id),
            onFocus: () => select(n.id),
            onClick: () => { select(n.id, true); track("click", `pipeline-${n.id}`); },
        },
            h("span", { class: "pl-node-icon", "aria-hidden": "true" }, n.icon ?? n.label[0]),
            h("span", { class: "pl-node-name", "aria-hidden": "true" }, n.label),
        );
        nodeEls.set(n.id, el);
    });

    // ===== Class card cuối mỗi làn =====
    const classEls = data.classes.map((c) => {
        const laneNodes = data.nodes.filter((n) => n.lane === c.lane && n.id !== "core");
        const pct = Math.round((laneNodes.reduce((s, n) => s + n.level, 0) / laneNodes.reduce((s, n) => s + n.max, 0)) * 100);
        return h("div", {
            class: `pl-class${c.current ? " is-current" : ""}`,
            style: `left: ${CLASS_X}%; top: ${rowY(c.row)}%; --c: ${laneColor(c.lane)}`,
        },
            c.current && h("span", { class: "pl-here" }, "▼ You are here"),
            h("span", { class: "pl-class-lane" }, data.lanes[c.lane]?.label),
            h("strong", {}, c.title),
            h("span", { class: "pl-class-bar", "aria-hidden": "true" }, h("i", { style: `width: ${pct}%` })),
            h("span", { class: "pl-class-pct" }, `${pct}% mastered`),
            c.next && h("span", { class: "pl-class-next" }, c.next),
        );
    });

    // ===== Làn nền + nhãn làn =====
    const bands = [["art", 0, 40], ["tech", 40, 60], ["code", 60, 100]].map(([lane, top, bottom]) =>
        h("div", { class: `pl-lane pl-lane--${lane}`, style: `top: ${top}%; height: ${bottom - top}%; --c: ${laneColor(lane)}` },
            h("span", {}, data.lanes[lane]?.label)));

    // ===== Thanh giai đoạn pipeline =====
    const [focusFrom, focusTo] = data.focus ?? [0, -1];
    const stages = h("div", { class: "pl-stages", "aria-label": "Pipeline stages" },
        data.stages.map((label, i) => h("span", {
            class: `pl-stage${i + 1 >= focusFrom && i + 1 <= focusTo ? " is-focus" : ""}`,
            style: `left: ${colX(i + 1)}%`,
        }, h("b", {}, String(i + 1).padStart(2, "0")), label)),
        focusTo >= focusFrom && h("span", {
            class: "pl-focus",
            style: `left: ${colX(focusFrom) - 6}%; width: ${colX(focusTo) - colX(focusFrom) + 12}%`,
        }, h("span", {}, "▼ my zone")),
    );

    const graph = h("div", { class: "pl-graph" }, bands, svg, [...nodeEls.values()], classEls);

    // ===== Bảng chi tiết + tuỳ chọn =====
    const inspector = h("div", { class: "pl-inspector", "aria-live": "polite" });
    const namesToggle = h("input", { type: "checkbox", checked: true });
    namesToggle.addEventListener("change", () => graph.classList.toggle("hide-names", !namesToggle.checked));

    const body = h("div", { class: "pipeline" },
        h("p", { class: "pl-intro", "data-stagger": true }, `> ${data.intro}`),
        h("div", { class: "pl-scroll", "data-stagger": true }, h("div", { class: "pl-canvas" }, stages, graph)),
        h("div", { class: "pl-footer", "data-stagger": true },
            h("div", { class: "pl-options" },
                h("span", { class: "pl-points" }, h("b", {}, String(points)), "skill points"),
                h("label", { class: "pl-check" }, namesToggle, "Show node names"),
                h("span", { class: "pl-legend" },
                    h("i", { class: "is-max" }), "Mastered", h("i", { class: "is-on" }), "Learned",
                    h("i", { class: "is-locked" }), "Locked", h("i", { class: "is-cross" }), "Crossover"),
            ),
            inspector,
        ),
    );

    // Đường đi từ gốc tới node (mọi node đi trước) → sáng dây + node trên đường
    function ancestors(id, out = new Set()) {
        out.add(id);
        (byId.get(id)?.from ?? []).forEach((pid) => out.has(pid) || ancestors(pid, out));
        return out;
    }

    let selected = null;
    function select(id) {
        if (id === selected) return;
        selected = id;
        const n = byId.get(id);
        const path = ancestors(id);
        nodeEls.forEach((el, nid) => {
            el.classList.toggle("is-path", path.has(nid));
            el.classList.toggle("is-selected", nid === id);
        });
        edges.forEach((e) => e.el.classList.toggle("is-path", path.has(e.from) && path.has(e.to)));

        const state = stateOf(n);
        const unlocks = data.nodes.filter((m) => m.from?.includes(id)).map((m) => m.label);
        const stage = n.col > 0 ? data.stages[n.col - 1] : "Origin";
        inspector.replaceChildren(
            h("span", { class: `pl-node pl-node--${state} pl-inspector-icon`, style: `--c: ${laneColor(n.lane)}`, "aria-hidden": "true" },
                h("span", { class: "pl-node-icon" }, n.icon ?? n.label[0])),
            h("div", { class: "pl-inspector-text" },
                h("p", { class: "pl-inspector-head" },
                    h("strong", {}, n.label),
                    h("span", { class: "muted" }, `${data.lanes[n.lane]?.label} · ${stage}`),
                    h("span", { class: `pl-badge pl-badge--${state}` }, state === "max" ? "Mastered" : state === "locked" ? "Locked · next goal" : `Lv ${n.level} / ${n.max}`),
                ),
                n.note && h("p", { class: "pl-inspector-note" }, n.note),
                h("p", { class: "pl-inspector-meta" },
                    (n.tools ?? []).map((t) => h("span", { class: "tag" }, t)),
                    unlocks.length > 0 && h("span", { class: "muted" }, `→ unlocks ${unlocks.join(", ")}`),
                ),
            ),
        );
    }

    function play() {
        const nodes = [...nodeEls.values()];
        if (prefersReducedMotion()) return;
        // Dây và node sáng dần từ gốc sang phải theo cột pipeline
        gsap.fromTo(edges.map((e) => e.el), { opacity: 0 }, { opacity: 1, duration: 0.4, delay: (i) => 0.35 + edges[i].col * 0.12, overwrite: true, clearProps: "opacity" });
        gsap.fromTo(nodes, { scale: 0.4, opacity: 0 }, {
            scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.2)", overwrite: true, clearProps: "transform,opacity",
            delay: (i) => 0.3 + data.nodes[i].col * 0.12 + data.nodes[i].row * 0.03,
        });
        gsap.fromTo(classEls, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, delay: 1.2, stagger: 0.1, ease: "power3.out", clearProps: "transform,opacity" });
    }

    select(data.classes.find((c) => c.current)?.from?.[0] ?? "core");

    return createPopup("pipeline", {
        title: "Skill tree — game dev pipeline",
        anim: "window",
        className: "popup-panel--pipeline",
        body,
        onOpen: play,
    });
}
