// ui/popups/hobby.js
// Popup HOBBY: 3 tab sở thích, mỗi tab một kiểu hiển thị riêng (tab nào trống thì ẩn):
//   Games → catalog thẻ game, lọc theo thể loại, thẻ nghiêng 3D theo chuột
//   Music → playlist, đĩa than (nhãn giữa là ảnh bìa bài hát) quay khi rê chuột
//   Films → poster dọc, chấm điểm sao
// Bấm vào mục nào cũng mở link ngoài (trang game / bài nhạc / trang phim).
import gsap from "gsap";
import { h, openExternal, prefersReducedMotion } from "../dom.js";
import { createPopup } from "../popup.js";
import { track } from "../../core/analytics.js";

/**
 * @param {{gameIntro?: string, musicIntro?: string, filmIntro?: string, games?: Array, music?: Array, films?: Array}} hobby - HOBBY trong content.js
 */
export function createHobbyPopup(hobby) {
    const sections = [
        { id: "games", label: "Games", items: hobby.games, intro: hobby.gameIntro, build: buildGames },
        { id: "music", label: "Music", items: hobby.music, intro: hobby.musicIntro, build: buildMusic },
        { id: "films", label: "Films", items: hobby.films, intro: hobby.filmIntro, build: buildFilms },
    ].filter((s) => s.items?.length);

    const tabs = sections.map((s, i) => h("button", {
        class: `hobby-tab${i === 0 ? " is-active" : ""}`,
        type: "button",
        role: "tab",
        id: `hobby-tab-${s.id}`,
        "aria-controls": `hobby-pane-${s.id}`,
        "aria-selected": String(i === 0),
        onClick: () => select(i),
    }, s.label, h("span", { class: "hobby-tab-count" }, String(s.items.length).padStart(2, "0"))));

    const panes = sections.map((s, i) => {
        const built = s.build(s.items);
        const pane = h("div", {
            class: `hobby-pane hobby-pane--${s.id}`,
            role: "tabpanel",
            id: `hobby-pane-${s.id}`,
            "aria-labelledby": `hobby-tab-${s.id}`,
            hidden: i !== 0,
        },
            s.intro && h("p", { class: "hobby-intro", "data-stagger": true }, `> ${s.intro}`),
            built.el,
        );
        return { pane, reset: built.reset };
    });

    let current = 0;
    function select(i, silent = false) {
        if (i === current) return;
        current = i;
        tabs.forEach((tab, j) => {
            tab.classList.toggle("is-active", j === i);
            tab.setAttribute("aria-selected", String(j === i));
        });
        panes.forEach(({ pane }, j) => { pane.hidden = j !== i; });
        if (silent) return;
        track("click", `hobby-tab-${sections[i].id}`);
        if (!prefersReducedMotion()) {
            gsap.fromTo(panes[i].pane.querySelectorAll("[data-stagger]"),
                { y: 14, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: "power2.out", overwrite: true });
        }
    }

    // ← → chuyển tab khi đang focus thanh tab
    const tablist = sections.length > 1 && h("div", { class: "hobby-tabs", role: "tablist", "aria-label": "Hobby categories", "data-stagger": true }, tabs);
    tablist?.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const next = (current + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        select(next);
        tabs[next].focus();
    });

    const body = h("div", { class: "hobby" }, tablist, panes.map((p) => p.pane));

    return createPopup("hobby", {
        title: "Hobby — things I love",
        anim: "flip",
        className: "popup-panel--hobby",
        body,
        onClose: () => {
            select(0, true);
            panes.forEach((p) => p.reset?.());
        },
    });
}

