// main.js — điểm vào của app: khởi tạo renderer/camera/scene, load model, vòng lặp render.
import "./style.scss";
import "./View_UI.css";
import "./Loading.css";
import "./Popup.css";
import "./Arcade.css";
import "./Pipeline.css";

import * as THREE from "three";
import gsap from "gsap";

import { createRenderer } from "./core/renderer.js";
import { isMobile } from "./core/device.js";
import { createAdaptiveQuality } from "./core/adaptiveQuality.js";
import { suspendVideos } from "./core/video.js";
import { createCamera } from "./core/camera.js";
import { loadSceneModel } from "./core/models.js";
import { applyRoomEnvironment } from "./core/light.js";
import { initLoader } from "./core/loader.js";
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
import { createHobbyPopup } from "./ui/popups/hobby.js";
import { createPipelinePopup } from "./ui/popups/pipeline.js";
import { createArcade } from "./ui/arcade/console.js";
import { setMutedSource } from "./ui/arcade/sfx.js";
import { getVisitorName, showWelcome } from "./ui/welcome.js";
import { createBloom } from "./core/bloom.js";
import { playIntro } from "./core/intro.js";
import { createCameraFocus } from "./core/cameraFocus.js";
import { createCleanerRobot } from "./core/cleanerRobot.js";
import { createRoomMotion } from "./core/roomMotion.js";
import { createKeyboardHover } from "./core/keyboardHover.js";
import { createInteractions } from "./core/interactions.js";
import { createAudioLevel } from "./core/audioLevel.js";
import { createHotspots } from "./ui/hotspots.js";
import { createHud } from "./ui/hud.js";
import { createHolograms } from "./core/holograms.js";
import { createParticles } from "./core/particles.js";
import { createRoomControl } from "./ui/roomControl.js";
import { createWeather } from "./ui/weather.js";
import { createPixelDisplay } from "./core/pixelDisplay.js";
import { createPixelPopup } from "./ui/popups/pixel.js";
import { createIdleHint } from "./ui/idleHint.js";
import { prefersReducedMotion } from "./ui/dom.js";
import { track } from "./core/analytics.js";
import { PROFILE, LINKS, WORK, ABOUT, CONTACT, HOBBY, PIPELINE, REF_NAMES, WEATHER } from "./content.js";

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
    // Env map cho phản chiếu PBR; exposure đã cao nên để nhỏ (≥ 0.2 làm tường bạc màu, mất chất neon)
    environment: {
        intensity: 0.1,
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
    // Opus/WebM nhẹ nhất; Safari cũ không phát được thì dùng bản AAC/M4A
    music: {
        sources: [
            { src: "/music/bgm.webm", type: 'audio/webm; codecs="opus"' },
            { src: "/music/bgm.m4a", type: 'audio/mp4; codecs="mp4a.40.2"' },
        ],
        title: "Cute Simple Piano",
        volume: 0.6,
    },
    // Vật thể bấm được: bay camera tới (view = hướng nhìn từ vật thể tới camera) rồi mở popup
    spots: {
        monitor: { label: "My work", popup: "work", view: [1, 0.35, 0.15] },
        casePC: { label: "About me", popup: "about", view: [1, 0.45, 0.8] },
        social: { label: "Contact", popup: "contact", view: [0.25, 0.3, 1] },
        switch: { label: "Play", popup: "arcade", view: [1, 0.35, 0.2] }, // máy Switch trên kệ dưới màn hình
        // Loa Divoom: chọn hình màn pixel; fill nhỏ → camera đứng xa hơn, vẫn thấy bối cảnh quanh loa
        divoom: { label: "Pixel", popup: "pixel", view: [1, 0.3, 0.1], fill: 0.3 },
        // Bấm được nhưng không có chấm hotspot (đỡ rối): kệ chứng chỉ + sách trên tường, poster
        shelf: { label: "Skills", popup: "about", view: [0.2, 0.15, 1], fill: 0.5 },
        poster: { label: "Hobby", popup: "hobby", view: [0.1, 0.05, 1], fill: 0.6 }, // poster game → catalog game hay chơi
        books: { label: "Skill tree", popup: "pipeline", view: [0.35, 0.6, 1], fill: 0.45 }, // chồng sách trên hộp dưới bàn → cây kỹ năng pipeline
    },
    // Màn hình hologram chiếu video dự án (WORK có video), lơ lửng hai bên phòng — toạ độ thế giới (mét)
    holograms: {
        slots: [
            [-0.3, 0.25, 0.34],   // trái, trên (vùng trống dưới thẻ tên)
            [-0.27, 0.13, 0.38],  // trái, dưới
            [0.28, 0.28, -0.22],  // phải, trên (giữa phòng và dock menu)
            [0.31, 0.16, -0.18],  // phải, dưới
        ],
    },
    // Vùng hạt sáng bay quanh phòng (mét)
    particles: { min: [-0.22, 0.02, -0.22], max: [0.28, 0.42, 0.3] },
};
// =============================================

