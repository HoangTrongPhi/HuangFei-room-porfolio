// ui/skillTree.js
// Cây kỹ năng kiểu game: mỗi nhánh là một cột node lục giác nối bằng dây, mở dần từ trên xuống.
// play() cho dây "chạy điện" và các node sáng lên lần lượt.
import gsap from "gsap";
import { h } from "./dom.js";

/**
 * @param {Array<{branch:string, color:string, nodes:Array<{label:string, level:number, max:number, note?:string}>}>} tree
 * @returns {{ el: Element, points: number, play: (instant?: boolean) => void }}
 */
export function createSkillTree(tree) {
    const points = tree.reduce((sum, b) => sum + b.nodes.reduce((s, n) => s + n.level, 0), 0);

    const branches = tree.map((b) =>
        h("div", { class: "tree-branch", style: `--branch: ${b.color}` },
            h("span", { class: "tree-branch-name" }, b.branch),
            h("ol", { class: "tree-nodes" }, b.nodes.map((n) => {
                const state = n.level >= n.max ? "max" : n.level > 0 ? "on" : "locked";
                return h("li", {
                    class: `tree-node tree-node--${state}`,
                    tabindex: "0",
                    "aria-label": `${n.label}: level ${n.level} of ${n.max}${n.note ? ` — ${n.note}` : ""}`,
                },
                    h("span", { class: "tree-hex", "aria-hidden": "true" }, state === "max" ? "★" : n.level),
                    h("span", { class: "tree-label" }, n.label),
                    h("span", { class: "tree-pips", "aria-hidden": "true" },
                        Array.from({ length: n.max }, (_, i) => h("i", { class: i < n.level ? "is-on" : null }))),
                    n.note && h("span", { class: "tree-tip", role: "tooltip" }, n.note),
                );
            })),
        ));

    const el = h("div", { class: "tree" }, branches);
    const nodes = el.querySelectorAll(".tree-node");
    const links = el.querySelectorAll(".tree-nodes");

    return {
        el,
        points,
        play(instant = false) {
            gsap.killTweensOf([nodes, links]);
            if (instant) {
                gsap.set(nodes, { opacity: 1, scale: 1 });
                gsap.set(links, { "--link": 1 });
                return;
            }
            gsap.fromTo(links, { "--link": 0 }, { "--link": 1, duration: 1.2, delay: 0.7, ease: "power2.inOut" });
            // Node sáng theo hàng: hàng trên của mọi nhánh trước, rồi xuống dần
            gsap.fromTo(nodes, { opacity: 0, scale: 0.6 }, {
                opacity: 1,
                scale: 1,
                duration: 0.35,
                ease: "back.out(2.5)",
                delay: 0.7,
                stagger: (i, target) => [...target.parentNode.children].indexOf(target) * 0.22 + [...links].indexOf(target.parentNode) * 0.06,
            });
        },
    };
}
