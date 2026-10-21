// main.js — điểm vào của app: khởi tạo renderer/camera/scene, load model, vòng lặp render.
import "./style.scss";
import "./View_UI.css";
import "./Loading.css";

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
            Artstation: "https://www.artstation.com/hoangphi",
            Facebook: "https://www.facebook.com/phi.hoang.568294/",
            Youtube: "https://www.youtube.com/@phihoang1825/videos",
            Github: "https://github.com/HoangTrongPhi",
        },
    },
    menuLinks: { // data-link trong index.html → URL
        "#mywork": "https://drive.google.com/file/d/1ew7p4o9LU8ICZqbRo4OMR2Ul2i61Cpie/view?usp=drive_link",
        "#contact": "https://www.linkedin.com/in/hoangtrongphi2511/",
        "#about": "https://drive.google.com/drive/u/0/folders/1TRbTRjFWWdXCvMOJLnZYTyfH07sgigSo",
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

// ===== UI =====
let bgMusic = null;

initLoadingScreen(scene, () => {
    // Phát nhạc sau khi người dùng bấm Enter (trình duyệt chặn autoplay có tiếng)
    bgMusic = new Audio(CONFIG.music.src);
    bgMusic.loop = true;
    bgMusic.volume = CONFIG.music.volume;
    bgMusic.play().catch((err) => console.warn("Autoplay bị chặn:", err));
});
initMenu(CONFIG.menuLinks, () => bgMusic);

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

// ===== Render loop =====
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    updaters.forEach((update) => update(delta));
    controls.update(); // cần gọi mỗi frame vì bật damping
    renderer.render(scene, camera);
});

// ===== Resize =====
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
