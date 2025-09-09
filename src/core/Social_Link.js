// core/Social_Link.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

/**
 * Load Social_Link.glb, tách từng phần tử thành mesh độc lập,
 * Hover = tiến ra phía trước + scale to, rời chuột = về lại ban đầu,
 * Click = mở link tương ứng.
 */
export async function loadSocialLinks(scene, modelPath = "/models/Social_Link.glb") {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                const root = gltf.scene;
                const meshes = {};

                // Map tên → link bạn muốn
                const linkMap = {
                    Artstation: "https://www.artstation.com/hoangphi",
                    Facebook: "https://www.facebook.com/phi.hoang.568294/",
                    Youtube: "https://www.youtube.com/@phihoang1825/videos",
                    Github: "https://github.com/HoangTrongPhi",
                };

                root.traverse((child) => {
                    if (child.isMesh) {
                        const clone = child.clone(true);
                        clone.material = child.material.clone();

                        // scale ban đầu
                        clone.scale.set(0.01, 0.01, 0.01);
                        clone.userData.initialScale = clone.scale.clone();
                        clone.userData.initialPosition = clone.position.clone();

                        scene.add(clone);
                        meshes[child.name] = clone;
                    }
                });

                function setupInteractions(renderer, camera) {
                    const raycaster = new THREE.Raycaster();
                    const pointer = new THREE.Vector2();
                    let hovered = null;

                    // Hover
                    function onPointerMove(event) {
                        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
                        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

                        raycaster.setFromCamera(pointer, camera);
                        const intersects = raycaster.intersectObjects(Object.values(meshes));

                        if (intersects.length > 0) {
                            const target = intersects[0].object;
                            if (hovered !== target) {
                                if (hovered) resetMesh(hovered);
                                hovered = target;

                                gsap.killTweensOf([target.scale, target.position]);

                                // scale lên
                                gsap.to(target.scale, {
                                    x: 0.013,
                                    y: 0.013,
                                    z: 0.013,
                                    duration: 0.45,
                                    ease: "back.out(2)",
                                });

                                // tiến ra phía trước
                                gsap.to(target.position, {
                                    z: target.userData.initialPosition.z + 0.02,
                                    duration: 0.45,
                                    ease: "power2.out",
                                });
                            }
                            document.body.style.cursor = "pointer";
                        } else {
                            if (hovered) {
                                resetMesh(hovered);
                                hovered = null;
                            }
                            document.body.style.cursor = "default";
                        }
                    }

                    // Click
                    function onClick(event) {
                        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
                        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

                        raycaster.setFromCamera(pointer, camera);
                        const intersects = raycaster.intersectObjects(Object.values(meshes));

                        if (intersects.length > 0) {
                            const clicked = intersects[0].object;

                            // Tìm link phù hợp
                            for (const key in linkMap) {
                                if (clicked.name.includes(key)) {
                                    window.open(linkMap[key], "_blank");
                                    break;
                                }
                            }
                        }
                    }

                    function resetMesh(mesh) {
                        gsap.killTweensOf([mesh.scale, mesh.position]);

                        gsap.to(mesh.scale, {
                            x: mesh.userData.initialScale.x,
                            y: mesh.userData.initialScale.y,
                            z: mesh.userData.initialScale.z,
                            duration: 0.4,
                            ease: "power2.inOut",
                        });

                        gsap.to(mesh.position, {
                            x: mesh.userData.initialPosition.x,
                            y: mesh.userData.initialPosition.y,
                            z: mesh.userData.initialPosition.z,
                            duration: 0.4,
                            ease: "power2.inOut",
                        });
                    }

                    window.addEventListener("mousemove", onPointerMove);
                    window.addEventListener("click", onClick);
                }

                resolve({ meshes, setupInteractions });
            },
            undefined,
            (err) => reject(err)
        );
    });
}
