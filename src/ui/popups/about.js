// ui/popups/about.js
// Popup ABOUT: dạng cửa sổ hệ điều hành (kéo được bằng thanh tiêu đề),
// phần giới thiệu tự gõ chữ, thanh kỹ năng chạy dần, timeline kinh nghiệm.
import gsap from "gsap";
import { h, openExternal, prefersReducedMotion } from "../dom.js";
import { createPopup } from "../popup.js";
import { track } from "../../core/analytics.js";

/**
 * @param {{name:string, role:string}} profile
 * @param {{bio:string, skills:Array, timeline:Array}} about
 * @param {string} cvUrl
 */
export function createAboutPopup(profile, about, cvUrl) {
    // Chữ cái đầu của họ và tên: "Hoàng Trọng Phi" → "HP"
    const words = profile.name.split(/\s+/).filter(Boolean);
    const initials = [words[0], words.at(-1)].filter((w, i) => w && (i === 0 || words.length > 1)).map((w) => w[0]).join("").toUpperCase();

    const bio = h("p", { class: "about-bio typing" });
    const bars = about.skills.map((s) => h("span", { class: "skill-fill", "data-level": s.level }));

    const body = h("div", { class: "about" },
        h("aside", { class: "about-side", "data-stagger": true },
            h("div", { class: "about-avatar", "aria-hidden": "true" }, initials),
            h("h3", { class: "about-name" }, profile.name),
            h("p", { class: "about-role" }, profile.role),
            h("button", {
                class: "btn btn-primary",
                type: "button",
                onClick: () => { track("click", "cv"); openExternal(cvUrl); },
            }, "View CV ↗"),
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
            h("section", { "data-stagger": true },
                h("h4", {}, "> experience"),
                h("ol", { class: "timeline" }, about.timeline.map((t) =>
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

    makeDraggable(popup.panel, popup.head);
    return popup;
}

// Kéo panel bằng thanh tiêu đề (chỉ chuột/bút, không áp dụng màn hình nhỏ)
function makeDraggable(panel, handle) {
    let start = null;
    handle.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "touch" || e.target.closest("button") || innerWidth < 720) return;
        start = { x: e.clientX, y: e.clientY, tx: gsap.getProperty(panel, "x"), ty: gsap.getProperty(panel, "y") };
        handle.setPointerCapture(e.pointerId);
        handle.classList.add("is-dragging");
    });
    handle.addEventListener("pointermove", (e) => {
        if (!start) return;
        gsap.set(panel, { x: start.tx + e.clientX - start.x, y: start.ty + e.clientY - start.y });
    });
    const end = () => { start = null; handle.classList.remove("is-dragging"); };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
}
