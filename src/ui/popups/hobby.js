// ui/popups/hobby.js
// Popup HOBBY: catalog các game hay chơi — lọc theo thể loại, thẻ nghiêng 3D theo chuột,
// mỗi thẻ có màu nhận diện riêng; bấm thẻ mở trang chủ của game.
import gsap from "gsap";
import { h, openExternal } from "../dom.js";
import { createPopup } from "../popup.js";
import { track } from "../../core/analytics.js";

/**
 * @param {{intro?: string, games: Array}} hobby - HOBBY trong content.js
 */
export function createHobbyPopup(hobby) {
    const genres = ["All", ...new Set(hobby.games.map((g) => g.genre))];
    const chips = genres.map((genre) => h("button", {
        class: `chip${genre === "All" ? " is-active" : ""}`,
        type: "button",
        onClick: () => filter(genre),
    }, genre));

    const cards = hobby.games.map((game) => ({ game, el: createCard(game) }));

    const body = h("div", { class: "hobby" },
        hobby.intro && h("p", { class: "hobby-intro", "data-stagger": true }, `> ${hobby.intro}`),
        genres.length > 2 && h("div", { class: "work-filters", "data-stagger": true }, chips),
        h("div", { class: "hobby-grid" }, cards.map((c) => c.el)),
    );

    function filter(genre) {
        chips.forEach((chip) => chip.classList.toggle("is-active", chip.textContent === genre));
        cards.forEach(({ el, game }) => {
            const show = genre === "All" || game.genre === genre;
            if (show === !el.hidden) return;
            el.hidden = !show;
            if (show) gsap.fromTo(el, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" });
        });
    }

    return createPopup("hobby", {
        title: "Hobby — games I play",
        anim: "flip",
        className: "popup-panel--hobby",
        body,
        onClose: () => filter("All"),
    });
}

function createCard(game) {
    // Chữ viết tắt làm "ảnh bìa": "League of Legends" → "LoL", "Delta Force" → "DF"
    const initials = game.title
        .replace(/['’]s\b/g, "") // "Conqueror's Blade" → "CB"
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => (/^(of|the|and)$/i.test(w) ? w[0].toLowerCase() : w[0].toUpperCase()))
        .join("")
        .slice(0, 4);

    const el = h("button", {
        class: "hobby-card",
        type: "button",
        style: `--game: ${game.color}`,
        "data-stagger": "",
        "aria-label": `${game.title} — open official site`,
        onClick: () => { track("click", `hobby-${game.id}`); openExternal(game.link); },
    },
        h("div", { class: "hobby-cover", "aria-hidden": "true" },
            h("span", { class: "hobby-initials" }, initials),
            h("span", { class: "hobby-year" }, String(game.year)),
        ),
        h("div", { class: "hobby-info" },
            h("h3", {}, game.title),
            h("p", { class: "hobby-meta" }, h("span", { class: "tag" }, game.genre), h("span", { class: "muted" }, game.studio)),
            game.note && h("p", { class: "hobby-note" }, game.note),
        ),
        h("span", { class: "work-shine", "aria-hidden": "true" }),
    );

    // Nghiêng thẻ theo vị trí chuột + vệt sáng chạy theo (giống thẻ MY WORK)
    el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
        el.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
    });
    return el;
}
