// core/device.js — nhận biết điện thoại/máy tính bảng để giảm tải đồ hoạ.
// Màn cảm ứng (con trỏ "coarse") hoặc màn hẹp được coi là thiết bị di động.

export const isMobile =
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 720;

/** Có chuột / bút để rê (hover). Màn cảm ứng thì không → bỏ các hiệu ứng hover tốn tài nguyên */
export const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Điện thoại có DPR 3 nhưng render 1.5x là đủ nét, nhẹ hơn ~4 lần so với 3x */
export const maxPixelRatio = () => Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
