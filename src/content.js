// content.js — nội dung hiển thị trên trang (popup Work / About / Contact / Hobby, lời chào theo ref).
// Muốn cập nhật portfolio thì chỉ cần sửa file này, không phải đụng vào code UI.
// Các mục đánh dấu TODO đang là dữ liệu mẫu — hãy thay bằng nội dung thật trước khi deploy.

export const PROFILE = {
    name: "Hoàng Trọng Phi",
    role: "3D Technical Artist",
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
 * cover : ảnh bìa trong /public (tuỳ chọn) — media gốc ở MyWork/, bản dùng trên web ở public/media/work/
 * video : file trong /public (tuỳ chọn) — rê chuột vào thẻ sẽ phát
 * link  : trang chi tiết bên ngoài (tuỳ chọn, để trống thì ẩn nút), vd. bài trên ArtStation
 * meta  : dòng phụ "năm · studio" (tuỳ chọn)
 * Chỉ dự án có video mới lên hologram trong phòng.
 */
export const WORK = [
    // Dự án lấy từ PDF_files/CV_TechnicalArtist.pdf
    {
        id: "lies-of-p",
        title: "Lies of P",
        meta: "2021 – 2023 · Neowiz / Round8 Studio",
        tags: ["Unreal", "Environment", "Optimization"],
        cover: "/media/work/lies-of-p.jpg",
        video: "/media/work/lies-of-p.mp4",
        description: "AAA soulslike. Modeled props and environments, built custom materials and procedural textures in UE5, and optimized memory and draw calls — delivering QC-ready assets on milestone deadlines.",
        link: "https://www.youtube.com/watch?v=R5TUYKAzGZs",
    },
    {
        id: "caliverse",
        title: "Caliverse",
        meta: "2021 – 2023 · Lotte",
        tags: ["Unreal", "VR/XR", "Optimization"],
        cover: "/media/work/caliverse.jpg",
        description: "Metaverse for VR/XR. Modular building assets, procedural foliage and performance optimization to hold frame rate on headsets.",
        link: "https://www.youtube.com/@Caliverse_io",
    },
    {
        id: "national-museum-singapore",
        title: "National Museum Singapore",
        meta: "2025 – 2026 · DreamChasers Interactive",
        tags: ["Environment", "Optimization"],
        cover: "/media/work/national-museum-singapore.jpg",
        description: "Created and optimized assets for the museum experience, handled the material graphs and set up the levels.",
        link: "https://drive.google.com/drive/u/0/folders/12R7jcUFnn1ahZrxahlPCNXYKGuy8wreu",
    },
    {
        id: "net-runner",
        title: "Net Runner",
        meta: "2026 · MageTechCorp",
        tags: ["Meta Horizon", "VR/XR"],
        description: "Game built with Meta Horizon Create for Meta Horizon Worlds.",
        link: "", // TODO: link dự án
    },
    {
        id: "oblique-beat-saber",
        title: "Oblique Beat Saber",
        meta: "2026 · MageTechCorp",
        tags: ["Meta Horizon", "VR/XR"],
        description: "Rhythm game built with Meta Horizon Create for Meta Horizon Worlds.",
        link: "", // TODO: link dự án
    },
    {
        id: "revenge-slots",
        title: "Revenge Game Slots",
        meta: "2024 – 2025 · Fetch",
        tags: ["Cocos", "Optimization"],
        video: "/media/work/revenge-slots.mp4",
        description: "In-house slot games. Optimized 2D/3D animation and VFX assets for memory and draw calls, and integrated them in Cocos Creator.",
        link: "https://lobby.dev.revenge-games.com/?oc=demo&t=bjaswml5ee18hes1n3wqa0r7&theme=dark&l=en",
    },
    {
        id: "space-elvis",
        title: "Seoul City Wall Restoration",
        meta: "2021 – 2023 · Space Elvis",
        tags: ["Unreal", "Environment"],
        video: "/media/work/space-elvis.mp4",
        description: "Historical heritage project. Modeled history props and supported the team as Technical Artist in Unreal.",
        link: "https://www.elviss.co/portfolio-all/seoul-city-wall-restoration-project",
    },
    {
        id: "skt-ifland",
        title: "SKT ifland",
        meta: "2021 – 2023 · SK Telecom",
        tags: ["Unity", "Environment"],
        cover: "/media/work/skt-ifland.jpg",
        video: "/media/work/skt-ifland.mp4",
        description: "Metaverse platform. Technical Artist in Unity and environment modeling support.",
        link: "", // TODO: link dự án
    },
    {
        id: "kidmo",
        title: "Kidmo",
        meta: "2021 – 2023 · One Universe VN",
        tags: ["Unity"],
        description: "Technical Artist in Unity; R&D on a Stable Diffusion 1.5 asset pipeline.",
        link: "", // TODO: link dự án
    },
    {
        id: "room-portfolio",
        title: "3D Room Portfolio",
        meta: "2025 · Personal",
        tags: ["Web 3D"],
        description: "This interactive room — modeled in Maya, baked lighting, rendered in the browser with Three.js.",
        video: "/media/monitor_1.mp4",
        link: LINKS.github,
    },
];

// Nội dung lấy từ PDF_files/CV_TechnicalArtist.pdf
export const ABOUT = {
    bio: "Hi, I'm Phi — a 3D Technical Artist who bridges art and engineering.\n\n5+ years shipping assets, shaders and tools for AAA (Lies of P), VR/XR (Caliverse), slot games and Meta Horizon Worlds — making things look great and run fast.",
    // Đang làm ở đâu — hiện dưới chức danh (để trống thì ẩn)
    now: "MageTechCorp · Meta Horizon Worlds",
    // Số liệu nổi bật ở cột trái
    highlights: [
        { value: "6+", label: "Years" },
        { value: "5", label: "Studios" },
        { value: "3", label: "Engines" },
    ],
    // Thanh kỹ năng chính (0 → 100, tự đánh giá)
    skills: [
        { name: "Unreal Engine", level: 90 },
        { name: "Maya", level: 85 },
        { name: "Blender", level: 80 },
        { name: "Substance Painter", level: 85 },
        { name: "Substance Designer", level: 75 },
        { name: "Photoshop/ PhotoCraft", level: 85 },
        { name: "Python / C++", level: 78 },
        { name: "Unity", level: 72 },
        { name: "Cocos / Godots", level: 70 },
        { name: "Marmoset Toolbag ", level: 90 },
        { name: "SpeedTree ", level: 85 },
        { name: "GaeA ", level: 75 },
        { name: "Claude/Antigravity/Codex ", level: 95 },
        { name: "Rider/Webstorm/Pycharm", level: 85 },
    ],
    // Bộ công cụ chia theo nhóm (dạng tag)
    toolkit: [
        { group: "Tech Art", items: ["Material / Shader Graph", "HLSL · GLSL", "PCG", "HLOD · Foliage · Landscape", "Trimsheet", "Lumen · Path Tracing", "Niagara", "Anim Blueprint"] },
        { group: "3D DCC", items: ["Maya", "Blender", "ZBrush", "Substance Painter", "Substance Designer", "Marmoset", "SpeedTree", "Gaea", "EmberGen", "Cascadeur"] },
        { group: "Engines", items: ["Unreal Engine", "Unity", "Cocos Creator", "Meta Horizon"] },
        { group: "Engines C++ ", items: ["Game Mode, Game State", "Character/Pawn", "Actor", "State Tree", "EQS", "Behavior Trees/ Blackboard", "MCP", "GAS"," Vibe code"] },
        { group: "Code & Pipeline", items: ["Python", "C++", "C#", "Maya / Blender tools", "Three.js", "Git · Perforce", "Stable Diffusion · ComfyUI"] },
        { group: "2D & Video", items: ["Photoshop", "Illustrator", "Spine 2D", "DaVinci Resolve", "After Effects"] },
    ],
    // Kinh nghiệm, mới nhất ở trên. projects / points tuỳ chọn
    timeline: [
        { year: "2026", period: "04/2026 — now", title: "MageTechCorp (ABH Tech)", place: "Meta Horizon Worlds developer", projects: ["Net Runner", "Oblique Beat Saber"] },
        { year: "2025", period: "12/2025 — 04/2026", title: "DreamChasers Interactive", place: "National Museum Singapore", points: ["Created & optimized assets", "Material graphs and level setup"] },
        { year: "2024", period: "10/2024 — 10/2025", title: "Fetch · Revenge Game", place: "Technical Artist — in-house slot games", points: ["Optimized 2D/3D animation & VFX assets", "Memory and draw-call optimization", "Asset integration in Cocos Creator"] },
        { year: "2024", period: "02 — 08/2024", title: "Line Century", place: "Freelance (Upwork) — UE5 cinematic content", points: ["YouTube series built with UE5, Mixamo, DaVinci Resolve"] },
        { year: "2021", period: "11/2021 — 11/2023", title: "One Universe VN", place: "Technical Artist (outsource)", projects: ["Lies of P", "Caliverse", "Space Elvis", "SKT ifland", "Kidmo"], points: ["AAA props & environments, custom UE5 materials (Neowiz / Round8)", "Modular buildings, procedural foliage, VR/XR optimization (Lotte)", "R&D Stable Diffusion pipeline in Unity"] },
        { year: "2021", period: "03 — 10/2021", title: "Sparx* Virtuos", place: "Intern / Trainee 3D Artist", points: ["AAA props & environments, procedural textures in UE4.26"] },
    ],
    education: [
        { year: "2023 — 2026", title: "University of Technology", place: "Technical Field" },
        { year: "2020 — 2021", title: "VTC Academy", place: "Full-Stack 3D Modeling for Games" },
        { year: "2016 — 2018", title: "HCMC Fine Arts College", place: "Visual Art Foundation" },
    ],
    // Bảng chỉ số hình lục giác kiểu game (0 → 100), thứ tự theo chiều kim đồng hồ từ đỉnh trên cùng
    stats: [
        // TODO: chỉnh lại theo cảm nhận của bạn
        { label: "3D Modeling", value: 86 },
        { label: "Shader", value: 84 },
        { label: "Optimized", value: 88 },
        { label: "Program", value: 76 },
        { label: "Pipeline", value: 80 },
        { label: "R&D", value: 82 },
    ],

    stats_2: [
        // TODO: chỉnh lại theo cảm nhận của bạn
        { label: "Creative", value: 86 },
        { label: "Programming", value: 84 },
        { label: "Optimized", value: 88 },
        { label: "Art Skill", value: 76 },
        { label: "Problem Solve", value: 80 },
        { label: "R&D", value: 82 },
    ],
    // Tên 2 tab chuyển bảng lục giác: [stats, stats_2]
    statTabs: ["Tech", "Core"],

    /**
     * Cây kỹ năng kiểu game (dưới bảng lục giác). Mỗi nhánh mở dần từ trên xuống.
     * level / max: số điểm đã nâng — level = max → MAX (vàng), level = 0 → khoá
     * note : mô tả ngắn khi rê chuột (tuỳ chọn)
     */
    skillTree: [
        // TODO: chỉnh lại level theo cảm nhận của bạn
        {
            branch: "Art",
            color: "#ff6bd6",
            nodes: [
                { label: "Modeling", level: 5, max: 5, note: "Low / mid / high poly, hard-surface & organic" },
                { label: "PBR Texture", level: 5, max: 5, note: "Substance Painter / Designer, trimsheet, tiling" },
                { label: "Sculpt", level: 3, max: 5, note: "ZBrush" },
                { label: "Rig & Anim", level: 2, max: 5, note: "Character / mechanic rigging, basic game animation" },
            ],
        },
        {
            branch: "Tech Art",
            color: "#66e0ff",
            nodes: [
                { label: "Shader", level: 5, max: 5, note: "Material / Shader Graph, HLSL · GLSL" },
                { label: "Optimize", level: 5, max: 5, note: "Memory, draw calls, HLOD, LOD, mipmap" },
                { label: "PCG", level: 4, max: 5, note: "Procedural foliage, landscape, PCG tools" },
                { label: "Lighting", level: 4, max: 5, note: "Lumen, Path Tracing" },
                { label: "VFX", level: 2, max: 5, note: "Niagara, 2D VFX" },
            ],
        },
        {
            branch: "Code",
            color: "#7cf0c5",
            nodes: [
                { label: "Python", level: 4, max: 5, note: "Pipeline scripts, Maya / Blender add-ons" },
                { label: "C++ / C#", level: 4, max: 5, note: "Unreal gameplay framework, Unity" },
                { label: "Prototype", level: 3, max: 5, note: "Minimap, pickup, inventory, HUD" },
                { label: "AI Gen", level: 3, max: 5, note: "Stable Diffusion, ComfyUI, LoRA, ControlNet" },
            ],
        },
    ],
};

/**
 * Cây kỹ năng theo pipeline làm game — popup PIPELINE (bấm chồng sách trên hộp dưới bàn).
 * Bản đồ lớn, kéo để di chuyển, cuộn chuột để zoom. Đọc từ trái sang phải theo giai đoạn (stages).
 * Hai con đường Art (trên) và Code (dưới) gặp nhau ở làn giữa Tech Art; cuối bản đồ là cột
 * Lead & Production — nơi các con đường hội tụ thành vị trí lãnh đạo / quản lý.
 *
 * nodes:
 *   id    : chữ không dấu, duy nhất
 *   type  : "role" (vị trí công việc — node lớn) | "skill" (node vừa) | "perk" (kỹ năng phụ — node nhỏ)
 *   lane  : "art" | "tech" | "code" | "lead"   (màu node; dây giữa art/tech/code khác làn = nét đứt giao thoa)
 *   col   : cột giai đoạn 0 → 8 (cho phép số lẻ .5)   row : hàng 0 → 11 (art 0–3, tech 4–6, code 7–11)
 *   level / max : điểm đã nâng (level = max → MASTERED vàng, 0 → khoá)
 *   from  : id các node đi trước (nối dây)
 *   icon  : 1–3 ký tự · note : mô tả · tools : tag công cụ
 *   current : vị trí hiện tại (huy hiệu YOU ARE HERE) · goal : mục tiêu tiếp theo (huy hiệu NEXT GOAL)
 */
export const PIPELINE = {
    // TODO: chỉnh level / note theo cảm nhận của bạn
    intro: "Game dev pipeline, left → right. Art and Code cross in the middle lane — Technical Art — then every road meets at Lead & Production. Drag to pan · scroll to zoom.",
    stages: ["Pre-prod", "Production", "Look-dev", "Integration", "Optimize", "Ship & Live", "Lead", "Direct"],
    focus: [3, 6], // các cột bạn mạnh nhất (gạch sáng trên thanh giai đoạn)
    lanes: {
        art: { label: "Art", color: "#ff6bd6" },
        tech: { label: "Tech Art", color: "#66e0ff" },
        code: { label: "Code", color: "#7cf0c5" },
        lead: { label: "Lead & Production", color: "#ffa94d" },
    },
    nodes: [
        { id: "core", type: "role", lane: "tech", col: 0, row: 5.2, level: 1, max: 1, icon: "HP", label: "Phi", note: "Fine Arts foundation + engineering mindset — the starting point of every road." },

        // ================= ART =================
        // ---- 2D / UI ----
        { id: "concept", type: "skill", lane: "art", col: 1, row: 0, level: 3, max: 5, icon: "✎", label: "Concept & 2D", from: ["core"], note: "Visual art foundation, paint-overs, mood boards.", tools: ["Photoshop", "Illustrator"] },
        { id: "p-color", type: "perk", lane: "art", col: 1.5, row: 0, level: 3, max: 3, icon: "◑", label: "Color & Value", from: ["concept"], note: "Color theory, value grouping, readability." },
        { id: "r-concept", type: "role", lane: "art", col: 2, row: 0, level: 2, max: 5, icon: "✐", label: "Concept Artist", from: ["p-color"], note: "Designs the look of worlds, characters and props before production." },
        { id: "uiux", type: "skill", lane: "art", col: 3, row: 0, level: 2, max: 5, icon: "▭", label: "UI / UX Art", from: ["r-concept"], note: "HUD, menus, icons — layouts that read at a glance.", tools: ["Figma", "Photoshop"] },
        { id: "p-motion", type: "perk", lane: "art", col: 3.5, row: 0, level: 1, max: 3, icon: "≈", label: "Motion UI", from: ["uiux"], note: "Animated UI, transitions and juice.", tools: ["After Effects", "Spine 2D"] },
        { id: "r-ui", type: "role", lane: "art", col: 4, row: 0, level: 1, max: 5, icon: "▤", label: "UI Artist", from: ["p-motion"], note: "Owns the game's interface art and its implementation in engine." },
        { id: "p-style", type: "perk", lane: "art", col: 5, row: 0, level: 0, max: 3, icon: "❖", label: "Style Guide", from: ["r-ui"], note: "Writing the visual rules a whole team can follow." },

        // ---- Character / Animation ----
        { id: "p-anatomy", type: "perk", lane: "art", col: 1.5, row: 1, level: 2, max: 3, icon: "☥", label: "Anatomy", from: ["concept"], note: "Proportion, form and silhouette." },
        { id: "sculpt", type: "skill", lane: "art", col: 2, row: 1, level: 3, max: 5, icon: "◐", label: "Sculpt", from: ["p-anatomy"], note: "High-poly sculpt for props and organic shapes.", tools: ["ZBrush", "Blender"] },
        { id: "p-retopo", type: "perk", lane: "art", col: 2.5, row: 1, level: 3, max: 3, icon: "⌗", label: "Retopo & UV", from: ["sculpt"], note: "Game-ready topology and clean UV layouts.", tools: ["Maya", "RizomUV"] },
        { id: "r-char", type: "role", lane: "art", col: 3, row: 1, level: 2, max: 5, icon: "♞", label: "3D Character Artist", from: ["p-retopo", "texture"], note: "Builds game-ready characters: sculpt → retopo → bake → texture." },
        { id: "rig", type: "skill", lane: "art", col: 4, row: 1, level: 2, max: 5, icon: "⟡", label: "Rig & Skin", from: ["r-char"], note: "Joint chains, skin weights, control rigs.", tools: ["Maya", "Control Rig"] },
        { id: "p-mocap", type: "perk", lane: "art", col: 4.5, row: 1, level: 2, max: 3, icon: "∿", label: "Mocap Clean-up", from: ["rig"], note: "Retargeting and cleaning motion capture.", tools: ["Cascadeur", "Mixamo"] },
        { id: "r-anim", type: "role", lane: "art", col: 5, row: 1, level: 1, max: 5, icon: "➹", label: "Animator", from: ["p-mocap"], note: "Brings characters to life — gameplay and cinematic animation." },
        { id: "cine", type: "skill", lane: "art", col: 6, row: 1, level: 3, max: 5, icon: "▶", label: "Cinematic", from: ["r-anim"], note: "UE5 cinematic series for YouTube (Line Century).", tools: ["Sequencer", "DaVinci Resolve"] },

        // ---- Environment ----
        { id: "blockout", type: "skill", lane: "art", col: 1, row: 2, level: 3, max: 5, icon: "▢", label: "Blockout", from: ["core"], note: "Greybox, scale and composition before final art.", tools: ["Maya", "UE Modeling"] },
        { id: "model", type: "skill", lane: "art", col: 2, row: 2, level: 5, max: 5, icon: "◆", label: "Modeling", from: ["blockout"], note: "Low / mid / high poly props for AAA.", tools: ["Maya", "Blender"] },
        { id: "p-hard", type: "perk", lane: "art", col: 2.5, row: 2, level: 3, max: 3, icon: "⬢", label: "Hard-surface", from: ["model"], note: "Clean bevels, weighted normals, mid-poly workflow." },
        { id: "texture", type: "skill", lane: "art", col: 3, row: 2, level: 5, max: 5, icon: "▦", label: "PBR Texture", from: ["p-hard"], note: "Procedural and hand-crafted PBR, tiling materials.", tools: ["Substance Painter", "Substance Designer"] },
        { id: "r-env", type: "role", lane: "art", col: 4, row: 2, level: 5, max: 5, icon: "▲", label: "Environment Artist", from: ["texture"], note: "Shipped environments and props for Lies of P and Caliverse." },
        { id: "p-foliage", type: "perk", lane: "art", col: 4.5, row: 2, level: 3, max: 3, icon: "♣", label: "Foliage & Terrain", from: ["r-env"], tools: ["SpeedTree", "Gaea"] },
        { id: "level", type: "skill", lane: "art", col: 5, row: 2, level: 3, max: 5, icon: "⌂", label: "Level Art", from: ["p-foliage"], note: "Set dressing, composition and guiding the player's eye." },
        { id: "showcase", type: "skill", lane: "art", col: 6, row: 2, level: 4, max: 5, icon: "◉", label: "Showcase", from: ["level"], note: "Portfolio renders and presentation.", tools: ["Marmoset", "UE5 MRQ"] },

        // ---- VFX / Lighting ----
        { id: "vfx", type: "skill", lane: "art", col: 4, row: 3, level: 2, max: 5, icon: "✺", label: "Real-time VFX", from: ["r-env", "p-hlsl"], note: "Particles, shader-driven effects, 2D VFX.", tools: ["Niagara", "Cocos"] },
        { id: "p-flip", type: "perk", lane: "art", col: 4.5, row: 3, level: 1, max: 3, icon: "❋", label: "Sim Flipbooks", from: ["vfx"], tools: ["EmberGen", "Houdini"] },
        { id: "r-vfx", type: "role", lane: "art", col: 5, row: 3, level: 1, max: 5, icon: "✹", label: "VFX Artist", from: ["p-flip"], note: "Explosions, magic, weather — effects that sell the impact." },
        { id: "r-light", type: "role", lane: "art", col: 6, row: 3, level: 2, max: 5, icon: "☀", label: "Lighting Artist", from: ["r-vfx", "p-path"], note: "Mood, readability and performance through light." },

        // ================= TECH ART =================
        { id: "p-hlsl", type: "perk", lane: "tech", col: 3.5, row: 4.3, level: 3, max: 3, icon: "{}", label: "HLSL / GLSL", from: ["material"], note: "Hand-written shader code when nodes are not enough." },
        { id: "lighting", type: "skill", lane: "tech", col: 4, row: 4.3, level: 4, max: 5, icon: "☼", label: "Lighting Tech", from: ["p-hlsl"], note: "Lumen, baked lighting, light budgets.", tools: ["Lumen", "Lightmass"] },
        { id: "p-path", type: "perk", lane: "tech", col: 4.5, row: 4.3, level: 2, max: 3, icon: "⟿", label: "Path Tracing", from: ["lighting"], tools: ["Path Tracer"] },

        { id: "specs", type: "skill", lane: "tech", col: 1, row: 5.2, level: 4, max: 5, icon: "≡", label: "Tech Specs", from: ["core"], note: "Poly / texture budgets, texel density, naming rules." },
        { id: "p-budget", type: "perk", lane: "tech", col: 1.5, row: 5.2, level: 3, max: 3, icon: "⚖", label: "Budgets", from: ["specs"], note: "Memory, triangle and draw-call budgets per platform." },
        { id: "trim", type: "skill", lane: "tech", col: 2, row: 5.2, level: 4, max: 5, icon: "▥", label: "Trimsheet & Modular", from: ["p-budget", "model"], note: "Trimsheets and modular kits for reuse.", tools: ["Maya", "Substance Designer"] },
        { id: "material", type: "skill", lane: "tech", col: 3, row: 5.2, level: 5, max: 5, icon: "◈", label: "Material / Shader", from: ["trim", "texture"], note: "Master materials, material functions, custom shaders.", tools: ["Material Graph", "Shader Graph"] },
        { id: "world", type: "skill", lane: "tech", col: 4, row: 5.2, level: 4, max: 5, icon: "⁂", label: "World Tech", from: ["material"], note: "World partition, landscape, streaming.", tools: ["World Partition", "Landscape"] },
        { id: "p-lod", type: "perk", lane: "tech", col: 4.5, row: 5.2, level: 3, max: 3, icon: "⧉", label: "LOD / HLOD", from: ["world"] },
        { id: "optimize", type: "skill", lane: "tech", col: 5, row: 5.2, level: 5, max: 5, icon: "ϟ", label: "Optimization", from: ["p-lod", "profile"], note: "Memory, draw calls, texture streaming — milestone-ready builds.", tools: ["Unreal Insights", "stat GPU"] },
        { id: "r-ta", type: "role", lane: "tech", col: 6, row: 5.2, level: 4, max: 5, icon: "◎", label: "Technical Artist", from: ["optimize", "xr"], current: true, note: "Bridge between art and engineering: shaders, tools, pipeline and performance." },

        { id: "pcg", type: "skill", lane: "tech", col: 3, row: 6.1, level: 4, max: 5, icon: "⌬", label: "PCG / Procedural", from: ["material", "dcc"], note: "Procedural foliage and placement, PCG graphs.", tools: ["PCG", "Substance Designer"] },
        { id: "p-houdini", type: "perk", lane: "tech", col: 3.5, row: 6.1, level: 1, max: 3, icon: "⌇", label: "Houdini", from: ["pcg"], tools: ["Houdini"] },
        { id: "techanim", type: "skill", lane: "tech", col: 4, row: 6.1, level: 2, max: 5, icon: "⟲", label: "Tech Anim", from: ["p-houdini"], note: "Anim Blueprints, physics, procedural motion.", tools: ["Anim Blueprint", "Control Rig"] },
        { id: "xr", type: "skill", lane: "tech", col: 5, row: 6.1, level: 4, max: 5, icon: "◍", label: "XR & Platforms", from: ["optimize", "techanim"], note: "Holding frame rate on VR/XR headsets, mobile and web.", tools: ["Meta Horizon", "Cocos", "Unity"] },
        { id: "p-mentor", type: "perk", lane: "tech", col: 6.5, row: 4.6, level: 2, max: 3, icon: "☍", label: "Mentoring", from: ["r-ta"], note: "Reviews, guides and training for artists." },

        // ================= CODE =================
        // ---- Tools ----
        { id: "python", type: "skill", lane: "code", col: 2, row: 7, level: 4, max: 5, icon: "Py", label: "Python", from: ["core"], note: "Pipeline scripts and batch processing." },
        { id: "p-pyside", type: "perk", lane: "code", col: 2.5, row: 7, level: 2, max: 3, icon: "▣", label: "PySide UI", from: ["python"], note: "Tool windows artists actually enjoy using." },
        { id: "dcc", type: "skill", lane: "code", col: 3, row: 7, level: 4, max: 5, icon: "⌘", label: "DCC Tools", from: ["p-pyside"], note: "Maya / Blender add-ons that save artists time.", tools: ["Maya API", "Blender API"] },
        { id: "assetpipe", type: "skill", lane: "code", col: 4, row: 7, level: 4, max: 5, icon: "⇄", label: "Asset Pipeline", from: ["dcc"], note: "Export, validation and import automation.", tools: ["Python", "UE Python"] },
        { id: "r-tools", type: "role", lane: "code", col: 5, row: 7, level: 2, max: 5, icon: "⚒", label: "Tools Programmer", from: ["assetpipe"], note: "Builds the editors and pipelines the whole studio works in." },
        { id: "aigen", type: "skill", lane: "code", col: 6, row: 7, level: 3, max: 5, icon: "✦", label: "AI Gen Pipeline", from: ["r-tools"], note: "Stable Diffusion asset pipeline R&D (Kidmo).", tools: ["ComfyUI", "LoRA", "ControlNet"] },

        // ---- Gameplay ----
        { id: "proto", type: "skill", lane: "code", col: 1, row: 8, level: 4, max: 5, icon: "▧", label: "Blueprint Prototype", from: ["core"], note: "Minimap, pickup, inventory, HUD prototypes.", tools: ["Blueprint"] },
        { id: "cpp", type: "skill", lane: "code", col: 2, row: 8, level: 4, max: 5, icon: "C++", label: "C++ / C#", from: ["proto"], note: "Unreal gameplay classes, Unity scripting.", tools: ["Rider", "Visual Studio"] },
        { id: "gameplay", type: "skill", lane: "code", col: 3, row: 8, level: 3, max: 5, icon: "⚑", label: "Gameplay Framework", from: ["cpp"], note: "Game Mode / State, Pawn, Character, Actor." },
        { id: "p-gas", type: "perk", lane: "code", col: 3.5, row: 8, level: 2, max: 3, icon: "✚", label: "GAS", from: ["gameplay"], note: "Gameplay Ability System." },
        { id: "r-gameplay", type: "role", lane: "code", col: 4, row: 8, level: 2, max: 5, icon: "⚔", label: "Gameplay Programmer", from: ["p-gas"], note: "Turns design into mechanics that feel good to play." },
        { id: "behavior", type: "skill", lane: "code", col: 5, row: 8, level: 3, max: 5, icon: "⌥", label: "AI Behavior", from: ["r-gameplay"], note: "Behavior Trees, Blackboard, State Tree, EQS.", tools: ["State Tree", "EQS"] },
        { id: "p-net", type: "perk", lane: "code", col: 5.5, row: 8, level: 0, max: 3, icon: "⇋", label: "Netcode", from: ["behavior"], note: "Replication and multiplayer — next to learn." },

        // ---- Engine / Graphics ----
        { id: "p-math", type: "perk", lane: "code", col: 2, row: 9, level: 3, max: 3, icon: "∑", label: "3D Math", from: ["cpp"], note: "Vectors, matrices, quaternions." },
        { id: "render", type: "skill", lane: "code", col: 3, row: 9, level: 2, max: 5, icon: "◭", label: "Render Pipeline", from: ["p-math"], note: "Deferred / forward, GPU passes, frame anatomy." },
        { id: "profile", type: "skill", lane: "code", col: 4, row: 9, level: 3, max: 5, icon: "◔", label: "Profiling", from: ["render"], note: "Finding the real bottleneck before optimizing.", tools: ["Unreal Insights", "RenderDoc", "PIX"] },
        { id: "p-rdg", type: "perk", lane: "code", col: 4.5, row: 9, level: 0, max: 3, icon: "⧈", label: "RDG / Passes", from: ["profile"], note: "Custom render passes in Unreal's Render Dependency Graph." },
        { id: "r-engine", type: "role", lane: "code", col: 5, row: 9, level: 0, max: 5, icon: "⚙", label: "Graphics Programmer", from: ["p-rdg"], note: "Engine-level rendering features and GPU performance." },

        // ---- Web ----
        { id: "js", type: "skill", lane: "code", col: 2, row: 10, level: 3, max: 5, icon: "JS", label: "JS / TS", from: ["proto"], note: "Modern JavaScript, modules, tooling.", tools: ["Vite", "WebStorm"] },
        { id: "web3d", type: "skill", lane: "code", col: 3, row: 10, level: 3, max: 5, icon: "</>", label: "Three.js / WebGL", from: ["js"], note: "This room — Three.js, baked lighting, custom shaders.", tools: ["Three.js", "GSAP"] },
        { id: "r-fe", type: "role", lane: "code", col: 4, row: 10, level: 2, max: 5, icon: "▦", label: "Front End Dev", from: ["web3d"], note: "Interactive web experiences, UI and 3D on the web." },
        { id: "api", type: "skill", lane: "code", col: 5, row: 10, level: 2, max: 5, icon: "⇅", label: "APIs & Database", from: ["r-fe"], note: "Serverless APIs, SQL, auth.", tools: ["Vercel", "Supabase", "Node"] },
        { id: "r-be", type: "role", lane: "code", col: 6, row: 10, level: 1, max: 5, icon: "▤", label: "Back End Dev", from: ["api"], note: "Services, leaderboards, live-game data." },

        // ---- Build / QA / Ops ----
        { id: "vcs", type: "skill", lane: "code", col: 1, row: 11, level: 4, max: 5, icon: "⑂", label: "Version Control", from: ["core"], tools: ["Git", "Perforce"] },
        { id: "p-ci", type: "perk", lane: "code", col: 2, row: 11, level: 1, max: 3, icon: "↻", label: "CI / Builds", from: ["vcs"], note: "Automated builds and cooking." },
        { id: "testing", type: "skill", lane: "code", col: 3, row: 11, level: 2, max: 5, icon: "✓", label: "Testing & Debug", from: ["p-ci"], note: "Repro steps, test plans, debugging tools." },
        { id: "r-qa", type: "role", lane: "code", col: 4, row: 11, level: 1, max: 5, icon: "⚲", label: "QA Engineer", from: ["testing"], note: "Guards quality — test automation and release checks." },
        { id: "p-cloud", type: "perk", lane: "code", col: 5, row: 11, level: 0, max: 3, icon: "☁", label: "Cloud & Docker", from: ["r-qa"], note: "Containers, cloud build agents." },
        { id: "r-devops", type: "role", lane: "code", col: 6, row: 11, level: 0, max: 5, icon: "∞", label: "DevOps", from: ["p-cloud"], note: "Build farms, deployment and live-ops infrastructure." },

        // ================= LEAD & PRODUCTION =================
        { id: "r-ad", type: "role", lane: "lead", col: 7, row: 1.5, level: 0, max: 5, icon: "♛", label: "Art Director", from: ["cine", "showcase", "p-style", "r-light"], note: "Owns the visual target of the whole project." },
        { id: "r-leadta", type: "role", lane: "lead", col: 7, row: 4.6, level: 0, max: 5, icon: "◈", label: "Lead Technical Artist", from: ["p-mentor"], goal: true, note: "Next goal: leading the tech art team and owning the art pipeline." },
        { id: "r-td", type: "role", lane: "lead", col: 7, row: 7, level: 0, max: 5, icon: "⌖", label: "Technical Director", from: ["r-leadta", "aigen", "p-net"], note: "Sets the technical direction: engine, platforms, pipeline." },
        { id: "r-arch", type: "role", lane: "lead", col: 7, row: 9.6, level: 0, max: 5, icon: "⌸", label: "Technical Architect", from: ["r-engine", "r-be", "r-devops"], note: "Designs systems that scale — engine, services, infrastructure." },

        { id: "p-schedule", type: "perk", lane: "lead", col: 7.5, row: 2.6, level: 1, max: 3, icon: "◷", label: "Scheduling", from: ["r-ad"], note: "Milestones, estimates, dependencies." },
        { id: "p-scrum", type: "perk", lane: "lead", col: 7.5, row: 5.8, level: 2, max: 3, icon: "⟳", label: "Agile / Scrum", from: ["r-leadta", "r-td"], note: "Sprints, stand-ups, retros — used daily in studios.", tools: ["Jira", "Confluence"] },
        { id: "p-roadmap", type: "perk", lane: "lead", col: 7.5, row: 8.6, level: 0, max: 3, icon: "⇢", label: "Roadmap & Backlog", from: ["r-td", "r-arch"], note: "Prioritizing what ships next." },

        { id: "r-producer", type: "role", lane: "lead", col: 8, row: 2.6, level: 0, max: 5, icon: "★", label: "Producer", from: ["p-schedule", "r-pm"], note: "Keeps the game on time, on budget and the team healthy." },
        { id: "r-pm", type: "role", lane: "lead", col: 8, row: 5.8, level: 0, max: 5, icon: "▦", label: "Project Manager", from: ["p-scrum"], note: "Plans and tracks delivery across disciplines." },
        { id: "r-po", type: "role", lane: "lead", col: 8, row: 8.6, level: 0, max: 5, icon: "◆", label: "Product Owner", from: ["p-roadmap", "r-pm"], note: "Owns the product vision and the backlog." },
    ],
};

/**
 * Sở thích — popup HOBBY (mở từ menu hoặc bấm bức poster trong phòng), chia 3 tab: Games / Music / Films.
 * Tab nào để mảng rỗng thì tự ẩn. Mỗi tab có intro riêng (gameIntro / musicIntro / filmIntro).
 * id    : chữ không dấu / số / dấu - (tên sự kiện click trong admin: hobby-<id>, hobby-music-<id>, hobby-film-<id>)
 * color : màu nhận diện của thẻ / đĩa nhạc / poster
 * link  : bấm vào thì mở (trang chủ game, video YouTube / Spotify, trang IMDb)
 * note  : cảm nhận ngắn (tuỳ chọn, để trống thì ẩn)
 */
export const HOBBY = {
    gameIntro: "Games I keep coming back to after work.", // TODO: viết lại theo ý bạn
    musicIntro: "On repeat while I model, texture and debug shaders.", // TODO
    filmIntro: "Films I can rewatch any time.", // TODO
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
    // TODO: thay bằng các bài bạn thích. link nên là video YouTube / bài trên Spotify
    music: [
        {
            id: "merry-go-round-of-life",
            title: "Merry-Go-Round of Life",
            artist: "Joe Hisaishi",
            genre: "Soundtrack",
            year: 2004,
            color: "#e0a458",
            link: "https://www.youtube.com/results?search_query=Merry-Go-Round+of+Life+Joe+Hisaishi",
            note: "",
        },
        {
            id: "time-hans-zimmer",
            title: "Time",
            artist: "Hans Zimmer",
            genre: "Soundtrack",
            year: 2010,
            color: "#6c8cd5",
            link: "https://www.youtube.com/results?search_query=Time+Hans+Zimmer+Inception",
            note: "",
        },
        {
            id: "legends-never-die",
            title: "Legends Never Die",
            artist: "Against The Current",
            genre: "Rock",
            year: 2017,
            color: "#c8aa6e",
            link: "https://www.youtube.com/results?search_query=Legends+Never+Die+Against+The+Current",
            note: "Worlds 2017 anthem.",
        },
        {
            id: "faded",
            title: "Faded",
            artist: "Alan Walker",
            genre: "EDM",
            year: 2015,
            color: "#66e0ff",
            link: "https://www.youtube.com/results?search_query=Faded+Alan+Walker",
            note: "",
        },
        {
            id: "believer",
            title: "Believer",
            artist: "Imagine Dragons",
            genre: "Rock",
            year: 2017,
            color: "#ff6b6b",
            link: "https://www.youtube.com/results?search_query=Believer+Imagine+Dragons",
            note: "",
        },
    ],
    // TODO: thay bằng phim bạn thích. rating: điểm của bạn trên thang 5 (tuỳ chọn)
    films: [
        {
            id: "interstellar",
            title: "Interstellar",
            director: "Christopher Nolan",
            genre: "Sci-fi",
            year: 2014,
            rating: 5,
            color: "#4a7bb7",
            link: "https://www.imdb.com/title/tt0816692/",
            note: "",
        },
        {
            id: "spirited-away",
            title: "Spirited Away",
            director: "Hayao Miyazaki",
            genre: "Animation",
            year: 2001,
            rating: 5,
            color: "#d96c75",
            link: "https://www.imdb.com/title/tt0245429/",
            note: "",
        },
        {
            id: "red-cliff",
            title: "Red Cliff",
            director: "John Woo",
            genre: "Historical",
            year: 2008,
            rating: 4,
            color: "#b8463c",
            link: "https://www.imdb.com/title/tt0425637/",
            note: "Three Kingdoms on the big screen.",
        },
        {
            id: "inception",
            title: "Inception",
            director: "Christopher Nolan",
            genre: "Sci-fi",
            year: 2010,
            rating: 5,
            color: "#7a8fa6",
            link: "https://www.imdb.com/title/tt1375666/",
            note: "",
        },
        {
            id: "lotr-return-of-the-king",
            title: "The Lord of the Rings: The Return of the King",
            director: "Peter Jackson",
            genre: "Fantasy",
            year: 2003,
            rating: 5,
            color: "#c9a227",
            link: "https://www.imdb.com/title/tt0167260/",
            note: "",
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
