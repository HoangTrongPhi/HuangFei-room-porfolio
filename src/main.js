// main.js — điểm vào của app: khởi tạo renderer/camera/scene, load model, vòng lặp render.
import "./style.scss";
import "./View_UI.css";
import "./Loading.css";
import "./Popup.css";

import * as THREE from "three";

import { createRenderer } from "./core/renderer.js";
import { createCamera } from "./core/camera.js";
import { loadSceneModel } from "./core/models.js";
import { loadRGBleds } from "./core/RGB_led.js";
import { loadCasePC } from "./core/Case_PC.js";
import { loadMonitorScreens } from "./core/screen_video.js";
import { loadSocialLinks } from "./core/Social_Link.js";
import { initLoadingScreen } from "./ui/loading.js";
import { initMenu } from "./ui/menu.js";
import { openPopup } from "./ui/popup.js";
import { createWorkPopup } from "./ui/popups/work.js";
import { createAboutPopup } from "./ui/popups/about.js";
import { createContactPopup } from "./ui/popups/contact.js";
import { getVisitorName, showWelcome } from "./ui/welcome.js";
import { createBloom } from "./core/bloom.js";
import { createCameraFocus } from "./core/cameraFocus.js";
import { createInteractions } from "./core/interactions.js";
import { createAudioLevel } from "./core/audioLevel.js";
import { createHotspots } from "./ui/hotspots.js";
import { track } from "./core/analytics.js";
import { PROFILE, LINKS, WORK, ABOUT, CONTACT, REF_NAMES } from "./content.js";

// ================== CONFIG ==================
const CONFIG = {
    renderer: {
        background: "#000000",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 3,
    },
    camera: {
        pos: [7, 5, 7],
        target: [0, 0.1, 0],
        zoom: 0.1, // camera thực tế = target + (pos - target) * zoom
    },
    bloom: {
        enabled: true,
        strength: 0.8,
        radius: 0.6,
        threshold: 1, // 0 → 1, tuyến tính trước exposure; tăng lên nếu phòng bị loá
    },
    casePC: {
        fanSpeed: 12,
        aioBrightness: 100,
        aioFlip: { flipX: false, flipY: true },
    },
    monitor: {
        model: "/models/Monitor.glb",
        videos: {
            Screen_01: "/media/monitor_1.mp4",
            Screen_02: "/media/monitor_2.mp4",
            Screen_03: "/media/monitor_3.mp4",
        },
        flips: {
            Screen_01: { flipX: false, flipY: true },
            Screen_02: { flipX: false, flipY: true },
            Screen_03: { flipX: true, flipY: true },
        },
    },
    social: {
        model: "/models/Social_Link.glb",
        links: { // từ khoá trong tên mesh → URL
            Artstation: LINKS.artstation,
            Facebook: LINKS.facebook,
            Youtube: LINKS.youtube,
            Github: LINKS.github,
        },
    },
    music: { src: "/music/CuteSimple Piano.ogg", volume: 0.6 },
    // Vật thể bấm được: bay camera tới (view = hướng nhìn từ vật thể tới camera) rồi mở popup
    spots: {
        monitor: { label: "My work", popup: "work", view: [1, 0.35, 0.15] },
        casePC: { label: "About me", popup: "about", view: [1, 0.45, 0.8] },
        social: { label: "Contact", popup: "contact", view: [0.25, 0.3, 1] },
    },
};
// =============================================

// ===== Scene, renderer, camera =====
const canvas = document.querySelector("#experience-canvas");
const renderer = createRenderer(canvas, CONFIG.renderer);
const { camera, controls } = createCamera(canvas, CONFIG.camera);

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.renderer.background);

// ===== Load models =====
// Các hàm update mỗi frame, được thêm vào khi model tương ứng load xong
const updaters = [];

// Load song song; một model lỗi không làm hỏng các model còn lại
const tasks = {
    room: loadSceneModel(scene),
    casePC: loadCasePC(scene, CONFIG.casePC).then((pc) => { updaters.push(pc.update); return pc; }),
    rgbLeds: loadRGBleds(scene).then((update) => updaters.push(update)),
    monitor: loadMonitorScreens(scene, CONFIG.monitor.model, CONFIG.monitor.videos, CONFIG.monitor.flips),
    social: loadSocialLinks(scene, CONFIG.social.model, CONFIG.social.links)
        .then((social) => { social.setupInteractions(camera, canvas); return social; }),
};
Object.entries(tasks).forEach(([name, task]) =>
    task.catch((err) => console.error(`Lỗi load "${name}":`, err))
);

