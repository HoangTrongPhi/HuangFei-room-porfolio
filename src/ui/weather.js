// ui/weather.js
// Panel thời tiết hôm nay kiểu "trạm thời tiết neon" (góc trái dưới, trên widget nhạc):
// icon vẽ bằng canvas có chuyển động (mặt trời xoay tia, trăng + sao, mây trôi, mưa rơi, chớp loé, sương mù),
// nhiệt độ hiện tại, cao/thấp trong ngày, độ ẩm, gió, biểu đồ 12 giờ tới (nhiệt độ + khả năng mưa).
// Dữ liệu: Open-Meteo (không cần API key), làm mới mỗi 15 phút.
import gsap from "gsap";
import { h } from "./dom.js";
import { makeDraggable } from "./draggable.js";

const REFRESH_MS = 15 * 60 * 1000;
const HOURS = 12;

// Mã thời tiết WMO → nhãn + kiểu icon
function describe(code, isDay) {
    if (code === 0) return { label: isDay ? "Clear sky" : "Clear night", icon: isDay ? "sun" : "moon" };
    if (code <= 2) return { label: "Partly cloudy", icon: isDay ? "sun-cloud" : "moon-cloud" };
    if (code === 3) return { label: "Overcast", icon: "cloud" };
    if (code <= 48) return { label: "Foggy", icon: "fog" };
    if (code <= 57) return { label: "Drizzle", icon: "rain" };
    if (code <= 67) return { label: "Rain", icon: "rain" };
    if (code <= 77) return { label: "Snow", icon: "snow" };
    if (code <= 82) return { label: "Showers", icon: "rain" };
    return { label: "Thunderstorm", icon: "storm" };
}

/**
 * @param {{city:string, latitude:number, longitude:number}} place
 */
