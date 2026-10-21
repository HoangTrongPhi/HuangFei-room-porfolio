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
        threshold: 0.5, // 0 → 1, tuyến tính trước exposure; tăng lên nếu phòng bị loá
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
    casePC: loadCasePC(scene, CONFIG.casePC).then(({ update }) => updaters.push(update)),
    rgbLeds: loadRGBleds(scene).then((update) => updaters.push(update)),
    monitor: loadMonitorScreens(scene, CONFIG.monitor.model, CONFIG.monitor.videos, CONFIG.monitor.flips),
    social: loadSocialLinks(scene, CONFIG.social.model, CONFIG.social.links)
        .then(({ setupInteractions }) => setupInteractions(camera, canvas)),
};
Object.entries(tasks).forEach(([name, task]) =>
    task.catch((err) => console.error(`Lỗi load "${name}":`, err))
);

// ===== UI =====
track("visit");
let bgMusic = null;
const visitor = getVisitorName(REF_NAMES);

initLoadingScreen(scene, Promise.allSettled(Object.values(tasks)), {
    name: PROFILE.name,
    role: PROFILE.role,
    visitor,
    onEnter() {
        track("enter");
        // Phát nhạc sau khi người dùng bấm Enter (trình duyệt chặn autoplay có tiếng)
        bgMusic = new Audio(CONFIG.music.src);
        bgMusic.loop = true;
        bgMusic.volume = CONFIG.music.volume;
        bgMusic.play().catch((err) => console.warn("Autoplay bị chặn:", err));
        // Chào sau khi intro bay vào xong
        if (visitor) setTimeout(() => showWelcome(visitor), 2200);
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

// ===== Render loop =====
const bloom = CONFIG.bloom.enabled ? createBloom(renderer, CONFIG.bloom) : null;
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    updaters.forEach((update) => update(delta));
    controls.update(); // cần gọi mỗi frame vì bật damping
    renderer.render(scene, camera);
    bloom?.render(scene, camera);
});

// ===== Resize =====
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    bloom?.setSize(window.innerWidth, window.innerHeight);
});
