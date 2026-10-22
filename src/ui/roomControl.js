// ui/roomControl.js
// Bảng điều khiển căn phòng (góc phải trên): màu LED, độ sáng phòng, độ phát sáng (bloom),
// Party mode, bật/tắt hạt sáng (mặc định tắt).
// Ghi vào roomFx (LED/hạt sáng đọc mỗi frame) và chỉnh trực tiếp renderer/bloom.
import * as THREE from "three";
import gsap from "gsap";
import { h } from "./dom.js";
import { roomFx } from "../core/roomFx.js";
import { track } from "../core/analytics.js";
import { toast } from "./toast.js";

const SWATCHES = [
    { id: "rainbow", label: "Rainbow", color: null },
    { id: "cyan", label: "Cyan", color: "#66e0ff" },
    { id: "pink", label: "Pink", color: "#ff6bd6" },
    { id: "purple", label: "Purple", color: "#a07bff" },
    { id: "green", label: "Green", color: "#7cf0c5" },
    { id: "amber", label: "Amber", color: "#ffd166" },
];
const COLLAPSE_KEY = "room-control-collapsed";

/**
 * @param {object} opt
 * @param {THREE.WebGLRenderer} opt.renderer
 * @param {{pass: {strength:number}} | null} opt.bloom
 * @param {{setEnabled: (on: boolean) => void}} opt.particles
 */
export function createRoomControl({ renderer, bloom, particles }) {
    const baseExposure = renderer.toneMappingExposure;
    const baseBloom = bloom?.pass.strength ?? 0;

    // ----- Màu LED -----
    const custom = h("input", { type: "color", class: "rc-custom", value: "#66e0ff", "aria-label": "Custom LED color" });
    const swatches = SWATCHES.map((s) => h("button", {
        type: "button",
        class: `rc-swatch${s.color ? "" : " rc-swatch--rainbow"}`,
        style: s.color ? `--c: ${s.color}` : null,
        "aria-label": `${s.label} LED`,
        title: s.label,
        onClick: () => setColor(s.color, s.id),
    }));
    custom.addEventListener("input", () => setColor(custom.value, "custom"));

    function setColor(color, id, silent = false) {
        roomFx.ledColor = color ? new THREE.Color(color) : null;
        swatches.forEach((el, i) => el.classList.toggle("is-active", SWATCHES[i].id === id));
        custom.classList.toggle("is-active", id === "custom");
        if (!silent) track("click", `fx-led-${id}`);
    }

    // ----- Thanh trượt -----
    const slider = (label, min, max, value, onInput) => {
        const out = h("output", {}, `${value}%`);
        const input = h("input", { type: "range", min, max, step: 5, value, "aria-label": label });
        input.addEventListener("input", () => {
            out.textContent = `${input.value}%`;
            onInput(Number(input.value) / 100);
        });
        return { el: h("label", { class: "rc-slider" }, h("span", {}, label, out), input), input, out };
    };
    const brightness = slider("Brightness", 50, 150, 100, (v) => { renderer.toneMappingExposure = baseExposure * v; });
    const glow = slider("Glow", 0, 200, 100, (v) => { if (bloom) bloom.pass.strength = baseBloom * v; });

    // ----- Công tắc bật/tắt -----
    const toggle = (label, onChange) => {
        const btn = h("button", { type: "button", class: "rc-toggle", role: "switch", "aria-checked": "false" },
            h("span", { class: "rc-toggle-track", "aria-hidden": "true" }, h("i")),
            label,
        );
        btn.addEventListener("click", () => {
            const on = btn.getAttribute("aria-checked") !== "true";
            btn.setAttribute("aria-checked", String(on));
            btn.classList.toggle("is-on", on);
            onChange(on);
        });
        return btn;
    };
    const party = toggle("Party mode", (on) => {
        roomFx.party = on;
        document.body.classList.toggle("party", on);
        toast(on ? "Party mode on 🎉" : "Party mode off");
        track("click", `fx-party-${on ? "on" : "off"}`);
    });
    const sparkles = toggle("Sparkles", (on) => {
        particles.setEnabled(on);
        track("click", `fx-sparkles-${on ? "on" : "off"}`);
    });

    const reset = h("button", { type: "button", class: "rc-reset", onClick: resetAll }, "Reset");
    function resetAll() {
        setColor(null, "rainbow");
        [brightness, glow].forEach((s) => { s.input.value = 100; s.out.textContent = "100%"; });
        renderer.toneMappingExposure = baseExposure;
        if (bloom) bloom.pass.strength = baseBloom;
        if (roomFx.party) party.click();
        if (sparkles.getAttribute("aria-checked") === "true") sparkles.click();
    }

    // ----- Khung + thu gọn -----
    const content = h("div", { class: "rc-body", id: "rc-body" },
        h("div", { class: "rc-row" }, h("span", { class: "rc-label" }, "LED"), h("div", { class: "rc-swatches" }, swatches, custom)),
        brightness.el,
        glow.el,
        h("div", { class: "rc-row rc-toggles" }, party, sparkles),
        h("div", { class: "rc-row rc-row--end" }, reset),
    );
    const collapse = h("button", { type: "button", class: "rc-collapse", "aria-expanded": "true", "aria-controls": "rc-body", "aria-label": "Collapse room control" }, "▾");
    const panel = h("aside", { class: "room-control", "aria-label": "Room control" },
        h("div", { class: "rc-head" }, h("span", {}, "// room control"), collapse),
        content,
    );
    collapse.addEventListener("click", () => setCollapsed(!panel.classList.contains("is-collapsed")));

    function setCollapsed(value) {
        panel.classList.toggle("is-collapsed", value);
        collapse.setAttribute("aria-expanded", String(!value));
        try { localStorage.setItem(COLLAPSE_KEY, value ? "1" : ""); } catch { /* bỏ qua */ }
    }
    let startCollapsed = window.innerHeight < 720; // màn thấp: thu gọn để không đè dock menu
    try { if (localStorage.getItem(COLLAPSE_KEY) !== null) startCollapsed = !!localStorage.getItem(COLLAPSE_KEY); } catch { /* bỏ qua */ }
    setCollapsed(startCollapsed);
    setColor(null, "rainbow", true);

    document.body.append(panel);

    return {
        show() {
            gsap.from(panel, { x: 30, opacity: 0, duration: 0.6, ease: "power3.out", clearProps: "transform,opacity" });
        },
    };
}
