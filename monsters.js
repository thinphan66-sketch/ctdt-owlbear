// Thư viện Quái Vật & Boss Tầng 1 (Chuẩn Canon + Luật DC Động 10 + CS)
export const MONSTER_LIBRARY = [
  {
    id: "m-docthi",
    name: "Huyết Căn Độc Thi Non",
    tier: "Buổi 1 · Trận 1 (Tinh Nhuệ)",
    color: "#c53030",
    maxHp: 28, pn: 2, maxStagger: 4, maxLl: 0, speed: "5 Ô",
    stats: "KH 4 · NN 3",
    ai: "Mất lý trí — luôn lao húc mục tiêu gần nhất hoặc kẻ gây ST mạnh nhất.",
    skills: [
      { name: "Húc Điên (Main)", text: "7 ST + Đẩy lùi 1 Ô.", dmg: 7 },
      { name: "Điểm Yếu — Cọc Đen", text: "Nhắm đánh gãy cọc (NN vs DC 10+NN = 13) → mất ngay 8 Máu + trừ 2 Thế!", dmg: 0 },
      { name: "Tự Nổ Khi Chết", text: "Nổ khói độc 1 Ô (Kháng KH vs DC 10+KH = 14 kẻo nhận 3 ST).", dmg: 3 }
    ]
  },
  {
    id: "m-xichdien-dao",
    name: "Đao Khách Xích Diện",
    tier: "Buổi 1 · Trận 1 (Thường)",
    color: "#dd6b20",
    maxHp: 18, pn: 1, maxStagger: 0, maxLl: 0, speed: "6 Ô",
    stats: "KH 3 · NN 3",
    ai: "1 tên lao cướp hộp Tiểu An, 1 tên chặn tuyến đầu PC.",
    skills: [
      { name: "Chém Áp Chế (Main)", text: "6 ST (+1 ST lên Lá Chắn).", dmg: 6 }
    ]
  },
  {
    id: "m-xichdien-cung",
    name: "Cung Thủ Xích Diện",
    tier: "Buổi 1 · Trận 1 (Tầm xa)",
    color: "#d69e2e",
    maxHp: 14, pn: 0, maxStagger: 0, maxLl: 0, speed: "6 Ô",
    stats: "NN 4 · Tầm 8 Ô",
    ai: "Nấp sau Xe Bò (+2 PN) bắn rỉa Pháp sư / Healer.",
    skills: [
      { name: "Bắn Rỉa (Main · 8 Ô)", text: "5 ST vật lý tầm xa.", dmg: 5 }
    ]
  },
  {
    id: "m-tieuan",
    name: "Tiểu An (Đồng Minh)",
    tier: "Buổi 1 · Trận 1 (NPC Bảo Vệ)",
    color: "#38a169",
    maxHp: 8, pn: 0, maxStagger: 0, maxLl: 0, speed: "5 Ô",
    stats: "Phàm nhân / Khảo sát",
    ai: "Ôm chặt hộp gỗ bò lùi về phía PC hoặc nấp sau Quầy Đá.",
    skills: [
      { name: "Cầu Cứu", text: "Bò lùi tìm chỗ nấp; KHÔNG bất tử." }
    ]
  },
  {
    id: "m-tramdoc",
    name: "Mini-Boss TRẦM ĐỘC",
    tier: "Buổi 1 · Trận 2 (Mini-Boss)",
    color: "#805ad5",
    maxHp: 48, pn: 2, maxStagger: 6, maxLl: 20, speed: "6 Ô",
    phase2At: 24, resistPoints: 2,
    stats: "KH 3 · CK 5 · TT 4 · NN 4 · Kháng Kiếp: 2",
    ai: "Giữ vị trí gần Cọc hồi +3 Máu/+2 LL; ≤ 24 Máu bật Phase 2 đánh liều mạng.",
    skills: [
      { name: "Huyết Độc Tiễn (Main · 2 LL · 6 Ô)", text: "8 ST + Độc (2 ST/lượt, Kháng KH vs DC Phép 10+CK = 15).", dmg: 8 },
      { name: "Rút Mạch Quật (Hành Động Boss)", text: "Hất sóng bùn đẩy lùi 2 Ô ai đứng sát Cọc.", dmg: 4 },
      { name: "TELEGRAPH — Bạo Cọc Độc Vụ (3 Ô)", text: "Cuối lượt báo trước → lượt sau 2 Cọc nổ 3 Ô gây 12 ST + Độc + Ăn Mòn (-2 PN)! Phá Cọc ngắt ngay!", dmg: 12, telegraph: 3 },
      { name: "PHASE 2 (≤ 24 Máu)", text: "+2 ST mọi đòn, cận chiến gây Chảy Máu, tự mất 2 Máu/lượt." }
    ]
  },
  {
    id: "m-coc",
    name: "Cọc Rút Mạch",
    tier: "Buổi 1 · Trận 2 (Mục Tiêu Kép)",
    color: "#6b46c1",
    maxHp: 10, pn: 1, maxStagger: 0, maxLl: 0, speed: "0 Ô",
    stats: "Vật thể trận pháp",
    ai: "Hút 1 LL của PC trong 2 Ô; hồi +3 Máu/+2 LL cho Trầm Độc. Vỡ → Boss ăn 4 ST + -2 Thế!",
    skills: [
      { name: "Hút Linh Mạch (Bị động)", text: "PC trong 2 Ô mất 1 LL đầu lượt; Trầm Độc hồi +3 Máu & +2 LL." }
    ]
  },
  {
    id: "m-lang",
    name: "Thiết Bì Lang (BST-01)",
    tier: "Buổi 1 · Trận 2 (Pack)",
    color: "#9b2c2c",
    maxHp: 20, pn: 2, maxStagger: 3, maxLl: 0, speed: "6 Ô",
    stats: "KH 4 · NN 3 · Yếu trước Chùy/Chấn Động",
    ai: "Đi theo cặp cùng cắn 1 mục tiêu để kích thưởng Pack (+2 ST & Ngã).",
    skills: [
      { name: "Cắn Vỏ Đá (Main)", text: "7 ST (+2 ST & Ngã Kháng KH vs DC 10+KH=14 nếu 2 con cùng cắn 1 người).", dmg: 7 }
    ]
  },
  {
    id: "m-phuta",
    name: "Phụ Tá Cọc Giả",
    tier: "Buổi 1 · Trận 2 (Debuffer)",
    color: "#b7791f",
    maxHp: 16, pn: 1, maxStagger: 0, maxLl: 0, speed: "5 Ô",
    stats: "TT 3 · Tầm 5 Ô",
    ai: "Nấp sau tảng đá ném bột độc phá tập trung Pháp sư/Healer.",
    skills: [
      { name: "Bột Độc Mê Tâm (Main · 5 Ô)", text: "5 ST + Mất Tập Trung (Kháng TT vs DC 10+TT = 13).", dmg: 5 }
    ]
  },
  {
    id: "m-langvuong",
    name: "BOSS — Thiết Giáp Ma Lang Vương",
    tier: "Buổi 2 · Boss Đoạn Trụ Cốc (BOS-01)",
    color: "#742a2a",
    maxHp: 78, pn: 3, maxStagger: 8, maxLl: 18, speed: "7 Ô",
    phase2At: 39, resistPoints: 3,
    stats: "KH 6 · CK 4 · TT 4 · NN 5 · Kháng Kiếp: 3",
    ai: "Săn con mồi đơn lẻ; hú gọi đàn; ≤ 39 Máu vỡ giáp tăng tốc & sát thương.",
    skills: [
      { name: "Trảo Xé Đá (Main)", text: "11 ST + Chảy Máu (Kháng KH vs DC 10+KH = 16).", dmg: 11 },
      { name: "TELEGRAPH — Sói Gầm Chấn Địa (3 Ô)", text: "Báo trước 1 vòng → 10 ST + Ngã (Kháng KH vs DC 16) + Mất Tập Trung!", dmg: 10, telegraph: 3 }
    ]
  }
];