export function createWeather(place) {
    const icon = h("canvas", { class: "wx-icon", width: 128, height: 128, "aria-hidden": "true" });
    const temp = h("strong", { class: "wx-temp" }, "--°");
    const label = h("span", { class: "wx-label" }, "Loading…");
    const range = h("span", {});
    const humidity = h("span", {});
    const wind = h("span", {});
    const chart = h("canvas", { class: "wx-chart", width: 440, height: 84, "aria-hidden": "true" });

    const panel = h("aside", { class: "weather", "aria-label": `Weather today in ${place.city}` },
        h("div", { class: "wx-head" }, h("span", {}, `// weather · ${place.city}`), h("span", { class: "wx-live" }, h("i"), "live")),
        h("div", { class: "wx-main" },
            icon,
            h("div", { class: "wx-now" }, temp, label),
        ),
        h("div", { class: "wx-meta" }, range, humidity, wind),
        chart,
    );
    document.body.append(panel);
    makeDraggable(panel, { key: "weather" });

    // ===== Icon động =====
    const ictx = icon.getContext("2d");
    let iconType = "sun";
    let raf = 0;
    let started = false;

    function drawIcon(t) {
        const s = 128;
        ictx.clearRect(0, 0, s, s);
        ictx.save();
        ictx.lineCap = "round";

        const sun = (x, y, r) => {
            ictx.shadowColor = "#ffd166";
            ictx.shadowBlur = 18;
            ictx.fillStyle = "#ffd166";
            ictx.beginPath(); ictx.arc(x, y, r, 0, Math.PI * 2); ictx.fill();
            ictx.strokeStyle = "#ffd166";
            ictx.lineWidth = 4;
            for (let i = 0; i < 8; i++) {
                const a = t * 0.6 + (i * Math.PI) / 4;
                const len = r * (0.45 + 0.12 * Math.sin(t * 3 + i));
                ictx.beginPath();
                ictx.moveTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7));
                ictx.lineTo(x + Math.cos(a) * (r + 7 + len), y + Math.sin(a) * (r + 7 + len));
                ictx.stroke();
            }
        };
        const moon = (x, y, r) => {
            // Sao nhấp nháy quanh trăng khuyết
            [[24, 30], [100, 24], [96, 92], [30, 96], [70, 16]].forEach(([sx, sy], i) => {
                ictx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i));
                ictx.fillStyle = "#e8f6ff";
                ictx.beginPath(); ictx.arc(sx, sy, 2, 0, Math.PI * 2); ictx.fill();
            });
            ictx.globalAlpha = 1;
            ictx.shadowColor = "#b2e7ff";
            ictx.shadowBlur = 18;
            ictx.fillStyle = "#d9f2ff";
            ictx.beginPath(); ictx.arc(x, y, r, 0, Math.PI * 2); ictx.fill();
            ictx.globalCompositeOperation = "destination-out";
            ictx.beginPath(); ictx.arc(x + r * 0.5, y - r * 0.35, r * 0.9, 0, Math.PI * 2); ictx.fill();
            ictx.globalCompositeOperation = "source-over";
        };
        const cloud = (x, y, k, color = "#b2c8e6") => {
            ictx.shadowColor = "#66e0ff";
            ictx.shadowBlur = 12;
            ictx.fillStyle = color;
            ictx.beginPath();
            ictx.arc(x - 18 * k, y, 14 * k, 0, Math.PI * 2);
            ictx.arc(x, y - 10 * k, 19 * k, 0, Math.PI * 2);
            ictx.arc(x + 20 * k, y, 14 * k, 0, Math.PI * 2);
            ictx.rect(x - 18 * k, y, 38 * k, 14 * k);
            ictx.fill();
        };
        const drift = Math.sin(t * 0.8) * 5;

        switch (iconType) {
            case "sun": sun(64, 64, 22); break;
            case "moon": moon(62, 62, 24); break;
            case "sun-cloud": sun(48, 46, 17); cloud(72 + drift, 80, 1); break;
            case "moon-cloud": moon(48, 46, 18); cloud(72 + drift, 82, 1); break;
            case "cloud": cloud(54 + drift, 58, 0.9, "#8ea3c0"); cloud(70 - drift, 76, 1.1); break;
            case "fog":
                ictx.strokeStyle = "#b2c8e6";
                ictx.lineWidth = 6;
                [40, 58, 76, 94].forEach((y, i) => {
                    const off = Math.sin(t * 1.2 + i) * 10;
                    ictx.globalAlpha = 0.5 + 0.12 * i;
                    ictx.beginPath(); ictx.moveTo(24 + off, y); ictx.lineTo(104 + off, y); ictx.stroke();
                });
                break;
            case "rain":
            case "storm":
            case "snow": {
                cloud(64 + drift, 50, 1.05, iconType === "storm" ? "#6f7f9c" : "#b2c8e6");
                ictx.shadowBlur = 8;
                for (let i = 0; i < 6; i++) {
                    const x = 34 + i * 12;
                    const y = 74 + ((t * 70 + i * 23) % 44);
                    if (iconType === "snow") {
                        ictx.fillStyle = "#e8f6ff";
                        ictx.beginPath(); ictx.arc(x + Math.sin(t * 2 + i) * 3, y, 3, 0, Math.PI * 2); ictx.fill();
                    } else {
                        ictx.strokeStyle = "#66e0ff";
                        ictx.shadowColor = "#66e0ff";
                        ictx.lineWidth = 3;
                        ictx.beginPath(); ictx.moveTo(x, y); ictx.lineTo(x - 4, y + 10); ictx.stroke();
                    }
                }
                // Chớp: loé ngắn mỗi ~3 giây
                if (iconType === "storm" && t % 3 < 0.18) {
                    ictx.fillStyle = "#ffd166";
                    ictx.shadowColor = "#ffd166";
                    ictx.shadowBlur = 24;
                    ictx.beginPath();
                    ictx.moveTo(66, 60); ictx.lineTo(54, 86); ictx.lineTo(64, 86); ictx.lineTo(56, 110); ictx.lineTo(78, 78); ictx.lineTo(67, 78); ictx.lineTo(74, 60);
                    ictx.fill();
                }
                break;
            }
        }
        ictx.restore();
    }

    function loop(now) {
        drawIcon(now / 1000);
        raf = requestAnimationFrame(loop);
    }
    // Chỉ chạy animation khi tab đang hiển thị
    document.addEventListener("visibilitychange", () => {
        cancelAnimationFrame(raf);
        if (started && !document.hidden) raf = requestAnimationFrame(loop);
    });

    // ===== Biểu đồ 12 giờ =====
    function drawChart(times, temps, rain) {
        const c = chart.getContext("2d");
        const W = chart.width;
        const H = chart.height;
        c.clearRect(0, 0, W, H);
        const top = 14;
        const bottom = H - 18;
        const min = Math.min(...temps) - 1;
        const max = Math.max(...temps) + 1;
        const x = (i) => 14 + (i / (temps.length - 1)) * (W - 28);
        const y = (v) => bottom - ((v - min) / (max - min)) * (bottom - top);

        // Cột khả năng mưa
        rain.forEach((p, i) => {
            if (!p) return;
            c.fillStyle = `rgba(102,224,255,${0.15 + (p / 100) * 0.45})`;
            const hgt = (p / 100) * (bottom - top);
            c.fillRect(x(i) - 6, bottom - hgt, 12, hgt);
        });

        // Đường nhiệt độ neon
        const grad = c.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, "#ffd166");
        grad.addColorStop(1, "#ff6bd6");
        c.strokeStyle = grad;
        c.lineWidth = 3;
        c.shadowColor = "#ff6bd6";
        c.shadowBlur = 10;
        c.beginPath();
        temps.forEach((v, i) => (i ? c.lineTo(x(i), y(v)) : c.moveTo(x(i), y(v))));
        c.stroke();
        c.shadowBlur = 0;

        // Nhãn giờ + nhiệt độ ở vài mốc
        c.font = "18px ui-monospace, Consolas, monospace";
        c.textAlign = "center";
        temps.forEach((v, i) => {
            if (i % 3) return;
            c.fillStyle = "#e8f6ff";
            c.beginPath(); c.arc(x(i), y(v), 3.5, 0, Math.PI * 2); c.fill();
            c.fillStyle = "#9fb6d6";
            c.fillText(`${Math.round(v)}°`, x(i), y(v) - 9 < 12 ? y(v) + 22 : y(v) - 9);
            c.fillStyle = "#5f7fa6";
            c.fillText(i === 0 ? "now" : times[i].slice(11, 13) + "h", x(i), H - 2);
        });
    }

    // ===== Dữ liệu =====
    async function refresh() {
        const url = "https://api.open-meteo.com/v1/forecast"
            + `?latitude=${place.latitude}&longitude=${place.longitude}`
            + "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day"
            + "&hourly=temperature_2m,precipitation_probability"
            + "&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2";
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            const cur = d.current;
            const info = describe(cur.weather_code, cur.is_day);
            iconType = info.icon;
            temp.textContent = `${Math.round(cur.temperature_2m)}°`;
            label.textContent = info.label;
            range.textContent = `H ${Math.round(d.daily.temperature_2m_max[0])}° · L ${Math.round(d.daily.temperature_2m_min[0])}°`;
            humidity.textContent = `💧 ${cur.relative_humidity_2m}%`;
            wind.textContent = `🌬 ${Math.round(cur.wind_speed_10m)} km/h`;

            // 12 giờ kể từ giờ hiện tại (giờ địa phương của thành phố — chuỗi ISO so sánh được trực tiếp)
            const start = Math.max(0, d.hourly.time.findIndex((t) => t >= cur.time.slice(0, 13)));
            const slice = (arr) => arr.slice(start, start + HOURS);
            drawChart(slice(d.hourly.time), slice(d.hourly.temperature_2m), slice(d.hourly.precipitation_probability));
            panel.classList.remove("is-offline");
        } catch {
            label.textContent = "Weather offline";
            panel.classList.add("is-offline");
        }
    }

    return {
        show() {
            started = true;
            refresh();
            setInterval(refresh, REFRESH_MS);
            raf = requestAnimationFrame(loop);
            gsap.from(panel, { y: 20, opacity: 0, duration: 0.6, delay: 0.25, ease: "power3.out", clearProps: "transform,opacity" });
        },
    };
}