// ===== Games: thẻ ngang 16:9 + lọc thể loại =====
function buildGames(games) {
    const genres = ["All", ...new Set(games.map((g) => g.genre))];
    const chips = genres.map((genre) => h("button", {
        class: `chip${genre === "All" ? " is-active" : ""}`,
        type: "button",
        onClick: () => filter(genre),
    }, genre));
    const cards = games.map((game) => ({ game, el: createGameCard(game) }));

    function filter(genre) {
        chips.forEach((chip) => chip.classList.toggle("is-active", chip.textContent === genre));
        cards.forEach(({ el, game }) => {
            const show = genre === "All" || game.genre === genre;
            if (show === !el.hidden) return;
            el.hidden = !show;
            if (show) gsap.fromTo(el, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" });
        });
    }

    return {
        el: h("div", {},
            genres.length > 2 && h("div", { class: "work-filters", "data-stagger": true }, chips),
            h("div", { class: "hobby-grid" }, cards.map((c) => c.el)),
        ),
        reset: () => filter("All"),
    };
}

function createGameCard(game) {
    const el = h("button", {
        class: "hobby-card",
        type: "button",
        style: `--game: ${game.color}`,
        "data-stagger": "",
        "aria-label": `${game.title} — open official site`,
        onClick: () => { track("click", `hobby-${game.id}`); openExternal(game.link); },
    },
        h("div", { class: "hobby-cover", "aria-hidden": "true" },
            game.cover
                ? coverImg(game.cover)
                : h("span", { class: "hobby-initials" }, initialsOf(game.title)),
            h("span", { class: "hobby-year" }, String(game.year)),
        ),
        h("div", { class: "hobby-info" },
            h("h3", {}, game.title),
            h("p", { class: "hobby-meta" }, h("span", { class: "tag" }, game.genre), h("span", { class: "muted" }, game.studio)),
            game.note && h("p", { class: "hobby-note" }, game.note),
        ),
        h("span", { class: "work-shine", "aria-hidden": "true" }),
    );
    addTilt(el, 10, 12);
    return el;
}

// ===== Music: playlist với đĩa than =====
function buildMusic(tracks) {
    const rows = tracks.map((song, i) => h("button", {
        class: "hobby-track",
        type: "button",
        style: `--c: ${song.color || "#66e0ff"}`,
        "data-stagger": "",
        "aria-label": `${song.title} by ${song.artist} — listen`,
        onClick: () => { track("click", `hobby-music-${song.id}`); openExternal(song.link); },
    },
        h("span", { class: "hobby-track-index", "aria-hidden": "true" }, String(i + 1).padStart(2, "0")),
        h("span", { class: `hobby-vinyl${song.cover ? " has-cover" : ""}`, "aria-hidden": "true" }, h("i", {}, song.cover && coverImg(song.cover))),
        h("span", { class: "hobby-track-text" },
            h("strong", {}, song.title),
            h("span", { class: "muted" }, song.artist),
            song.note && h("em", { class: "hobby-track-note" }, song.note),
        ),
        h("span", { class: "tag" }, song.genre),
        h("span", { class: "hobby-track-year muted" }, String(song.year)),
        h("span", { class: "hobby-track-play", "aria-hidden": "true" }, "▶"),
    ));
    return { el: h("div", { class: "hobby-playlist" }, rows) };
}

// ===== Films: poster dọc 2:3 =====
function buildFilms(films) {
    const posters = films.map((film) => {
        const rating = Math.max(0, Math.min(5, Math.round(film.rating ?? 0)));
        const el = h("button", {
            class: "hobby-film",
            type: "button",
            style: `--c: ${film.color || "#4d99ff"}`,
            "data-stagger": "",
            "aria-label": `${film.title} (${film.year}) — open film page`,
            onClick: () => { track("click", `hobby-film-${film.id}`); openExternal(film.link); },
        },
            h("div", { class: `hobby-poster${film.cover ? " has-cover" : ""}`, "aria-hidden": "true" },
                film.cover && coverImg(film.cover),
                h("span", { class: "hobby-year" }, String(film.year)),
                !film.cover && h("span", { class: "hobby-poster-title" }, film.title),
                rating > 0 && h("span", { class: "hobby-stars" }, "★".repeat(rating), h("span", { class: "hobby-stars-off" }, "★".repeat(5 - rating))),
            ),
            h("div", { class: "hobby-film-info" },
                h("p", { class: "hobby-meta" }, h("span", { class: "tag" }, film.genre), h("span", { class: "muted" }, film.director)),
                film.note && h("p", { class: "hobby-note" }, film.note),
            ),
            h("span", { class: "work-shine", "aria-hidden": "true" }),
        );
        addTilt(el, 8, 10);
        return el;
    });
    return { el: h("div", { class: "hobby-films" }, posters) };
}

// Ảnh bìa (game / đĩa nhạc / poster phim); không có ảnh thì dùng màu + chữ thay thế
function coverImg(src) {
    return h("img", { class: "hobby-img", src, alt: "", loading: "lazy", decoding: "async" });
}

// Chữ viết tắt làm "ảnh bìa": "League of Legends" → "LoL", "Delta Force" → "DF"
function initialsOf(title) {
    return title
        .replace(/^the\s+/i, "") // "The Lord of the Rings: ..." → "LotR"
        .replace(/['’]s\b/g, "") // "Conqueror's Blade" → "CB"
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => (/^(of|the|and)$/i.test(w) ? w[0].toLowerCase() : w[0].toUpperCase()))
        .join("")
        .slice(0, 4);
}

// Nghiêng thẻ theo vị trí chuột + vệt sáng chạy theo (giống thẻ MY WORK)
function addTilt(el, maxX, maxY) {
    el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--rx", `${(0.5 - py) * maxX}deg`);
        el.style.setProperty("--ry", `${(px - 0.5) * maxY}deg`);
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
    });
}