// ===== Scene, renderer, camera =====
const canvas = document.querySelector("#experience-canvas");
const renderer = createRenderer(canvas, CONFIG.renderer);
const { camera, controls } = createCamera(canvas, CONFIG.camera);

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.renderer.background);
applyRoomEnvironment(renderer, scene, CONFIG.environment);
initLoader(renderer);

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
let holograms = null;
let pixel = null; // màn pixel loa Divoom
let roomLife = null; // robot hút bụi, ghế/cây chuyển động, bàn phím — chạy sau intro
const particles = createParticles(
    scene,
    new THREE.Box3(new THREE.Vector3(...CONFIG.particles.min), new THREE.Vector3(...CONFIG.particles.max)),
    renderer.getPixelRatio(),
);
let introDone = false;
let exploring = false; // camera đang bay tới / đang xem một vật thể

const weather = createWeather(WEATHER);
const hud = createHud({ profile: PROFILE, trackTitle: CONFIG.music.title, getMusic: () => bgMusic });
const idleHint = createIdleHint(camera, controls, {
    canStart: () => introDone && !exploring && !document.body.classList.contains("popup-open"),
});

initLoadingScreen(ready, {
    name: PROFILE.name,
    role: PROFILE.role,
    visitor,
    onEnter() {
        track("enter");
        // Phát nhạc sau khi người dùng bấm Enter (trình duyệt chặn autoplay có tiếng)
        bgMusic = new Audio();
        const { sources } = CONFIG.music;
        bgMusic.src = (sources.find((s) => bgMusic.canPlayType(s.type)) ?? sources.at(-1)).src;
        bgMusic.loop = true;
        bgMusic.volume = CONFIG.music.volume;
        try {
            audioLevel = createAudioLevel(bgMusic);
        } catch (err) {
            console.warn("Không bật được Web Audio, LED sẽ không nháy theo nhạc:", err);
        }
        bgMusic.play().catch((err) => console.warn("Autoplay bị chặn:", err));

        // Lắp ráp căn phòng; xong thì hiện HUD, hotspot, cho phép tương tác
        playIntro({ scene, camera, controls, renderer, bloom, reduced: prefersReducedMotion() }).then(() => {
            introDone = true;
            roomLife?.start();
            holograms?.reveal();
            particles.show();
            roomControl.show();
            weather.show();
            document.body.classList.add("is-ready"); // hiện dock menu
            hud.show();
            idleHint.schedule();
            hotspots?.show();
            interactions.setEnabled(true);
            if (visitor) showWelcome(visitor);
        });
    },
});

const workPopup = createWorkPopup(WORK, LINKS.portfolioPdf);
createAboutPopup(PROFILE, ABOUT, LINKS.cv);
createContactPopup(PROFILE, CONTACT, LINKS);
createHobbyPopup(HOBBY);
createPipelinePopup(PIPELINE);
createArcade();
setMutedSource(() => bgMusic?.muted ?? false); // tắt nhạc ở HUD thì mini game cũng im
const menu = initMenu({
    "#mywork": (item) => openPopup("work", item),
    "#about": (item) => openPopup("about", item),
    "#hobby": (item) => openPopup("hobby", item),
    "#contact": (item) => openPopup("contact", item),
});

