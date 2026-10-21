// ui/hotspots.js
// Chấm sáng nhấp nháy gắn trên các vật thể bấm được, kèm nhãn. Vị trí 3D được chiếu ra màn hình mỗi frame.
import * as THREE from "three";
import gsap from "gsap";
import { h } from "./dom.js";

/**
 * @param {THREE.Camera} camera
 * @param {Array<{id:string, label:string, objects:THREE.Object3D[], onClick:() => void}>} items
 */
export function createHotspots(camera, items) {
    const root = document.body.appendChild(h("div", { class: "hotspots", hidden: true }));
    const projected = new THREE.Vector3();

    const spots = items.map((item) => {
        const el = h("button", { class: "hotspot", type: "button", "aria-label": item.label, onClick: item.onClick },
            h("span", { class: "hotspot-dot", "aria-hidden": "true" }),
            h("span", { class: "hotspot-label" }, item.label),
        );
        root.append(el);
        return { ...item, el, anchor: new THREE.Vector3() };
    });

    // Neo = điểm giữa phía trên của khối bao vật thể (tính lại mỗi lần hiện, vì intro làm vật thể di chuyển)
    function measure() {
        const box = new THREE.Box3();
        spots.forEach((s) => {
            box.makeEmpty();
            s.objects.forEach((o) => box.expandByObject(o));
            box.getCenter(s.anchor);
            s.anchor.y = box.max.y;
        });
    }

    function update() {
        if (root.hidden) return;
        const w = window.innerWidth;
        const hgt = window.innerHeight;
        spots.forEach((s) => {
            projected.copy(s.anchor).project(camera);
            const visible = projected.z < 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1;
            s.el.style.visibility = visible ? "" : "hidden";
            s.el.style.transform = `translate(${(projected.x * 0.5 + 0.5) * w}px, ${(-projected.y * 0.5 + 0.5) * hgt}px)`;
        });
    }

    return {
        update,
        show() {
            measure();
            root.hidden = false;
            update();
            // Animate phần tử con: transform của nút đã dùng để đặt vị trí
            gsap.fromTo(root.querySelectorAll(".hotspot-dot"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.12, ease: "back.out(2)", clearProps: "scale,opacity" });
        },
        hide() {
            root.hidden = true;
        },
        /** Làm nổi nhãn khi rê chuột vào vật thể tương ứng (id null = bỏ hết). */
        setActive(id) {
            spots.forEach((s) => s.el.classList.toggle("is-active", s.id === id));
        },
        onHover(cb) {
            spots.forEach((s) => {
                s.el.addEventListener("pointerenter", () => cb(s.id, true));
                s.el.addEventListener("pointerleave", () => cb(s.id, false));
            });
        },
    };
}
