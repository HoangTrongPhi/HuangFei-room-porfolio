// ui/popups/contact.js
// Popup CONTACT: lật vào như một tấm thẻ; copy email, nút LinkedIn, các mạng xã hội.
import { h, openExternal } from "../dom.js";
import { createPopup } from "../popup.js";
import { toast } from "../toast.js";
import { track } from "../../core/analytics.js";

const SOCIALS = [
    ["linkedin", "LinkedIn"],
    ["artstation", "ArtStation"],
    ["github", "GitHub"],
    ["youtube", "YouTube"],
    ["facebook", "Facebook"],
];

/**
 * @param {{name:string, email:string}} profile
 * @param {{headline:string, note:string}} contact
 * @param {Object<string,string>} links - LINKS trong content.js
 */
export function createContactPopup(profile, contact, links) {
    const open = (key) => { track("click", key); openExternal(links[key]); };

    const body = h("div", { class: "contact" },
        h("p", { class: "contact-kicker", "data-stagger": true }, "// get in touch"),
        h("h3", { class: "contact-headline", "data-stagger": true }, contact.headline),
        h("p", { class: "muted", "data-stagger": true }, contact.note),

        profile.email && h("div", { class: "contact-email", "data-stagger": true },
            h("code", {}, profile.email),
            h("button", { class: "btn btn-ghost", type: "button", onClick: () => copyEmail(profile.email) }, "Copy"),
        ),

        h("div", { class: "contact-actions", "data-stagger": true },
            h("button", { class: "btn btn-primary", type: "button", onClick: () => open("linkedin") }, "Message me on LinkedIn ↗"),
            h("button", { class: "btn btn-ghost", type: "button", onClick: () => open("cv") }, "View CV ↗"),
        ),

        h("div", { class: "contact-socials", "data-stagger": true },
            SOCIALS.filter(([key]) => links[key]).map(([key, label]) =>
                h("button", { class: "social", type: "button", onClick: () => open(key) },
                    h("span", { class: "social-mark", "aria-hidden": "true" }, label.slice(0, 2)),
                    label,
                )),
        ),
    );

    return createPopup("contact", {
        title: "Contact",
        anim: "flip",
        className: "popup-panel--contact",
        body,
    });
}

async function copyEmail(email) {
    try {
        await navigator.clipboard.writeText(email);
        track("click", "email-copy");
        toast("Email copied ✓");
    } catch {
        toast(email); // trình duyệt chặn clipboard → hiện email để tự copy
    }
}
