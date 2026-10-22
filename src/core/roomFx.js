// core/roomFx.js — trạng thái hiệu ứng phòng dùng chung, do bảng điều khiển (ui/roomControl.js) thay đổi.
// LED tường, LED case, hạt sáng, hologram đọc mỗi frame.
import * as THREE from "three";

export const roomFx = {
    /** null = cầu vồng tự chuyển màu (mặc định); THREE.Color = một màu cố định */
    ledColor: null,
    /** Party mode: LED đổi màu nhanh hơn, nháy theo nhạc mạnh hơn */
    party: false,
    /** Hệ số độ sáng LED (Yeelight trên tường + LED quạt/RAM trong case): 0 = tắt; mặc định 5% cho dịu mắt */
    ledIntensity: 0.05,
    /** Màu chủ đạo hiện tại (cho hạt sáng/hologram); cập nhật bởi LED tường mỗi frame */
    accent: new THREE.Color("#66e0ff"),
};