// ===== UI =====
track("visit");
let bgMusic = null;
let audioLevel = null;
const visitor = getVisitorName(REF_NAMES);
const ready = Promise.allSettled(Object.values(tasks));

const focus = createCameraFocus(camera, controls);
const interactions = createInteractions(camera, canvas);
interactions.setEnabled(false); // bật sau khi intro xong
let hotspots = null;

initLoadingScreen(scene, ready, {
    name: PROFILE.name,
    role: PROFILE.role,
    visitor,
    onEnter() {
        track("enter");
        // Phát nhạc sau khi người dùng bấm Enter (trình duyệt chặn autoplay có tiếng)
        bgMusic = new Audio(CONFIG.music.src);
        bgMusic.loop = true;
        bgMusic.volume = CONFIG.music.volume;
        try {
            audioLevel = createAudioLevel(bgMusic);
        } catch (err) {
            console.warn("Không bật được Web Audio, LED sẽ không nháy theo nhạc:", err);
        }
        bgMusic.play().catch((err) => console.warn("Autoplay bị chặn:", err));
    },
    onIntroDone() {
        hotspots?.show();
        interactions.setEnabled(true);
        if (visitor) showWelcome(visitor);
    },
});

createWorkPopup(WORK, LINKS.portfolioPdf);
createAboutPopup(PROFILE, ABOUT, LINKS.cv);
createContactPopup(PROFILE, CONTACT, LINKS);
initMenu({
    "#mywork": (item) => openPopup("work", item),
    "#about": (item) => openPopup("about", item),
    "#contact": (item) => openPopup("contact", item),
}, () => bgMusic);

// Bấm vật thể / hotspot: camera bay tới → mở popup → đóng popup thì camera bay về
async function visit(id, objects) {
    const spot = CONFIG.spots[id];
    track("click", `spot-${id}`);
    interactions.setEnabled(false);
    hotspots.hide();
    await focus.focus(objects, new THREE.Vector3(...spot.view));
    openPopup(spot.popup, null, {
        onClosed: async () => {
            await focus.reset();
            hotspots.show();
            interactions.setEnabled(true);
        },
    });
}

ready.then(async () => {
    const [monitor, casePC, social] = await Promise.all(
        [tasks.monitor, tasks.casePC, tasks.social].map((t) => t.catch(() => null))
    );
    const meshesOf = (root) => {
        const list = [];
        root.traverse((o) => o.isMesh && list.push(o));
        return list;
    };
    const objects = {
        monitor: monitor && [monitor.root],
        casePC: casePC && [casePC.root],
        social: social && Object.values(social.meshes),
    };

    // Logo mạng xã hội đã có hover/click riêng (mở link) nên chỉ gắn hotspot, không đăng ký tương tác
    if (monitor) interactions.register("monitor", meshesOf(monitor.root), () => visit("monitor", objects.monitor));
    if (casePC) interactions.register("casePC", meshesOf(casePC.root), () => visit("casePC", objects.casePC));

    hotspots = createHotspots(camera, Object.entries(objects)
        .filter(([, objs]) => objs)
        .map(([id, objs]) => ({ id, label: CONFIG.spots[id].label, objects: objs, onClick: () => visit(id, objs) })));
    interactions.onHover((id) => hotspots.setActive(id));
    hotspots.onHover((id, on) => interactions.highlight(id, on));
});

if (import.meta.env.DEV) window.__app = { scene, camera, controls, focus };

// ===== Render loop =====
const bloom = CONFIG.bloom.enabled ? createBloom(renderer, CONFIG.bloom) : null;
const timer = new THREE.Timer();
timer.connect(document); // tạm dừng khi tab bị ẩn để delta không nhảy vọt lúc quay lại
renderer.setAnimationLoop(() => {
    // Không truyền timestamp của rAF: nó có thể sớm hơn lúc tạo timer → delta âm ở frame đầu
    timer.update();
    const delta = timer.getDelta();
    const level = audioLevel?.getLevel() ?? 0; // độ lớn nhạc 0 → 1 cho LED
    updaters.forEach((update) => update(delta, level));
    controls.update(); // cần gọi mỗi frame vì bật damping
    renderer.render(scene, camera);
    bloom?.render(scene, camera);
    hotspots?.update();
});

// ===== Resize =====
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    bloom?.setSize(window.innerWidth, window.innerHeight);
});