export const STATUS_LIST = [
  { id: "wet", label: "Làm Ướt", icon: "💧", elem: "Thủy" },
  { id: "chill", label: "Tê Cóng", icon: "❄️", elem: "Băng" },
  { id: "burn", label: "Thiêu Đốt", icon: "🔥", elem: "Hỏa", dot: "2 ST Hỏa đầu lượt" },
  { id: "shock", label: "Tê Liệt", icon: "⚡", elem: "Lôi" },
  { id: "wind", label: "Phong Ấn", icon: "🌪️", elem: "Phong" },
  { id: "earth", label: "Thổ Khí", icon: "🪨", elem: "Thổ" },
  { id: "wood", label: "Mộc Khí", icon: "🌿", elem: "Mộc" },
  { id: "metal", label: "Kim Khí", icon: "⚔️", elem: "Kim" },
  { id: "poison", label: "Độc", icon: "☠️", dot: "2 ST Độc đầu lượt" },
  { id: "bleed", label: "Chảy Máu", icon: "🩸", dot: "2 ST Chảy Máu đầu lượt" },
  { id: "freeze", label: "Đóng Băng", icon: "🧊", hardCC: true },
  { id: "taunt", label: "Khiêu Khích", icon: "🛡️" },
  { id: "root", label: "Khóa Chân", icon: "⛓️" },
  { id: "prone", label: "Ngã", icon: "⬇️" },
  { id: "daze", label: "Mất Tập Trung", icon: "💫" },
  { id: "cc_imm", label: "+4 Kháng CC", icon: "🔰" }
];

// 9 Phản Ứng Nguyên Tố Canon
export const ELEMENTAL_REACTIONS = [
  { a: "burn", b: "wind", name: "BÃO LỬA", desc: "+1 Ô vùng nổ & +4 ST Hỏa!" },
  { a: "burn", b: "wet", name: "BỐC HƠI", desc: "+5 ST & tạo màn khói che tầm nhìn 3×3 Ô!" },
  { a: "burn", b: "chill", name: "BỐC HƠI", desc: "+5 ST & xóa Tê Cóng tạo màn khói!" },
  { a: "wet", b: "chill", name: "ĐÓNG BĂNG NGAY", desc: "Địch phải Kháng KH vs DC Phép (10 + CK) kẻo bị Đóng Băng 1 vòng!" },
  { a: "wet", b: "shock", name: "ĐIỆN GIẬT", desc: "+4 ST Lôi lan vùng ẩm & gây Tê Liệt!" },
  { a: "chill", b: "shock", name: "GIÒN VỠ", desc: "+5 ST Xuyên Giáp & giảm -2 PN trong 2 vòng!" },
  { a: "earth", b: "wet", name: "BÙN LẦY", desc: "Tạo vùng Địa Hình Khó & Khóa Chân mục tiêu!" },
  { a: "earth", b: "burn", name: "DUNG NHAM", desc: "4 ST/lượt & Ăn Mòn -1 PN!" },
  { a: "wet", b: "wood", name: "SINH TRƯỞNG", desc: "+50% hiệu quả Hồi Máu hoặc Trói Buộc!" },
  { a: "metal", b: "shock", name: "DẪN LÔI", desc: "+4 ST Lôi & trừ ngay 2 điểm Thanh Thế!" }
];
