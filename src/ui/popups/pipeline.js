// ui/popups/pipeline.js
// Popup PIPELINE: bản đồ kỹ năng kiểu game RPG đặt trên pipeline làm game (bấm chồng sách trong phòng).
//   - Trục ngang = giai đoạn pipeline (Pre-prod → Ship → Lead → Direct), trục dọc = làn Art / Tech Art / Code
//   - 3 cỡ node: role (vị trí công việc, lớn) · skill (vừa) · perk (kỹ năng phụ, nhỏ)
//   - Dây giữa các node đã mở khoá luôn phát sáng mờ; rê / bấm một node → đường từ gốc tới node sáng rực
//   - Kéo để di chuyển, cuộn chuột / nút +− để zoom, "Fit" xem toàn bộ, "◎" quay về vị trí hiện tại
import gsap from "gsap";
import { h, prefersReducedMotion } from "../dom.js";
import { createPopup } from "../popup.js";
import { track } from "../../core/analytics.js";

const SVG_NS = "http://www.w3.org/2000/svg";
// Toạ độ pixel trong "bản đồ" (trước khi zoom)
const W = 2000;
const H = 1240;
const colX = (col) => 120 + col * 220;
const rowY = (row) => 150 + row * 92;
const LANE_BANDS = [["art", -0.7, 3.6], ["tech", 3.6, 6.55], ["code", 6.55, 11.65]];
const LEAD_FROM_COL = 6.6;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 1.6;
const TYPE_LABEL = { role: "Role", skill: "Skill", perk: "Perk" };

/**
 * @param {typeof import("../../content.js").PIPELINE} data
 */
