// core/cleanerRobot.js
// Robot hút bụi: rời dock, chạy một vòng quanh sàn (né ghế, bàn, hộp), quay đầu rồi lùi vào dock; nghỉ rồi lặp lại.
// Trong room_portfolio.glb robot và dock là MỘT mesh "Cleaner_Robot" → lúc load tách phần đĩa robot
// (khối hình học rời, thấp nhất) thành mesh riêng có pivot ở tâm đáy để di chuyển/xoay được.
import * as THREE from "three";
import gsap from "gsap";
import { createBlobShadow } from "./blobShadow.js";
import { findIslands } from "../utils/meshIslands.js";

// Toạ độ trong không gian của phòng (cm, trước khi scale 0.01). Đường đi tránh chân ghế,
// tủ ngăn kéo và chồng hộp dưới bàn; điểm cuối nằm thẳng trước dock để lùi vào.
const PATH = [
    [10.5, -4], [13.5, -1], [14, 6], [12, 12], [6, 14], [1.5, 13],
    [1, 9], [5, 7.5], [11, 8], [13.5, 3], [12, -2], [9.4, -4.5],
];
const SPEED = 3;        // cm/s
const REST = 18;        // giây nằm trong dock giữa hai vòng chạy
const TURN_TIME = 1.2;  // giây quay đầu trước khi lùi vào dock

/**
 * @param {THREE.Object3D} room - root của room_portfolio.glb
 * @returns {{start: () => void} | null} null nếu không tìm thấy robot
 */
export function createCleanerRobot(room) {
    const source = room.getObjectByName("Cleaner_Robot");
    if (!source?.geometry.index) return null;

    const robot = splitRobot(source);
    if (!robot) return null;
    const dock = robot.position.clone();

    const shadow = createBlobShadow(robot.userData.radius * 1.25, 0.5);
    shadow.position.y = -0.04; // ngay trên mặt sàn, dưới đáy robot
    robot.add(shadow);

    const points = [dock, ...PATH.map(([x, z]) => new THREE.Vector3(x, dock.y, z))];
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const exit = points.at(-1);
    const tangent = new THREE.Vector3();
    const state = { t: 0 };

    // Hướng mũi robot theo tiếp tuyến đường đi (mũi robot = +Z cục bộ, hướng ra khỏi dock).
    // reverse: đang chạy ngược đường về dock → mũi quay theo chiều ngược lại
    const follow = (reverse = false) => {
        curve.getPointAt(state.t, robot.position);
        curve.getTangentAt(state.t, tangent);
        robot.rotation.y = Math.atan2(tangent.x, tangent.z) + (reverse ? Math.PI : 0);
    };

    const baseRot = robot.rotation.y;
    const facing = Math.atan2(exit.x - dock.x, exit.z - dock.z); // hướng từ dock nhìn ra
    curve.getTangentAt(0, tangent);
    const firstHeading = closestAngle(baseRot, Math.atan2(tangent.x, tangent.z));

    // Điều khiển từ Room control: chạy ngay / tạm dừng / về dock / tự chạy lại sau REST giây / tốc độ
    let run = null; // timeline đang chạy (một vòng hút bụi hoặc đường về dock)
    let rest = null; // hẹn giờ vòng tiếp theo
    let status = "docked"; // docked | cleaning | returning
    let auto = true;
    let speed = 1;
    const listeners = new Set();
    const emit = () => listeners.forEach((fn) => fn({ status, paused: !!run?.paused(), auto, speed }));

    function setRun(tl, next) {
        run?.kill();
        rest?.kill();
        run = tl.timeScale(speed);
        status = next;
        emit();
    }

    function finish() {
        run = null;
        status = "docked";
        robot.rotation.y = baseRot;
        if (auto) rest = gsap.delayedCall(REST, clean);
        emit();
    }

    /** Chạy một vòng (đang tạm dừng thì chạy tiếp). */
    function clean() {
        if (run?.paused()) return resume();
        if (status !== "docked") return;
        setRun(gsap.timeline({ onComplete: finish })
            .set(state, { t: 0 })
            .to(robot.rotation, { y: firstHeading, duration: 0.5, ease: "power1.inOut" }) // xoay nhẹ về hướng chạy
            .to(state, { t: 1, duration: curve.getLength() / SPEED, ease: "sine.inOut", onUpdate: follow })
            .addLabel("home")
            // Đang nhìn về dock → quay đầu (mũi ra ngoài) rồi lùi thẳng vào
            .to(robot.rotation, { y: () => closestAngle(robot.rotation.y, facing), duration: TURN_TIME, ease: "power1.inOut" })
            .to(robot.position, { x: dock.x, z: dock.z, duration: exit.distanceTo(dock) / SPEED + 0.6, ease: "power1.out" }), "cleaning");
    }

    /** Về dock ngay: chạy ngược lại đoạn đường đã đi (không đâm vào đồ đạc). */
    function goHome() {
        if (status === "docked") return;
        if (status === "cleaning" && run.time() >= run.labels.home) { // đã tới đoạn lùi vào dock
            run.paused(false);
            status = "returning";
            return emit();
        }
        if (status === "returning") return resume();
        const back = closestAngle(robot.rotation.y, robot.rotation.y + Math.PI);
        setRun(gsap.timeline({ onComplete: finish })
            .to(robot.rotation, { y: back, duration: TURN_TIME * 0.6, ease: "power1.inOut" })
            .to(state, { t: 0, duration: Math.max(0.5, (state.t * curve.getLength()) / SPEED), ease: "sine.inOut", onUpdate: () => follow(true) })
            .to(robot.rotation, { y: () => closestAngle(robot.rotation.y, baseRot), duration: TURN_TIME, ease: "power1.inOut" }), "returning");
    }

    function pause() {
        run?.pause();
        emit();
    }
    function resume() {
        run?.resume();
        emit();
    }

    return {
        /** Bật vòng lặp tự động sau intro (vòng đầu sau 4 giây). */
        start() {
            gsap.to(shadow.material, { opacity: shadow.userData.opacity, duration: 0.6 });
            rest?.kill();
            if (auto) rest = gsap.delayedCall(4, clean);
        },
        clean,
        goHome,
        pause,
        resume,
        setAuto(value) {
            auto = value;
            rest?.kill();
            if (auto && status === "docked") rest = gsap.delayedCall(REST, clean);
            emit();
        },
        setSpeed(value) {
            speed = value;
            run?.timeScale(speed);
            emit();
        },
        /** @param {(s: {status: string, paused: boolean, auto: boolean, speed: number}) => void} fn */
        onChange(fn) {
            listeners.add(fn);
            emit();
        },
    };
}

