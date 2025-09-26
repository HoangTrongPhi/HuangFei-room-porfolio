import "./style.scss";
import "./View_UI.css";
import "./Loading.css";

import * as THREE from "three";
import gsap from "gsap";

import { camera, controls } from "./core/camera.js";
import { loadEnvironmentMap, applyEnvironment, setupLights } from "./core/light.js";
import { loadSceneModel, loadLightModel } from "./core/models.js";
import { loadRGBleds } from "./core/RGB_led.js";
import { loadCasePC } from "./core/Case_PC.js";
import { loadMonitorScreens } from "./core/screen_video.js";
import { loadSocialLinks } from "./core/Social_Link.js";

// ================== CONFIG ==================
const CONFIG = {
    renderer: {
        background: "#000000",
        toneMapping: THREE.LinearToneMapping,
        toneMappingExposure: 0.0003,
        shadowType: THREE.PCFSoftShadowMap,
    },
    lights: {
        "Point":    { intensity: 0,  color: "#ffffff" },
        "Point.001":{ intensity: 10, color: "#dadada" },
        "Point.002":{ intensity: 20, color: "#fd38fd" },
        "Point.003":{ intensity: 20, color: "#69f6de" },
        "Spot":     { intensity: 40, color: "#ededed", penumbra: 0.1 },
        "Spot.001": { intensity: 80, color: "#007fff", penumbra: 0.1 },
        "Spot.002": { intensity: 80, color: "#00aaff", penumbra: 0.1 },
    },
    screens: {
        Screen_01: { flipX: false, flipY: true },
        Screen_02: { flipX: false, flipY: true },
        Screen_03: { flipX: true,  flipY: true },
    },
    aioDisplay: { flipX: false, flipY: true }
};
// =============================================