// Bấm vật thể / hotspot: camera bay tới → mở popup → đóng popup thì camera bay về
async function visit(id, objects) {
    const spot = CONFIG.spots[id];
    track("click", `spot-${id}`);
    exploring = true;
    idleHint.stop();
    interactions.setEnabled(false);
    roomLife?.setInteractive(false);
    hotspots.hide();
    await focus.focus(objects, new THREE.Vector3(...spot.view), spot.fill ? { fill: spot.fill } : undefined);
    openPopup(spot.popup, null, {
        onClosed: async () => {
            await focus.reset();
            exploring = false;
            hotspots.show();
            interactions.setEnabled(true);
            roomLife?.setInteractive(true);
        },
    });
}

ready.then(async () => {
    const [room, monitor, casePC, social] = await Promise.all(
        [tasks.room, tasks.monitor, tasks.casePC, tasks.social].map((t) => t.catch(() => null))
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
        // Máy Switch nằm sẵn trong room_portfolio.glb (màn hình, dock, 2 Joy-Con)
        switch: room && ["Screen", "Dock", "Left_ctrl", "Right_ctrl"].map((n) => room.getObjectByName(n)).filter(Boolean),
        // Loa Divoom (Ditoo): thân, màn pixel, núm, các phím cơ
        divoom: room && meshesOf(room).filter((m) => ["Body", "Display", "Control"].includes(m.name) || m.name.startsWith("key_cap")),
        // Chồng sách trên 2 hộp dưới bàn (sách trên kệ tường thuộc spot "shelf")
        books: room && ["Book_01", "Book_03", "Book_06"].map((n) => room.getObjectByName(n)).filter(Boolean),
    };

    // Logo mạng xã hội đã có hover/click riêng (mở link) nên chỉ gắn hotspot, không đăng ký tương tác
    if (monitor) interactions.register("monitor", meshesOf(monitor.root), () => visit("monitor", objects.monitor));
    if (casePC) interactions.register("casePC", meshesOf(casePC.root), () => visit("casePC", objects.casePC));
    if (objects.switch?.length) interactions.register("switch", objects.switch, () => visit("switch", objects.switch));
    if (objects.books?.length) interactions.register("books", objects.books, () => visit("books", objects.books));

    if (room) {
        const robot = createCleanerRobot(room);
        const motion = createRoomMotion(room);
        const keyboard = room.getObjectByName("Keyboard");
        const keyboardHover = keyboard && createKeyboardHover(keyboard, camera, canvas);
        updaters.push(motion.update);
        if (keyboardHover) updaters.push(keyboardHover.update);
        roomLife = {
            start() {
                const reduced = prefersReducedMotion();
                if (reduced) robot?.setAuto(false); // giảm chuyển động: robot chỉ chạy khi bấm Clean
                robot?.start();
                motion.start({ reduced });
                keyboardHover?.setEnabled(true);
            },
            /** Tắt hover bàn phím khi camera bay tới vật thể / popup mở. */
            setInteractive: (value) => keyboardHover?.setEnabled(value),
        };
        if (introDone) roomLife.start();
        if (robot) roomControl.attachRobot(robot);

        // Ghế: bấm → xoay một vòng. Kệ chứng chỉ/sách và poster: bay camera tới rồi mở popup như hotspot
        if (motion.chairMeshes.length) interactions.register("chair", motion.chairMeshes, () => motion.spinChair());
        const byName = (names) => names.map((n) => room.getObjectByName(n)).filter(Boolean);
        const shelf = byName(["Certificate", "Book_02", "Book_05", "Book_07"]);
        const poster = byName(["Poster"]);
        if (shelf.length) interactions.register("shelf", shelf, () => visit("shelf", shelf));
        if (poster.length) interactions.register("poster", poster, () => visit("poster", poster));
    }

    const displayMesh = room?.getObjectByName("Display");
    if (displayMesh) {
        pixel = createPixelDisplay(displayMesh, { getBands: () => audioLevel?.getBands() });
        createPixelPopup(pixel, () => audioLevel?.getBands());
        roomControl.attachPixel(pixel);
        interactions.register("divoom", objects.divoom, () => visit("divoom", objects.divoom));
    }

    hotspots = createHotspots(camera, Object.entries(objects)
        .filter(([, objs]) => objs?.length)
        .map(([id, objs]) => ({ id, label: CONFIG.spots[id].label, objects: objs, onClick: () => visit(id, objs) })));
    // Rê chuột lên vật thể / hotspot → hotspot và nút menu tương ứng cùng sáng
    const menuLinkOf = (id) => ({ work: "#mywork", about: "#about", contact: "#contact", hobby: "#hobby" })[CONFIG.spots[id]?.popup] ?? null;
    // Hologram: bấm → mở thẳng trang chi tiết dự án; hover do shader của hologram tự xử lý (không phủ lớp sáng)
    holograms = createHolograms(scene, WORK, CONFIG.holograms.slots);
    holograms.screens.forEach((screen) => {
        const projectId = screen.userData.projectId;
        interactions.register(`holo-${projectId}`, [screen], () => {
            track("click", `holo-${projectId}`);
            openPopup("work", null);
            workPopup.showProject(projectId);
        }, { glow: false });
    });
    if (introDone) holograms.reveal();

    interactions.onHover((id) => {
        holograms.setHover(id?.startsWith("holo-") ? id.slice(5) : null);
        hotspots.setActive(id);
        menu.setActive(menuLinkOf(id));
    });
    hotspots.onHover((id, on) => {
        interactions.highlight(id, on);
        menu.setActive(on ? menuLinkOf(id) : null); // kệ mạng xã hội không có tương tác 3D riêng
    });
});