// Góc tương đương với `target` gần `current` nhất (tránh xoay vòng 360° khi tween)
function closestAngle(current, target) {
    const TAU = Math.PI * 2;
    return current + ((((target - current) % TAU) + TAU + Math.PI) % TAU) - Math.PI;
}

/**
 * Tách khối đĩa robot khỏi mesh dock. Trả về mesh robot (đã thêm vào cùng cha, đặt đúng chỗ cũ).
 * @param {THREE.Mesh} mesh
 */
function splitRobot(mesh) {
    const geometry = mesh.geometry;
    const index = geometry.index.array;
    const position = geometry.attributes.position;
    const islands = findIslands(geometry);
    if (islands.length < 2) return null;

    // Đĩa robot = khối có đỉnh cao nhất thấp nhất (dock là khối cao)
    const maxY = (island) => Math.max(...island.map((v) => position.getY(v)));
    const robotVertices = new Set(islands.reduce((a, b) => (maxY(b) < maxY(a) ? b : a)));

    const robotTris = [];
    const dockTris = [];
    for (let i = 0; i < index.length; i += 3) {
        (robotVertices.has(index[i]) ? robotTris : dockTris).push(index[i], index[i + 1], index[i + 2]);
    }
    geometry.setIndex(dockTris);

    // Geometry mới chỉ chứa đỉnh của robot, dời về pivot = tâm đáy
    const remap = new Map();
    robotTris.forEach((v) => remap.has(v) || remap.set(v, remap.size));
    const robotGeo = new THREE.BufferGeometry();
    for (const [name, attr] of Object.entries(geometry.attributes)) {
        const out = new THREE.BufferAttribute(new Float32Array(remap.size * attr.itemSize), attr.itemSize, attr.normalized);
        remap.forEach((to, from) => {
            for (let k = 0; k < attr.itemSize; k++) out.setComponent(to, k, attr.getComponent(from, k));
        });
        robotGeo.setAttribute(name, out);
    }
    robotGeo.setIndex(robotTris.map((v) => remap.get(v)));
    robotGeo.computeBoundingBox();
    const box = robotGeo.boundingBox;
    const pivot = new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2);
    robotGeo.translate(-pivot.x, -pivot.y, -pivot.z);
    robotGeo.computeBoundingSphere();

    const robot = new THREE.Mesh(robotGeo, mesh.material);
    robot.name = "Cleaner_Robot_Bot";
    robot.position.copy(pivot).applyMatrix4(mesh.matrix); // mesh gốc nằm ở gốc toạ độ của cha
    robot.userData.radius = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
    mesh.parent.add(robot);
    return robot;
}
