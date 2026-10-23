// ui/popups/work.js
// Popup MY WORK: lưới thẻ dự án (lọc theo tag, nghiêng 3D theo chuột, rê vào thì phát video)
// → bấm thẻ mở trang chi tiết ngay trong popup.
import gsap from "gsap";
import { h } from "../dom.js";
import { createPopup } from "../popup.js";
import { track } from "../../core/analytics.js";

/**
 * @param {Array} projects - WORK trong content.js
 * @param {string} portfolioUrl - link PDF portfolio đầy đủ
 */
export function createWorkPopup(projects, portfolioUrl) {
    const tags = ["All", ...new Set(projects.flatMap((p) => p.tags))];
    let activeTag = "All";

    const chips = tags.map((tag) => h("button", {
        class: `chip${tag === activeTag ? " is-active" : ""}`,
        type: "button",
        onClick: () => filter(tag),
    }, tag));

    const cards = projects.map((p) => createCard(p, () => showDetail(p)));
    const grid = h("div", { class: "work-grid" }, cards.map((c) => c.el));

    const gridView = h("div", { class: "work-view" },
        h("div", { class: "work-filters", "data-stagger": true }, chips),
        grid,
        h("div", { class: "work-footer", "data-stagger": true },
            externalLink(portfolioUrl, "portfolio-pdf", "Full portfolio (PDF) ↗"),
        ),
    );
    cards.forEach((c) => c.el.setAttribute("data-stagger", ""));

    const detailView = h("div", { class: "work-view work-detail", hidden: true });
    const body = h("div", { class: "work" }, gridView, detailView);

    function filter(tag) {
        activeTag = tag;
        chips.forEach((chip) => chip.classList.toggle("is-active", chip.textContent === tag));
        cards.forEach(({ el, project }) => {
            const show = tag === "All" || project.tags.includes(tag);
            if (show === !el.hidden) return;
            if (show) {
                el.hidden = false;
                gsap.fromTo(el, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" });
            } else {
                el.hidden = true;
            }
        });
    }

    function showDetail(project) {
        track("click", `work-${project.id}`);
        detailView.replaceChildren(
            h("button", { class: "btn btn-ghost work-back", type: "button", onClick: showGrid }, "← Back"),
            project.video
                ? h("video", { class: "work-detail-media", src: project.video, poster: project.cover, controls: true, autoplay: true, muted: true, loop: true, playsinline: true })
                : project.cover
                    ? h("img", { class: "work-detail-media work-cover", src: project.cover, alt: project.title })
                    : h("div", { class: "work-detail-media work-placeholder" }, project.title.slice(0, 1)),
            h("div", { class: "work-detail-info" },
                h("h3", {}, project.title),
                project.meta && h("span", { class: "work-meta" }, project.meta),
                h("div", { class: "work-tags" }, project.tags.map((t) => h("span", { class: "tag" }, t))),
                h("p", {}, project.description),
                project.link && externalLink(project.link, `link-${project.id}`, "View project ↗"),
            ),
        );
        // Thuộc tính muted phải set qua property thì autoplay mới chạy
        const video = detailView.querySelector("video");
        if (video) { video.muted = true; video.play().catch(() => {}); }

        swap(gridView, detailView, 1);
        detailView.querySelector(".work-back").focus({ preventScroll: true });
    }

    function showGrid() {
        if (detailView.hidden) return;
        swap(detailView, gridView, -1);
    }

    // Trượt view hiện tại ra, view mới vào; dir = 1 (sang phải) | -1 (quay lại)
    function swap(from, to, dir) {
        gsap.to(from, {
            x: -40 * dir, opacity: 0, duration: 0.2, ease: "power2.in",
            onComplete: () => {
                from.hidden = true;
                gsap.set(from, { clearProps: "all" });
                if (from === detailView) detailView.replaceChildren(); // dừng video
                to.hidden = false;
                gsap.fromTo(to, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power2.out", clearProps: "all" });
            },
        });
    }

    const popup = createPopup("work", {
        title: "My Work",
        anim: "reveal",
        className: "popup-panel--work",
        body,
        onClose: () => {
            detailView.hidden = true;
            detailView.replaceChildren();
            gridView.hidden = false;
            cards.forEach((c) => c.stop());
        },
    });

    /** Mở thẳng trang chi tiết một dự án (dùng khi bấm hologram trong phòng) */
    popup.showProject = (id) => {
        const project = projects.find((p) => p.id === id);
        if (!project) return;
        gridView.hidden = true;
        detailView.hidden = false;
        showDetail(project);
    };
    return popup;
}

// Link ngoài dùng <a target="_blank"> thật thay vì window.open: trình chặn popup / extension
// không chặn được, và bấm chuột giữa / Ctrl+click mở tab nền như link thường.
function externalLink(url, trackId, label) {
    return h("a", {
        class: "btn btn-primary",
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: () => track("click", trackId),
    }, label);
}

function createCard(project, onSelect) {
    const video = project.video
        // Có ảnh bìa thì dùng làm poster, không thì #t=0.5: hiện khung hình ở giây 0.5 làm ảnh bìa
        ? h("video", { src: project.cover ? project.video : `${project.video}#t=0.5`, poster: project.cover, muted: true, loop: true, playsinline: true, preload: "metadata" })
        : null;
    if (video) video.muted = true;
    const cover = !video && project.cover ? h("img", { src: project.cover, alt: "", loading: "lazy", decoding: "async" }) : null;

    const el = h("button", { class: "work-card", type: "button", onClick: onSelect },
        h("div", { class: "work-media" }, video ?? cover ?? h("div", { class: "work-placeholder" }, project.title.slice(0, 1))),
        h("div", { class: "work-info" },
            h("h3", {}, project.title),
            project.meta && h("span", { class: "work-meta" }, project.meta),
            h("div", { class: "work-tags" }, project.tags.map((t) => h("span", { class: "tag" }, t))),
        ),
        h("span", { class: "work-shine", "aria-hidden": "true" }),
    );

    // Nghiêng thẻ theo vị trí chuột + vệt sáng chạy theo
    el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
        el.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("pointerenter", () => video?.play().catch(() => {}));
    el.addEventListener("pointerleave", stop);

    function stop() {
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
        if (video) { video.pause(); video.currentTime = project.cover ? 0 : 0.5; }
    }

    return { el, project, stop };
}
