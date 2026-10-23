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
 * Đọc từ trái sang phải theo các giai đoạn (stages). Hai con đường Art (trên) và Code (dưới)
 * gặp nhau ở làn giữa Tech Art — chỗ bạn đang đứng.
 * nodes:
 *   id    : chữ không dấu, duy nhất          lane : "art" | "tech" | "code"
 *   col   : cột giai đoạn 1 → 6 (0 = gốc)     row  : 0–1 làn Art, 2 làn Tech Art, 3–4 làn Code
 *   level / max : điểm đã nâng (level = max → MASTERED vàng, 0 → khoá)
 *   from  : id các node đi trước (nối dây). Dây giữa hai làn khác nhau = nhánh giao thoa (nét đứt)
 *   icon  : 1–3 ký tự hiện trong node · note : mô tả · tools : tag công cụ
 * classes: 3 "nghề" ở cuối mỗi con đường; current = vị trí hiện tại; from = node dẫn tới
 */
export const PIPELINE = {
    // TODO: chỉnh level / note theo cảm nhận của bạn
    intro: "Game dev pipeline, left → right. Two roads — Art and Code — cross in the middle lane: Technical Art. That's where I live.",
    stages: ["Pre-prod", "Production", "Look-dev", "Integration", "Optimize", "Ship & Live"],
    focus: [3, 5], // các cột bạn mạnh nhất (tô sáng trên thanh giai đoạn)
    lanes: {
        art: { label: "Art", color: "#ff6bd6" },
        tech: { label: "Tech Art", color: "#66e0ff" },
        code: { label: "Code", color: "#7cf0c5" },
    },
    nodes: [
        { id: "core", lane: "tech", col: 0, row: 2, level: 1, max: 1, icon: "HP", label: "Phi", note: "Fine Arts foundation + engineering mindset." },

        // ---- Art: nhánh 2D / nhân vật (hàng 0) ----
        { id: "concept", lane: "art", col: 1, row: 0, level: 3, max: 5, icon: "✎", label: "Concept & 2D", from: ["core"], note: "Visual art foundation, paint-overs, mood boards.", tools: ["Photoshop", "Illustrator"] },
        { id: "sculpt", lane: "art", col: 3, row: 0, level: 3, max: 5, icon: "◐", label: "Sculpt", from: ["concept"], note: "High-poly sculpt for props and organic shapes.", tools: ["ZBrush", "Blender"] },
        { id: "rig", lane: "art", col: 4, row: 0, level: 2, max: 5, icon: "⟡", label: "Rig & Anim", from: ["sculpt"], note: "Basic rigging, mocap clean-up, 2D skeletal animation.", tools: ["Cascadeur", "Mixamo", "Spine 2D"] },
        { id: "cine", lane: "art", col: 5, row: 0, level: 3, max: 5, icon: "▶", label: "Cinematic", from: ["rig"], note: "UE5 cinematic series for YouTube (Line Century).", tools: ["Sequencer", "DaVinci Resolve", "After Effects"] },
        { id: "artdir", lane: "art", col: 6, row: 0, level: 0, max: 5, icon: "♛", label: "Art Direction", from: ["cine", "render"], note: "Next goal: owning the visual target of a project." },

        // ---- Art: nhánh 3D môi trường (hàng 1) ----
        { id: "blockout", lane: "art", col: 1, row: 1, level: 3, max: 5, icon: "▢", label: "Blockout", from: ["core"], note: "Greybox, scale and composition before final art.", tools: ["Maya", "UE Modeling"] },
        { id: "model", lane: "art", col: 2, row: 1, level: 5, max: 5, icon: "◆", label: "Modeling", from: ["blockout"], note: "Low / mid / high poly, hard-surface and props for AAA.", tools: ["Maya", "Blender"] },
        { id: "texture", lane: "art", col: 3, row: 1, level: 5, max: 5, icon: "▦", label: "PBR Texture", from: ["model"], note: "Procedural and hand-crafted PBR, tiling materials.", tools: ["Substance Painter", "Substance Designer"] },
        { id: "env", lane: "art", col: 4, row: 1, level: 5, max: 5, icon: "▲", label: "Environment", from: ["texture"], note: "Modular kits, foliage and terrain — Lies of P, Caliverse.", tools: ["SpeedTree", "Gaea", "Marmoset"] },
        { id: "vfx", lane: "art", col: 5, row: 1, level: 2, max: 5, icon: "✺", label: "VFX", from: ["env", "material"], note: "Real-time particles, simulated flipbooks, 2D VFX.", tools: ["Niagara", "EmberGen"] },
        { id: "render", lane: "art", col: 6, row: 1, level: 4, max: 5, icon: "◉", label: "Showcase", from: ["vfx"], note: "Portfolio renders and presentation.", tools: ["Marmoset", "UE5 MRQ"] },

        // ---- Tech Art: làn giữa, nơi Art và Code gặp nhau (hàng 2) ----
        { id: "specs", lane: "tech", col: 1, row: 2, level: 4, max: 5, icon: "≡", label: "Tech Specs", from: ["core"], note: "Poly / texture budgets, texel density, naming rules.", tools: ["Docs", "Spreadsheets"] },
        { id: "trim", lane: "tech", col: 2, row: 2, level: 4, max: 5, icon: "▤", label: "Trimsheet", from: ["specs", "model"], note: "Trimsheets and modular UV layouts for reuse.", tools: ["Maya", "Substance Designer"] },
        { id: "material", lane: "tech", col: 3, row: 2, level: 5, max: 5, icon: "◈", label: "Material / Shader", from: ["trim", "texture"], note: "Master materials, material functions, custom shaders.", tools: ["Material Graph", "Shader Graph", "HLSL", "GLSL"] },
        { id: "world", lane: "tech", col: 4, row: 2, level: 4, max: 5, icon: "⁂", label: "World Tech", from: ["material", "env", "dcc"], note: "PCG, procedural foliage, landscape, Lumen lighting.", tools: ["PCG", "HLOD", "Lumen"] },
        { id: "optimize", lane: "tech", col: 5, row: 2, level: 5, max: 5, icon: "ϟ", label: "Optimization", from: ["world", "profile"], note: "Memory, draw calls, LOD / HLOD, texture streaming — milestone-ready builds.", tools: ["LOD", "Mipmap", "Draw calls"] },
        { id: "xr", lane: "tech", col: 6, row: 2, level: 4, max: 5, icon: "◎", label: "XR & Platforms", from: ["optimize"], note: "Holding frame rate on VR/XR headsets, mobile and web.", tools: ["Meta Horizon", "Cocos", "Unity"] },

        // ---- Code: nhánh tools / pipeline (hàng 3) ----
        { id: "python", lane: "code", col: 2, row: 3, level: 4, max: 5, icon: "Py", label: "Python", from: ["core"], note: "Pipeline scripts and batch processing.", tools: ["Python"] },
        { id: "dcc", lane: "code", col: 3, row: 3, level: 4, max: 5, icon: "⌘", label: "DCC Tools", from: ["python"], note: "Maya / Blender add-ons that save artists time.", tools: ["Maya API", "Blender API"] },
        { id: "assetpipe", lane: "code", col: 4, row: 3, level: 4, max: 5, icon: "⇄", label: "Asset Pipeline", from: ["dcc"], note: "Export, validation and version control for art assets.", tools: ["Git", "Perforce"] },
        { id: "aigen", lane: "code", col: 5, row: 3, level: 3, max: 5, icon: "✦", label: "AI Gen", from: ["assetpipe"], note: "Stable Diffusion asset pipeline R&D (Kidmo).", tools: ["Stable Diffusion", "ComfyUI", "LoRA"] },
        { id: "web", lane: "code", col: 6, row: 3, level: 3, max: 5, icon: "</>", label: "Web 3D", from: ["aigen"], note: "This room — Three.js, baked lighting, custom shaders.", tools: ["Three.js", "Vite"] },

        // ---- Code: nhánh gameplay / engine (hàng 4) ----
        { id: "proto", lane: "code", col: 1, row: 4, level: 4, max: 5, icon: "▣", label: "Prototype", from: ["core"], note: "Minimap, pickup, inventory, HUD prototypes.", tools: ["Blueprint"] },
        { id: "cpp", lane: "code", col: 2, row: 4, level: 4, max: 5, icon: "C++", label: "C++ / C#", from: ["proto"], note: "Unreal gameplay classes, Unity scripting.", tools: ["C++", "C#", "Rider"] },
        { id: "gameplay", lane: "code", col: 3, row: 4, level: 3, max: 5, icon: "⚑", label: "Gameplay", from: ["cpp"], note: "Game Mode / State, Pawn, Actor, GAS.", tools: ["GAS", "Gameplay Framework"] },
        { id: "behavior", lane: "code", col: 4, row: 4, level: 3, max: 5, icon: "⌬", label: "AI Behavior", from: ["gameplay"], note: "Behavior Trees, Blackboard, State Tree, EQS.", tools: ["State Tree", "EQS"] },
        { id: "profile", lane: "code", col: 5, row: 4, level: 3, max: 5, icon: "◔", label: "Profiling", from: ["behavior"], note: "Finding the real bottleneck before optimizing.", tools: ["Unreal Insights", "RenderDoc"] },
        { id: "engine", lane: "code", col: 6, row: 4, level: 1, max: 5, icon: "⚙", label: "Engine & Render", from: ["profile", "xr"], note: "Next goal: custom render passes and engine plugins.", tools: ["UE Plugins", "RDG"] },
    ],
    classes: [
        { id: "art", lane: "art", row: 0.5, title: "Environment Artist", from: ["artdir", "render"] },
        { id: "tech", lane: "tech", row: 2, title: "Technical Artist", from: ["xr"], current: true, next: "Next: Lead Technical Artist" },
        { id: "code", lane: "code", row: 3.5, title: "Tools Programmer", from: ["web", "engine"] },
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