if (import.meta.env.DEV) window.__app = { scene, camera, controls, focus, gsap, renderer, updaters }; // debug: __app.gsap.globalTimeline.timeScale(0.2) để xem chậm

// ===== Render loop =====
// Bloom phải render cả cảnh thêm 1 lần mỗi frame → tắt trên điện thoại cho mượt
const bloom = CONFIG.bloom.enabled && !isMobile ? createBloom(renderer, CONFIG.bloom) : null;
const roomControl = createRoomControl({ renderer, bloom, particles });
const timer = new THREE.Timer();
timer.connect(document); // tạm dừng khi tab bị ẩn để delta không nhảy vọt lúc quay lại
// Máy yếu (nhất là điện thoại) → tự hạ độ phân giải render cho giữ FPS
const quality = createAdaptiveQuality(renderer, (ratio) => particles.setPixelRatio(ratio));
renderer.setAnimationLoop(() => {
    // Không truyền timestamp của rAF: nó có thể sớm hơn lúc tạo timer → delta âm ở frame đầu
    timer.update();
    const delta = timer.getDelta();
    const level = audioLevel?.getLevel() ?? 0; // độ lớn nhạc 0 → 1 cho LED
    hud.updateBands(audioLevel?.getBands());
    // Popup đang che cảnh 3D → ngừng render (giữ khung hình cuối), nhường GPU cho popup / mini game
    // (popup "live" — vd. chọn hình loa Divoom — vẫn render để thấy thay đổi trực tiếp)
    const covered = document.body.classList.contains("popup-open") && !document.body.classList.contains("popup-live");
    suspendVideos(covered); // cảnh bị che → dừng giải mã video màn hình / hologram
    if (covered) return;
    if (introDone) quality.update(delta); // bỏ qua lúc intro: đang tải / dựng phòng nên FPS chưa phản ánh đúng
    updaters.forEach((update) => update(delta, level));
    pixel?.update(delta);
    controls.update(); // cần gọi mỗi frame vì bật damping
    renderer.render(scene, camera);
    bloom?.render(scene, camera);
    hotspots?.update();
    holograms?.update(delta, camera);
    particles.update(delta, level);
});

// ===== Resize =====
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    quality.reset(); // giữ bậc độ phân giải hiện tại
    bloom?.setSize(window.innerWidth, window.innerHeight);
});