// Scene, Renderer
const canvas = document.querySelector("#experience-canvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.renderer.background);

const sizes = { width: window.innerWidth, height: window.innerHeight };

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = CONFIG.renderer.toneMapping;
renderer.toneMappingExposure = CONFIG.renderer.toneMappingExposure;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = CONFIG.renderer.shadowType;

// EnvMap
const envMap = loadEnvironmentMap({ basePath: "/textures/skybox/" });
applyEnvironment(scene, envMap, { useAsBackground: false });

// ====== Animations ======
let animateLEDs = () => {};
let animateCasePC = () => {};
let updateMonitorVideo = () => {};
let animateSocial = () => {};
let viewUI = null;

// Loading UI
const loadingScreen = document.querySelector(".loading-screen");
const loadingButton = document.querySelector(".loading-screen-button");
const progressBar = document.querySelector(".loading-progress");
const loadingHint = document.querySelector(".loading-hint");
const loadingTitle = document.querySelector(".loading-title");

// Background music biến toàn cục
let bgMusic;

// Fake loading (3 giây với progress bar)
let progress = 0;
const interval = setInterval(() => {
    progress += 1;
    progressBar.style.width = `${progress}%`;

    if (progress >= 100) {
        clearInterval(interval);

        loadingButton.textContent = "Enter!";
        loadingButton.classList.add("active");
        loadingButton.style.cursor = "pointer";
        loadingButton.style.background = "#a4c0da";
        loadingButton.style.color = "#193e55";
        loadingHint.classList.add("active");

        function startIntro() {
            // fade out title, bar, hint
            gsap.to([loadingTitle, progressBar.parentElement, loadingHint], {
                opacity: 0,
                duration: 0.6,
                ease: "power2.inOut"
            });

            gsap.to(loadingScreen, {
                y: "200vh",
                duration: 1.2,
                delay: 0.3,
                ease: "back.in(0.8)",
                onComplete: () => {
                    loadingScreen.remove();

                    // ===== Background Music =====
                    bgMusic = new Audio("/music/LittlerootTown_Pokemon.ogg");
                    bgMusic.loop = true;
                    bgMusic.volume = 0.6;
                    bgMusic.muted = false;
                    bgMusic.play().catch(err => {
                        console.warn("Autoplay bị chặn:", err);
                    });
                    // ============================

                    // Intro animation
                    scene.traverse(obj => {
                        if (obj.isMesh) {
                            if (obj.name.toLowerCase().includes("background")) return;

                            if (!obj.userData.originalPosition) {
                                obj.userData.originalPosition = obj.position.clone();
                            }
                            if (!obj.userData.originalScale) {
                                obj.userData.originalScale = obj.scale.clone();
                            }

                            const randomX = (Math.random() - 0.8) * 20;
                            const randomY = (Math.random() - 0.8) * 20;
                            const randomZ = (Math.random() - 0.8) * 20;

                            obj.position.set(randomX, randomY, randomZ);
                            obj.scale.set(0, 0, 0);

                            gsap.to(obj.position, {
                                x: obj.userData.originalPosition.x,
                                y: obj.userData.originalPosition.y,
                                z: obj.userData.originalPosition.z,
                                duration: 1.5,
                                delay: Math.random() * 0.8,
                                ease: "power3.out"
                            });

                            gsap.to(obj.scale, {
                                x: obj.userData.originalScale.x,
                                y: obj.userData.originalScale.y,
                                z: obj.userData.originalScale.z,
                                duration: 1.2,
                                delay: Math.random() * 0.8,
                                ease: "back.out(1.7)"
                            });
                        }
                    });
                }
            });
        }

        loadingButton.addEventListener("click", startIntro);
    }
}, 30);

// Load Scene + CasePC + light + leds + Monitor
(async () => {
    try {
        const room = await loadSceneModel(scene);
        console.log("Đã load room_portfolio:", room);

        const { meshes: caseMeshes, updateLEDs } = await loadCasePC(
            scene, 12, 100, CONFIG.aioDisplay
        );
        animateCasePC = updateLEDs;

        const lightScene = await loadLightModel(scene);
        setupLights(lightScene, CONFIG.lights);

        animateLEDs = await loadRGBleds(scene);

        // Thay thế đoạn gọi loadMonitorScreens trong main.js bằng code sau:

        const { meshes: monitorScreens, updateVideos } = await loadMonitorScreens(
            scene,
            "/models/Monitor.glb",
            {
                Screen_01: "/media/monitor_1.mp4",
                Screen_02: "/media/monitor_2.mp4",
                Screen_03: "/media/monitor_3.mp4"
            },
            { screens: CONFIG.screens }
        );
        updateMonitorVideo = updateVideos;


        const { meshes: socialLinks, setupInteractions } = await loadSocialLinks(scene, "/models/Social_Link.glb");
        setupInteractions(renderer, camera);

        animate();
    } catch (err) {
        console.error("Lỗi load Scene/Case_PC/Light/Monitor:", err);
    }
})();

// Render loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    animateLEDs(delta);
    animateCasePC(delta);
    updateMonitorVideo();
    animateSocial(delta);
    controls?.update?.();
    renderer.render(scene, camera);
}

// Resize
window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Overlay click + popup effect cho Social Links
document.querySelectorAll("#ui-overlay .menu-item").forEach(item => {
    item.addEventListener("click", () => {
        const link = item.getAttribute("data-link");
        let targetUrl = "";

        if (link === "#mywork") {
            targetUrl = "https://drive.google.com/drive/folders/1TRbTRjFWWdXCvMOJLnZYTyfH07sgigSo";
        } else if (link === "#contact") {
            targetUrl = "https://www.linkedin.com/in/hoangtrongphi2511/";
        } else if (link === "#about") {
            targetUrl = "https://drive.google.com/file/d/1T7mFB0s8Ew5PUFrE00vDLYDXaAzSGkEX/view";
        }

        gsap.to(item, {
            scale: 5,
            duration: 0.2,
            ease: "back.out(2)",
            onComplete: () => {
                gsap.to(item, {
                    scale: 1,
                    duration: 0.2,
                    ease: "back.out(2)",
                    onComplete: () => {
                        if (targetUrl) {
                            window.open(targetUrl, "_blank");
                        }
                    }
                });
            }
        });
    });
});

// ====== SOUND TOGGLE BUTTON ======
const soundToggle = document.querySelector("#sound-toggle");
soundToggle?.addEventListener("click", () => {
    if (!bgMusic) return;
    if (bgMusic.muted) {
        bgMusic.muted = false;
        soundToggle.textContent = "🔊";
    } else {
        bgMusic.muted = true;
        soundToggle.textContent = "🔇";
    }
});
