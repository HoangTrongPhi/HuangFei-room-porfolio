// content.js — nội dung hiển thị trên trang (popup Work / About / Contact / Hobby, lời chào theo ref).
// Muốn cập nhật portfolio thì chỉ cần sửa file này, không phải đụng vào code UI.
// Các mục đánh dấu TODO đang là dữ liệu mẫu — hãy thay bằng nội dung thật trước khi deploy.

export const PROFILE = {
    name: "Hoàng Trọng Phi",
    role: "Technical Artist",
    email: "", // TODO: điền email liên hệ; để trống thì popup Contact ẩn dòng email
    // Thẻ tên góc trái (HUD)
    status: "Available for work", // để trống thì ẩn dòng trạng thái
    location: "Vietnam",
    timeZone: "Asia/Ho_Chi_Minh", // giờ địa phương hiển thị trên thẻ tên
};

// Panel thời tiết (dữ liệu Open-Meteo, miễn phí, không cần key) — đổi sang thành phố bạn đang sống
export const WEATHER = {
    city: "Ho Chi Minh City", // TODO: tên hiển thị
    latitude: 10.82,
    longitude: 106.63,
};

export const LINKS = {
    portfolioPdf: "https://drive.google.com/file/d/1ew7p4o9LU8ICZqbRo4OMR2Ul2i61Cpie/view?usp=drive_link",
    cv: "https://drive.google.com/drive/u/0/folders/1TRbTRjFWWdXCvMOJLnZYTyfH07sgigSo",
    linkedin: "https://www.linkedin.com/in/hoangtrongphi2511/",
    artstation: "https://www.artstation.com/hoangphi",
    github: "https://github.com/HoangTrongPhi",
    youtube: "https://www.youtube.com/@phihoang1825/videos",
    facebook: "https://www.facebook.com/phi.hoang.568294/",
};

/**
 * Dự án trong popup MY WORK.
 * id    : chữ không dấu / số / dấu - (dùng làm tên sự kiện click trong admin: work-<id>)
 * video : file trong /public (tuỳ chọn) — rê chuột vào thẻ sẽ phát
 * link  : trang chi tiết bên ngoài (tuỳ chọn), vd. bài trên ArtStation
 */
export const WORK = [
    // TODO: thay tên, mô tả, tag và link của từng dự án
    {
        id: "room-portfolio",
        title: "3D Room Portfolio",
        tags: ["Modeling", "Lighting", "Web 3D"],
        description: "This interactive room — modeled in Maya, baked lighting, rendered in the browser with Three.js.",
        video: "/media/monitor_1.mp4",
        link: LINKS.github,
    },
    {
        id: "project-02",
        title: "Project 02",
        tags: ["Lighting"],
        description: "Replace with a short description of this project in src/content.js.",
        video: "/media/monitor_2.mp4",
        link: LINKS.artstation,
    },
    {
        id: "project-03",
        title: "Project 03",
        tags: ["Modeling"],
        description: "Replace with a short description of this project in src/content.js.",
        video: "/media/monitor_3.mp4",
        link: LINKS.artstation,
    },
    {
        id: "project-04",
        title: "Project 04",
        tags: ["Animation"],
        description: "Replace with a short description of this project in src/content.js.",
        video: "/media/itachi.mp4",
        link: LINKS.youtube,
    },
];

export const ABOUT = {
    // TODO: viết lại phần giới thiệu, kỹ năng và kinh nghiệm thật
    bio: "Hi, I'm Phi — a 3D artist who loves building cozy, detailed spaces.\n\nI work across modeling, texturing and lighting, and I enjoy bringing my scenes to the web as interactive experiences like this room.",
    skills: [
        { name: "Maya", level: 85 },
        { name: "Marmoset Toolbag", level: 75 },
        { name: "Blender", level: 70 },
        { name: "Three.js", level: 60 },
    ],
    timeline: [
        { year: "2025", title: "3D Room Portfolio", place: "Personal project" },
        { year: "20XX", title: "Your role", place: "Company / school" },
    ],
    // Bảng chỉ số hình lục giác kiểu game (0 → 100), thứ tự theo chiều kim đồng hồ từ đỉnh trên cùng
    stats: [
        // TODO: chỉnh lại chỉ số thật
        { label: "Problem Solve", value: 82 },
        { label: "RnD", value: 78 },
        { label: "Programming", value: 66 },
        { label: "Design", value: 80 },
        { label: "Social", value: 70 },
        { label: "Creative", value: 88 },
    ],
};

/**
 * Game hay chơi — popup HOBBY (mở từ menu hoặc bấm bức poster trong phòng).
 * id    : chữ không dấu / số / dấu - (tên sự kiện click trong admin: hobby-<id>)
 * color : màu nhận diện của thẻ
 * link  : trang chủ của game (bấm thẻ để mở)
 * note  : cảm nhận / vai trò hay chơi (tuỳ chọn, để trống thì ẩn)
 */
export const HOBBY = {
    intro: "Games I keep coming back to after work.", // TODO: viết lại theo ý bạn
    games: [
        {
            id: "conquerors-blade",
            title: "Conqueror's Blade",
            genre: "Tactical MMO",
            studio: "Booming Tech",
            year: 2019,
            color: "#c8743a",
            link: "https://www.conquerorsblade.com",
            note: "",
        },
        {
            id: "league-of-legends",
            title: "League of Legends",
            genre: "MOBA",
            studio: "Riot Games",
            year: 2009,
            color: "#c8aa6e",
            link: "https://www.leagueoflegends.com",
            note: "",
        },
        {
            id: "delta-force",
            title: "Delta Force",
            genre: "Tactical FPS",
            studio: "Team Jade",
            year: 2024,
            color: "#5fae6b",
            link: "https://www.playdeltaforce.com",
            note: "",
        },
        {
            id: "where-winds-meet",
            title: "Where Winds Meet",
            genre: "Open-world RPG",
            studio: "Everstone Studio",
            year: 2025,
            color: "#5a9fd6",
            link: "https://www.wherewindsmeetgame.com",
            note: "",
        },
        {
            id: "total-war-three-kingdoms",
            title: "Total War: Three Kingdoms",
            genre: "Strategy",
            studio: "Creative Assembly",
            year: 2019,
            color: "#b8463c",
            link: "https://www.totalwar.com/games/three-kingdoms/",
            note: "The poster on my wall.",
        },
    ],
};

export const CONTACT = {
    headline: "Let's build something together",
    note: "Open to full-time roles and freelance projects.", // TODO
};

/**
 * Tên hiển thị cho lời chào theo link ?ref=.
 * Ref không có trong danh sách sẽ tự đổi "fpt-software" → "Fpt Software".
 */
export const REF_NAMES = {
    // "fpt-software": "FPT Software",
};
