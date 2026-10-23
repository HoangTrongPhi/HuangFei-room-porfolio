// ui/popups/about.js
// Popup ABOUT: dạng cửa sổ hệ điều hành (kéo được bằng thanh tiêu đề),
// phần giới thiệu tự gõ chữ, thanh kỹ năng chạy dần, timeline kinh nghiệm,
// bảng chỉ số lục giác kiểu game (nhiều bảng chuyển bằng tab) + cây kỹ năng.
import gsap from "gsap";
import { h, openExternal, prefersReducedMotion } from "../dom.js";
import { createPopup } from "../popup.js";
import { track } from "../../core/analytics.js";
import { createStatRadar } from "../statRadar.js";
import { createSkillTree } from "../skillTree.js";

/**
 * @param {{name:string, role:string}} profile
 * @param {{bio:string, skills:Array, timeline:Array, stats?:Array<{label:string, value:number}>}} about
 * @param {string} cvUrl
 */
export function createAboutPopup(profile, about, cvUrl) {
    // Chữ cái đầu của họ và tên: "Hoàng Trọng Phi" → "HP"
    const words = profile.name.split(/\s+/).filter(Boolean);
    const initials = [words[0], words.at(-1)].filter((w, i) => w && (i === 0 || words.length > 1)).map((w) => w[0]).join("").toUpperCase();

    const bio = h("p", { class: "about-bio typing" });
    const bars = about.skills.map((s) => h("span", { class: "skill-fill", "data-level": s.level }));
    // Các bảng lục giác (stats, stats_2...) — nhiều bảng thì hiện tab để chuyển
    const statSets = [about.stats, about.stats_2].filter((s) => s?.length).map((stats, i) => ({
        name: about.statTabs?.[i] ?? `Set ${i + 1}`,
        radar: createStatRadar(stats),
        average: Math.round(stats.reduce((sum, s) => sum + s.value, 0) / stats.length),
    }));
    const ovr = h("span", { class: "about-ovr" });
    const tabs = statSets.length > 1 ? statSets.map((set, i) => h("button", {
        class: "stat-tab",
        type: "button",
        role: "tab",
        onClick: () => showStats(i),
    }, set.name)) : [];
    let activeStats = 0;
    function showStats(i, instant = prefersReducedMotion()) {
        activeStats = i;
        statSets.forEach((set, j) => { set.radar.el.style.display = j === i ? "" : "none"; });
        tabs.forEach((tab, j) => { tab.classList.toggle("is-active", j === i); tab.setAttribute("aria-selected", String(j === i)); });
        ovr.textContent = `OVR ${statSets[i].average}`;
        statSets[i].radar.play(instant);
    }
    const tree = about.skillTree?.length ? createSkillTree(about.skillTree) : null;

    const body = h("div", { class: "about" },
        h("aside", { class: "about-side", "data-stagger": true },
            createAvatar(profile, initials),
            h("h3", { class: "about-name" }, profile.name),
            h("p", { class: "about-role" }, profile.role),
            about.now && h("p", { class: "about-now" }, h("i", { "aria-hidden": "true" }), about.now),
            about.highlights?.length && h("ul", { class: "about-highlights" }, about.highlights.map((s) =>
                h("li", {}, h("strong", {}, s.value), h("span", {}, s.label)))),
            h("button", {
                class: "btn btn-primary",
                type: "button",
                onClick: () => { track("click", "cv"); openExternal(cvUrl); },
            }, "View CV ↗"),
            statSets.length && h("div", { class: "about-stats" },
                h("h4", {}, "> stats", ovr),
                tabs.length && h("div", { class: "stat-tabs", role: "tablist" }, tabs),
                statSets.map((set) => set.radar.el),
            ),
            tree && h("div", { class: "about-stats about-tree" },
                h("h4", {}, "> skill tree", h("span", { class: "about-ovr" }, `${tree.points} SP`)),
                tree.el,
            ),
        ),
        h("div", { class: "about-main" },
            h("section", { "data-stagger": true }, h("h4", {}, "> whoami"), bio),
            h("section", { "data-stagger": true },
                h("h4", {}, "> skills"),
                h("ul", { class: "skills" }, about.skills.map((s, i) =>
                    h("li", {},
                        h("span", { class: "skill-name" }, s.name),
                        h("span", { class: "skill-bar" }, bars[i]),
                        h("span", { class: "skill-value" }, `${s.level}%`),
                    ))),
            ),
            about.toolkit?.length && h("section", { "data-stagger": true },
                h("h4", {}, "> toolkit"),
                h("dl", { class: "toolkit" }, about.toolkit.flatMap((g) => [
                    h("dt", {}, g.group),
                    h("dd", {}, g.items.map((item) => h("span", { class: "tag" }, item))),
                ])),
            ),
            h("section", { "data-stagger": true },
                h("h4", {}, "> experience"),
                h("ol", { class: "timeline" }, about.timeline.map((t) =>
                    h("li", {},
                        h("span", { class: "timeline-year" }, t.year),
                        h("div", {},
                            h("strong", {}, t.title),
                            h("span", { class: "muted" }, t.place),
                            t.period && h("span", { class: "timeline-period" }, t.period),
                            t.projects?.length && h("span", { class: "timeline-projects" }, t.projects.map((p) => h("span", { class: "tag" }, p))),
                            t.points?.length && h("ul", { class: "timeline-points" }, t.points.map((p) => h("li", {}, p))),
                        ),
                    ))),
            ),
            about.education?.length && h("section", { "data-stagger": true },
                h("h4", {}, "> education"),
                h("ol", { class: "timeline timeline--edu" }, about.education.map((t) =>
                    h("li", {},
                        h("span", { class: "timeline-year" }, t.year),
                        h("div", {}, h("strong", {}, t.title), h("span", { class: "muted" }, t.place)),
                    ))),
            ),
        ),
    );

    let typing = null;

    const popup = createPopup("about", {
        title: "about_me.exe",
        anim: "window",
        className: "popup-panel--about",
        body,
        onOpen() {
            const instant = prefersReducedMotion();
            // Gõ chữ: tốc độ cố định, tối đa ~2.5 giây
            const state = { n: 0 };
            bio.textContent = "";
            bio.classList.add("typing");
            typing = gsap.to(state, {
                n: about.bio.length,
                duration: instant ? 0 : Math.min(2.5, about.bio.length * 0.015),
                delay: instant ? 0 : 0.5,
                ease: "none",
                onUpdate: () => { bio.textContent = about.bio.slice(0, Math.round(state.n)); },
                onComplete: () => bio.classList.remove("typing"),
            });
            if (statSets.length) showStats(activeStats, instant);
            tree?.play(instant);
            gsap.fromTo(bars, { width: "0%" }, {
                width: (i, el) => `${el.dataset.level}%`,
                duration: instant ? 0 : 1,
                delay: instant ? 0 : 0.6,
                stagger: 0.1,
                ease: "power3.out",
            });
        },
        onClose() {
            typing?.kill();
        },
    });

    return popup;
}

// Avatar dạng thẻ lật: mặt trước logo (hoặc chữ cái đầu), bấm → lật sang ảnh chân dung
function createAvatar(profile, initials) {
    const front = h("span", { class: "about-avatar-face about-avatar-front" },
        profile.logo ? h("i", { class: "about-logo", style: `--logo: url("${profile.logo}")`, "aria-hidden": "true" }) : initials);
    if (!profile.avatar) return h("div", { class: "about-avatar", "aria-hidden": "true" }, front);

    const back = h("span", { class: "about-avatar-face about-avatar-back" },
        h("img", { src: profile.avatar, alt: profile.name, width: 96, height: 96, loading: "lazy", decoding: "async" }));
    const card = h("button", {
        class: "about-avatar about-avatar--flip",
        type: "button",
        "aria-pressed": "false",
        "aria-label": "Show photo",
        title: "Click to flip",
        onClick: () => {
            const flipped = card.classList.toggle("is-flipped");
            card.setAttribute("aria-pressed", String(flipped));
            card.setAttribute("aria-label", flipped ? "Show logo" : "Show photo");
            if (flipped) track("click", "avatar-photo");
        },
    }, h("span", { class: "about-avatar-inner" }, front, back));
    return card;
}