export function createPipelinePopup(data) {
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    const stateOf = (n) => (n.level <= 0 ? "locked" : n.level >= n.max ? "max" : "on");
    const laneColor = (lane) => data.lanes[lane]?.color ?? "#66e0ff";
    const points = data.nodes.reduce((sum, n) => sum + (n.type === "role" ? 0 : n.level), 0);
    const roles = data.nodes.filter((n) => n.type === "role" && n.id !== "core");

    // ===== Dây nối: lớp phát sáng + dây chính + tia sáng chạy (chỉ hiện khi nằm trên đường đang chọn) =====
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "pl-links");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("aria-hidden", "true");

    const edges = []; // { el, from, to }
    data.nodes.forEach((n) => (n.from ?? []).forEach((pid) => {
        const p = byId.get(pid);
        if (!p) return;
        const [x1, y1, x2, y2] = [colX(p.col), rowY(p.row), colX(n.col), rowY(n.row)];
        const mx = (x1 + x2) / 2;
        const d = y1 === y2 || x1 === x2 ? `M${x1} ${y1}L${x2} ${y2}` : `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
        const cross = p.id !== "core" && p.lane !== n.lane && p.lane !== "lead" && n.lane !== "lead";
        const on = p.level > 0 && n.level > 0;
        const g = document.createElementNS(SVG_NS, "g");
        g.setAttribute("class", `pl-link ${on ? "is-on" : "is-locked"}${cross ? " is-cross" : ""}`);
        // Dây giao thoa: chuyển màu từ làn này sang làn kia
        const color = laneColor(n.lane);
        g.style.setProperty("--c", color);
        ["pl-link-glow", "pl-link-wire", "pl-link-spark"].forEach((cls) => {
            const path = document.createElementNS(SVG_NS, "path");
            path.setAttribute("d", d);
            path.setAttribute("class", cls);
            g.append(path);
        });
        svg.append(g);
        edges.push({ el: g, from: pid, to: n.id, col: p.col });
    }));

    // ===== Node =====
    const nodeEls = new Map();
    data.nodes.forEach((n) => {
        const state = stateOf(n);
        const type = n.id === "core" ? "core" : n.type ?? "skill";
        const el = h("button", {
            type: "button",
            class: `pl-node pl-node--${type} pl-node--${state}${n.current ? " is-current" : ""}${n.goal ? " is-goal" : ""}`,
            style: `left: ${colX(n.col)}px; top: ${rowY(n.row)}px; --c: ${laneColor(n.lane)}; --p: ${n.max ? n.level / n.max : 0}`,
            "aria-label": `${n.label} (${TYPE_LABEL[n.type] ?? "Origin"}): ${state === "locked" ? "locked" : `level ${n.level} of ${n.max}`}`,
            onPointerenter: () => select(n.id),
            onFocus: () => select(n.id),
            onClick: () => { select(n.id); track("click", `pipeline-${n.id}`); },
        },
            h("span", { class: "pl-node-icon", "aria-hidden": "true" }, n.icon ?? n.label[0]),
            h("span", { class: "pl-node-name", "aria-hidden": "true" }, n.label),
            n.current && h("span", { class: "pl-flag pl-flag--here", "aria-hidden": "true" }, "▼ You are here"),
            n.goal && h("span", { class: "pl-flag pl-flag--goal", "aria-hidden": "true" }, "Next goal"),
        );
        nodeEls.set(n.id, el);
    });

    // ===== Làn nền, cột Lead & Production, thanh giai đoạn =====
    const bands = LANE_BANDS.map(([lane, from, to]) =>
        h("div", { class: `pl-lane pl-lane--${lane}`, style: `top: ${rowY(from)}px; height: ${rowY(to) - rowY(from)}px; --c: ${laneColor(lane)}` },
            h("span", {}, data.lanes[lane]?.label)));
    const leadX = colX(LEAD_FROM_COL);
    const leadBand = h("div", {
        class: "pl-leadband",
        style: `left: ${leadX}px; width: ${W - leadX - 16}px; top: ${rowY(-0.7)}px; height: ${rowY(11.65) - rowY(-0.7)}px; --c: ${laneColor("lead")}`,
    }, h("span", {}, data.lanes.lead?.label));

    const [focusFrom, focusTo] = data.focus ?? [0, -1];
    const stages = data.stages.map((label, i) => h("span", {
        class: `pl-stage${i + 1 >= focusFrom && i + 1 <= focusTo ? " is-focus" : ""}`,
        style: `left: ${colX(i + 1)}px`,
    }, h("b", {}, String(i + 1).padStart(2, "0")), label));
    const focusBar = focusTo >= focusFrom && h("span", {
        class: "pl-focus",
        style: `left: ${colX(focusFrom) - 90}px; width: ${colX(focusTo) - colX(focusFrom) + 180}px`,
    }, h("span", {}, "▼ my zone"));

    const world = h("div", { class: "pl-world", style: `width: ${W}px; height: ${H}px` },
        bands, leadBand, stages, focusBar, svg, [...nodeEls.values()]);

    // ===== Khung nhìn: kéo để di chuyển, cuộn để zoom =====
    const zoomLabel = h("output", { class: "pl-zoom-value" }, "100%");
    const ctrl = (label, title, fn) => h("button", { type: "button", class: "pl-ctrl", title, "aria-label": title, onClick: fn }, label);
    const controls = h("div", { class: "pl-controls" },
        ctrl("−", "Zoom out", () => zoomBy(1 / 1.25)),
        zoomLabel,
        ctrl("+", "Zoom in", () => zoomBy(1.25)),
        ctrl("Fit", "Show the whole map", () => fit(true)),
        ctrl("◎", "Go to my position", () => focusCurrent(true)),
    );
    const viewport = h("div", { class: "pl-view" }, world, controls);

    const view = { x: 0, y: 0, s: 0.8 };
    const apply = () => {
        world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`;
        zoomLabel.textContent = `${Math.round(view.s * 100)}%`;
    };
    // Giữ bản đồ không trôi hẳn ra khỏi khung (nhỏ hơn khung thì canh giữa)
    function clampView(v = view) {
        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;
        const w = W * v.s;
        const hh = H * v.s;
        v.x = w <= vw ? (vw - w) / 2 : Math.min(40, Math.max(vw - w - 40, v.x));
        v.y = hh <= vh ? (vh - hh) / 2 : Math.min(40, Math.max(vh - hh - 40, v.y));
        return v;
    }
    function animateTo(target, animate) {
        clampView(target);
        gsap.killTweensOf(view);
        if (!animate || prefersReducedMotion()) {
            Object.assign(view, target);
            return apply();
        }
        gsap.to(view, { ...target, duration: 0.6, ease: "power3.inOut", onUpdate: apply });
    }
    function zoomAt(px, py, s, animate = false) {
        s = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s));
        const k = s / view.s;
        animateTo({ x: px - (px - view.x) * k, y: py - (py - view.y) * k, s }, animate);
    }
    const zoomBy = (k) => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, view.s * k, true);
    function fit(animate) {
        const s = Math.max(ZOOM_MIN, Math.min(viewport.clientWidth / W, viewport.clientHeight / H) * 0.98);
        animateTo({ x: 0, y: 0, s }, animate);
    }
    function centerOn(n, s, animate) {
        animateTo({ x: viewport.clientWidth / 2 - colX(n.col) * s, y: viewport.clientHeight / 2 - rowY(n.row) * s, s }, animate);
    }
    const current = data.nodes.find((n) => n.current) ?? data.nodes[0];
    const focusCurrent = (animate) => centerOn(current, Math.max(view.s, 0.85), animate);

    let pan = null;
    viewport.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 || e.target.closest(".pl-node, .pl-controls")) return;
        gsap.killTweensOf(view);
        pan = { id: e.pointerId, x: e.clientX - view.x, y: e.clientY - view.y };
        viewport.setPointerCapture(e.pointerId);
        viewport.classList.add("is-panning");
    });
    viewport.addEventListener("pointermove", (e) => {
        if (!pan || e.pointerId !== pan.id) return;
        view.x = e.clientX - pan.x;
        view.y = e.clientY - pan.y;
        clampView();
        apply();
    });
    const endPan = () => { pan = null; viewport.classList.remove("is-panning"); };
    viewport.addEventListener("pointerup", endPan);
    viewport.addEventListener("pointercancel", endPan);
    viewport.addEventListener("wheel", (e) => {
        e.preventDefault();
        const r = viewport.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, view.s * Math.exp(-e.deltaY * 0.0015));
    }, { passive: false });
    window.addEventListener("resize", () => { if (viewport.isConnected && viewport.clientWidth) { clampView(); apply(); } });

    // ===== Bảng chi tiết + tuỳ chọn =====
    const inspector = h("div", { class: "pl-inspector", "aria-live": "polite" });
    const namesToggle = h("input", { type: "checkbox", checked: true });
    namesToggle.addEventListener("change", () => world.classList.toggle("hide-names", !namesToggle.checked));
    const unlockedRoles = roles.filter((n) => n.level > 0).length;

    const body = h("div", { class: "pipeline" },
        h("p", { class: "pl-intro", "data-stagger": true }, `> ${data.intro}`),
        h("div", { "data-stagger": true }, viewport),
        h("div", { class: "pl-footer", "data-stagger": true },
            h("div", { class: "pl-options" },
                h("div", { class: "pl-score" },
                    h("span", { class: "pl-points" }, h("b", {}, String(points)), "skill points"),
                    h("span", { class: "pl-points pl-points--roles" }, h("b", {}, `${unlockedRoles}/${roles.length}`), "roles"),
                ),
                h("label", { class: "pl-check" }, namesToggle, "Show node names"),
                h("span", { class: "pl-legend" },
                    h("i", { class: "pl-dot pl-dot--role" }), "Role",
                    h("i", { class: "pl-dot pl-dot--skill" }), "Skill",
                    h("i", { class: "pl-dot pl-dot--perk" }), "Perk"),
                h("span", { class: "pl-legend" },
                    h("i", { class: "pl-dot is-max" }), "Mastered",
                    h("i", { class: "pl-dot is-on" }), "Learned",
                    h("i", { class: "pl-dot is-locked" }), "Locked",
                    h("i", { class: "pl-dash" }), "Crossover"),
            ),
            inspector,
        ),
    );

    // Đường đi từ gốc tới node (mọi node đi trước)
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
        world.classList.add("has-path");

        const state = stateOf(n);
        const unlocks = data.nodes.filter((m) => m.from?.includes(id)).map((m) => m.label);
        const stage = n.col > 0 ? data.stages[Math.round(n.col) - 1] : "Origin";
        const badge = n.current ? "Current role" : n.goal ? "Next goal" : state === "max" ? "Mastered" : state === "locked" ? "Locked" : `Lv ${n.level} / ${n.max}`;
        inspector.replaceChildren(
            h("span", { class: `pl-inspector-icon pl-node--${state}`, style: `--c: ${laneColor(n.lane)}`, "aria-hidden": "true" }, n.icon ?? n.label[0]),
            h("div", { class: "pl-inspector-text" },
                h("p", { class: "pl-inspector-head" },
                    h("strong", {}, n.label),
                    h("span", { class: "muted" }, `${TYPE_LABEL[n.type] ?? "Origin"} · ${data.lanes[n.lane]?.label} · ${stage}`),
                    h("span", { class: `pl-badge pl-badge--${n.current || n.goal ? "here" : state}` }, badge),
                ),
                n.note && h("p", { class: "pl-inspector-note" }, n.note),
                h("p", { class: "pl-inspector-meta" },
                    (n.tools ?? []).map((t) => h("span", { class: "tag" }, t)),
                    unlocks.length > 0 && h("span", { class: "muted" }, `→ leads to ${unlocks.join(", ")}`),
                ),
            ),
        );
    }

    function play() {
        // Đo khung nhìn sau khi popup đã hiện; mở ra ở vị trí hiện tại
        requestAnimationFrame(() => {
            Object.assign(view, { s: 0.85 });
            centerOn(current, 0.85, false);
        });
        if (prefersReducedMotion()) return;
        const nodes = [...nodeEls.values()];
        gsap.fromTo(edges.map((e) => e.el), { opacity: 0 }, {
            opacity: 1, duration: 0.5, overwrite: true, clearProps: "opacity",
            delay: (i) => 0.35 + edges[i].col * 0.1,
        });
        gsap.fromTo(nodes, { scale: 0.3, opacity: 0 }, {
            scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.2)", overwrite: true, clearProps: "transform,opacity",
            delay: (i) => 0.3 + data.nodes[i].col * 0.1 + data.nodes[i].row * 0.015,
        });
    }

    select(current.id);

    return createPopup("pipeline", {
        title: "Skill tree — game dev pipeline",
        anim: "window",
        className: "popup-panel--pipeline",
        body,
        onOpen: play,
    });
}
