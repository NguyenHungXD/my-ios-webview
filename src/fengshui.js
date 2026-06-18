// === DỮ LIỆU PHONG THỦY / TỬ VI / LỊCH PHÁP ===
// Tách riêng từ CalendarScreen để tái sử dụng

import { THEME } from './theme';

// ==================== CAN CHI ====================
export const CAN_ARRAY = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const CHI_ARRAY = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

// ==================== 60 LỤC THẬP HOA GIÁP NẠP ÂM ====================
export const LUC_THAP_HOA_GIAP = {
  'Giáp Tý': 'Hải Trung Kim', 'Ất Sửu': 'Hải Trung Kim',
  'Bính Dần': 'Lư Trung Hỏa', 'Đinh Mão': 'Lư Trung Hỏa',
  'Mậu Thìn': 'Đại Lâm Mộc', 'Kỷ Tỵ': 'Đại Lâm Mộc',
  'Canh Ngọ': 'Lộ Bàng Thổ', 'Tân Mùi': 'Lộ Bàng Thổ',
  'Nhâm Thân': 'Kiếm Phong Kim', 'Quý Dậu': 'Kiếm Phong Kim',
  'Giáp Tuất': 'Sơn Đầu Hỏa', 'Ất Hợi': 'Sơn Đầu Hỏa',
  'Bính Tý': 'Giản Hạ Thủy', 'Đinh Sửu': 'Giản Hạ Thủy',
  'Mậu Dần': 'Thành Đầu Thổ', 'Kỷ Mão': 'Thành Đầu Thổ',
  'Canh Thìn': 'Bạch Lạp Kim', 'Tân Tỵ': 'Bạch Lạp Kim',
  'Nhâm Ngọ': 'Dương Liễu Mộc', 'Quý Mùi': 'Dương Liễu Mộc',
  'Giáp Thân': 'Tuyền Trung Thủy', 'Ất Dậu': 'Tuyền Trung Thủy',
  'Bính Tuất': 'Ốc Thượng Thổ', 'Đinh Hợi': 'Ốc Thượng Thổ',
  'Mậu Tý': 'Tích Lịch Hỏa', 'Kỷ Sửu': 'Tích Lịch Hỏa',
  'Canh Dần': 'Tùng Bách Mộc', 'Tân Mão': 'Tùng Bách Mộc',
  'Nhâm Thìn': 'Trường Lưu Thủy', 'Quý Tỵ': 'Trường Lưu Thủy',
  'Giáp Ngọ': 'Sa Trung Kim', 'Ất Mùi': 'Sa Trung Kim',
  'Bính Thân': 'Sơn Hạ Hỏa', 'Đinh Dậu': 'Sơn Hạ Hỏa',
  'Mậu Tuất': 'Bình Địa Mộc', 'Kỷ Hợi': 'Bình Địa Mộc',
  'Canh Tý': 'Bích Thượng Thổ', 'Tân Sửu': 'Bích Thượng Thổ',
  'Nhâm Dần': 'Kim Bạch Kim', 'Quý Mão': 'Kim Bạch Kim',
  'Giáp Thìn': 'Phúc Đăng Hỏa', 'Ất Tỵ': 'Phúc Đăng Hỏa',
  'Bính Ngọ': 'Thiên Hà Thủy', 'Đinh Mùi': 'Thiên Hà Thủy',
  'Mậu Thân': 'Đại Trạch Thổ', 'Kỷ Dậu': 'Đại Trạch Thổ',
  'Canh Tuất': 'Thoa Xuyến Kim', 'Tân Hợi': 'Thoa Xuyến Kim',
  'Nhâm Tý': 'Tang Đố Mộc', 'Quý Sửu': 'Tang Đố Mộc',
  'Giáp Dần': 'Đại Khê Thủy', 'Ất Mão': 'Đại Khê Thủy',
  'Bính Thìn': 'Sa Trung Thổ', 'Đinh Tỵ': 'Sa Trung Thổ',
  'Mậu Ngọ': 'Thiên Thượng Hỏa', 'Kỷ Mùi': 'Thiên Thượng Hỏa',
  'Canh Thân': 'Thạch Lựu Mộc', 'Tân Dậu': 'Thạch Lựu Mộc',
  'Nhâm Tuất': 'Đại Hải Thủy', 'Quý Hợi': 'Đại Hải Thủy'
};

// ==================== THẬP THẦN ====================
// [Nhật Can][Day Can]
export const THAP_THAN_MATRIX = [
  ['Tỷ Kiên', 'Kiếp Tài', 'Thực Thần', 'Thương Quan', 'Thiên Tài', 'Chính Tài', 'Thất Sát', 'Chính Quan', 'Thiên Ấn', 'Chính Ấn'],
  ['Kiếp Tài', 'Tỷ Kiên', 'Thương Quan', 'Thực Thần', 'Chính Tài', 'Thiên Tài', 'Chính Quan', 'Thất Sát', 'Chính Ấn', 'Thiên Ấn'],
  ['Thiên Ấn', 'Chính Ấn', 'Tỷ Kiên', 'Kiếp Tài', 'Thực Thần', 'Thương Quan', 'Thiên Tài', 'Chính Tài', 'Thất Sát', 'Chính Quan'],
  ['Chính Ấn', 'Thiên Ấn', 'Kiếp Tài', 'Tỷ Kiên', 'Thương Quan', 'Thực Thần', 'Chính Tài', 'Thiên Tài', 'Chính Quan', 'Thất Sát'],
  ['Thất Sát', 'Chính Quan', 'Thiên Ấn', 'Chính Ấn', 'Tỷ Kiên', 'Kiếp Tài', 'Thực Thần', 'Thương Quan', 'Thiên Tài', 'Chính Tài'],
  ['Chính Quan', 'Thất Sát', 'Chính Ấn', 'Thiên Ấn', 'Kiếp Tài', 'Tỷ Kiên', 'Thương Quan', 'Thực Thần', 'Chính Tài', 'Thiên Tài'],
  ['Thiên Tài', 'Chính Tài', 'Thất Sát', 'Chính Quan', 'Thiên Ấn', 'Chính Ấn', 'Tỷ Kiên', 'Kiếp Tài', 'Thực Thần', 'Thương Quan'],
  ['Chính Tài', 'Thiên Tài', 'Chính Quan', 'Thất Sát', 'Chính Ấn', 'Thiên Ấn', 'Kiếp Tài', 'Tỷ Kiên', 'Thương Quan', 'Thực Thần'],
  ['Thực Thần', 'Thương Quan', 'Thiên Tài', 'Chính Tài', 'Thất Sát', 'Chính Quan', 'Thiên Ấn', 'Chính Ấn', 'Tỷ Kiên', 'Kiếp Tài'],
  ['Thương Quan', 'Thực Thần', 'Chính Tài', 'Thiên Tài', 'Chính Quan', 'Thất Sát', 'Chính Ấn', 'Thiên Ấn', 'Kiếp Tài', 'Tỷ Kiên']
];

export const THAP_THAN_DESC = {
  'Tỷ Kiên': { desc: 'Bạn bè tương trợ. Cạnh tranh công bằng.', color: THEME.accentBlue },
  'Kiếp Tài': { desc: 'Hao tài tốn của, mâu thuẫn lợi ích. Kỵ đầu tư.', color: THEME.accentRed },
  'Thực Thần': { desc: 'Phúc lộc tự đến, tinh thần thoải mái. Hợp nghệ thuật.', color: THEME.accentGreen },
  'Thương Quan': { desc: 'Dễ nảy sinh thị phi, bất mãn. Hãy nhẫn nhịn.', color: THEME.accentRed },
  'Thiên Tài': { desc: 'Lộc lá bất ngờ, hoạch tài. Rất tốt cho đầu tư buôn bán.', color: THEME.accentGold },
  'Chính Tài': { desc: 'Tài lộc ổn định từ công việc chính. Có làm có ăn.', color: THEME.accentGreen },
  'Thất Sát': { desc: 'Áp lực mạnh, gặp tiểu nhân. Cần quyết đoán giải quyết.', color: THEME.accentRed },
  'Chính Quan': { desc: 'Công danh thuận lợi, quý nhân nâng đỡ. Tốt cho thi cử.', color: THEME.accentGold },
  'Thiên Ấn': { desc: 'Ý tưởng độc đáo, trực giác nhạy. Hợp làm việc độc lập.', color: THEME.accentBlue },
  'Chính Ấn': { desc: 'Được che chở, bình an. Tốt cho học tập, giấy tờ.', color: THEME.accentGreen }
};

// ==================== THẬP NHỊ TRỰC ====================
export const TRUC_ARRAY = ['Kiến', 'Trừ', 'Mãn', 'Bình', 'Định', 'Chấp', 'Phá', 'Nguy', 'Thành', 'Thâu', 'Khai', 'Bế'];

export const getTruc = (lunarMonth, dayChiStr) => {
  const monthToChiIdx = [null, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];
  const monthChiIdx = monthToChiIdx[lunarMonth] !== undefined ? monthToChiIdx[lunarMonth] : 2;
  const dayChiIdx = CHI_ARRAY.indexOf(dayChiStr);
  const trucIdx = (dayChiIdx - monthChiIdx + 12) % 12;
  return TRUC_ARRAY[trucIdx];
};

export const TRUC_DESC = {
  'Kiến': 'Vạn vật sinh sôi. Khởi sự, xuất hành cực tốt.',
  'Trừ': 'Trừ bỏ cái xấu. Nên dọn dẹp, chữa bệnh.',
  'Mãn': 'Đầy đủ, viên mãn. Rất tốt cho cầu tài, kết hôn.',
  'Bình': 'San bằng mọi thứ. Tốt cho hòa giải, tu sửa.',
  'Định': 'Ổn định, an bài. Tốt cho an tọa, giao dịch.',
  'Chấp': 'Cố chấp, giữ gìn. Tốt lập khế ước. Kỵ xuất hành.',
  'Phá': 'Hao tốn. KIÊNG KỴ xây cất, cưới hỏi, nhậm chức.',
  'Nguy': 'Bấp bênh. Kỵ leo cao, đi thuyền, cẩn trọng.',
  'Thành': 'Thành tựu. CỰC TỐT cho khai trương, cưới hỏi.',
  'Thâu': 'Thu hoạch. Tốt cho mua bán, thu nợ, cất giữ.',
  'Khai': 'Mở mang. Tốt cho công danh, khai trương.',
  'Bế': 'Bế tắc. Chỉ nên làm việc nội bộ, dặm vá.'
};

// ==================== ĐỊA CHI XUNG/HỢP ====================
export const LUC_XUNG = { 'Tý':'Ngọ', 'Ngọ':'Tý', 'Sửu':'Mùi', 'Mùi':'Sửu', 'Dần':'Thân', 'Thân':'Dần', 'Mão':'Dậu', 'Dậu':'Mão', 'Thìn':'Tuất', 'Tuất':'Thìn', 'Tỵ':'Hợi', 'Hợi':'Tỵ' };
export const LUC_HOP = { 'Tý':'Sửu', 'Sửu':'Tý', 'Dần':'Hợi', 'Hợi':'Dần', 'Mão':'Tuất', 'Tuất':'Mão', 'Thìn':'Dậu', 'Dậu':'Thìn', 'Tỵ':'Thân', 'Thân':'Tỵ', 'Ngọ':'Mùi', 'Mùi':'Ngọ' };
export const TAM_HOP = [ ['Thân','Tý','Thìn'], ['Dần','Ngọ','Tuất'], ['Tỵ','Dậu','Sửu'], ['Hợi','Mão','Mùi'] ];

export const checkDiaChi = (myChi, dayChi) => {
  if (LUC_XUNG[myChi] === dayChi) return { type: 'Lục Xung (Đại Hung)', color: THEME.accentRed, desc: `Tuổi ${myChi} xung chiếu cực mạnh với ngày ${dayChi}. Tránh đi xa, cẩn thận tai nạn.` };
  if (LUC_HOP[myChi] === dayChi) return { type: 'Lục Hợp (Đại Cát)', color: THEME.accentGreen, desc: `Tuổi ${myChi} hợp với Ngày ${dayChi}. Có quý nhân phù trợ, gia đạo vui vẻ.` };
  for (let group of TAM_HOP) {
    if (group.includes(myChi) && group.includes(dayChi) && myChi !== dayChi) {
      return { type: 'Tam Hợp (Tốt)', color: THEME.accentGreen, desc: `Tuổi ${myChi} thuộc Tam Hợp với ngày ${dayChi}. Vận khí tốt đẹp.` };
    }
  }
  return { type: 'Bình Thường', color: THEME.textSub, desc: `Ngày ${dayChi} không xung khắc với tuổi ${myChi}.` };
};

// ==================== GIỜ HOÀNG ĐẠO ====================
export const getGioHoangDao = (dayChiStr) => {
  const hoangDaoMap = {
    'Tý': ['Tý', 'Sửu', 'Mão', 'Ngọ', 'Thân', 'Dậu'],
    'Ngọ': ['Tý', 'Sửu', 'Mão', 'Ngọ', 'Thân', 'Dậu'],
    'Sửu': ['Dần', 'Mão', 'Tỵ', 'Thân', 'Tuất', 'Hợi'],
    'Mùi': ['Dần', 'Mão', 'Tỵ', 'Thân', 'Tuất', 'Hợi'],
    'Dần': ['Tý', 'Sửu', 'Thìn', 'Tỵ', 'Mùi', 'Tuất'],
    'Thân': ['Tý', 'Sửu', 'Thìn', 'Tỵ', 'Mùi', 'Tuất'],
    'Mão': ['Tý', 'Dần', 'Mão', 'Ngọ', 'Mùi', 'Dậu'],
    'Dậu': ['Tý', 'Dần', 'Mão', 'Ngọ', 'Mùi', 'Dậu'],
    'Thìn': ['Dần', 'Thìn', 'Tỵ', 'Thân', 'Dậu', 'Hợi'],
    'Tuất': ['Dần', 'Thìn', 'Tỵ', 'Thân', 'Dậu', 'Hợi'],
    'Tỵ': ['Sửu', 'Thìn', 'Ngọ', 'Mùi', 'Tuất', 'Hợi'],
    'Hợi': ['Sửu', 'Thìn', 'Ngọ', 'Mùi', 'Tuất', 'Hợi']
  };
  return hoangDaoMap[dayChiStr] || [];
};

// ==================== NGÀY LỄ ====================
// Lunar holidays
export const LUNAR_HOLIDAYS = {
  '1/1': 'Tết Nguyên Đán',
  '15/1': 'Tết Nguyên Tiêu',
  '10/3': 'Giỗ Tổ Hùng Vương',
  '15/4': 'Lễ Phật Đản',
  '5/5': 'Tết Đoan Ngọ',
  '15/7': 'Lễ Vu Lan',
  '15/8': 'Tết Trung Thu',
  '23/12': 'Ông Công Ông Táo'
};

// Solar holidays (cố định theo dương lịch)
export const SOLAR_HOLIDAYS = {
  '1/1': 'Tết Dương Lịch',
  '30/4': 'Ngày Giải Phóng',
  '1/5': 'Quốc Tế Lao Động',
  '2/9': 'Quốc Khánh'
};

export const getHoliday = (lunarDay, lunarMonth, solarDay, solarMonth) => {
  const lunarKey = `${lunarDay}/${lunarMonth}`;
  const solarKey = `${solarDay}/${solarMonth}`;
  return LUNAR_HOLIDAYS[lunarKey] || SOLAR_HOLIDAYS[solarKey] || null;
};

// ==================== NGŨ HÀNH ====================
// Mỗi Can index 0-9
export const NGU_HANH_ELEMENT_CAN = [
  'Mộc', 'Mộc', // Giáp=0, Ất=1
  'Hỏa', 'Hỏa', // Bính=2, Đinh=3
  'Thổ', 'Thổ', // Mậu=4, Kỷ=5
  'Kim', 'Kim', // Canh=6, Tân=7
  'Thủy', 'Thủy' // Nhâm=8, Quý=9
];

// Mỗi Chi index 0-11
export const NGU_HANH_ELEMENT_CHI = [
  'Thủy', // Tý=0
  'Thổ',  // Sửu=1
  'Mộc',  // Dần=2
  'Mộc',  // Mão=3
  'Thổ',  // Thìn=4
  'Hỏa',  // Tỵ=5
  'Hỏa',  // Ngọ=6
  'Thổ',  // Mùi=7
  'Kim',  // Thân=8
  'Kim',  // Dậu=9
  'Thổ',  // Tuất=10
  'Thủy'  // Hợi=11
];

export const NGU_HANH_COLORS = {
  'Kim': '#FFFFFF',
  'Mộc': '#2ECC71',
  'Thủy': '#3498DB',
  'Hỏa': '#E74C3C',
  'Thổ': '#F1C40F'
};

// Tương Sinh: Thổ → Kim → Thủy → Mộc → Hỏa → Thổ
export const NGU_HANH_SINH = { 'Thổ': 'Kim', 'Kim': 'Thủy', 'Thủy': 'Mộc', 'Mộc': 'Hỏa', 'Hỏa': 'Thổ' };
// Tương Khắc: Thổ → Thủy → Hỏa → Kim → Mộc → Thổ
export const NGU_HANH_KHAC = { 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim', 'Kim': 'Mộc', 'Mộc': 'Thổ' };

export const getElementCan = (idx) => NGU_HANH_ELEMENT_CAN[idx] || 'Thổ';
export const getElementChi = (idx) => NGU_HANH_ELEMENT_CHI[idx] || 'Thổ';

export const getNguHanhRelation = (elemA, elemB) => {
  if (elemA === elemB) return { type: 'Bình', desc: `${elemA} - ${elemB} đồng hành`, color: THEME.textSub };
  if (NGU_HANH_SINH[elemA] === elemB) return { type: 'Tương Sinh', desc: `${elemA} Sinh ${elemB} — rất tốt`, color: THEME.accentGreen };
  if (NGU_HANH_KHAC[elemA] === elemB) return { type: 'Tương Khắc', desc: `${elemA} Khắc ${elemB} — xấu`, color: THEME.accentRed };
  if (NGU_HANH_KHAC[elemB] === elemA) return { type: 'Được Sinh', desc: `${elemB} Sinh ${elemA} — tốt`, color: THEME.accentGreen };
  if (NGU_HANH_SINH[elemB] === elemA) return { type: 'Bị Khắc', desc: `${elemB} Khắc ${elemA} — xấu`, color: THEME.accentRed };
  // Không liên quan trong vòng Sinh/Khắc → Bình
  // VD: Thủy vs Hỏa (Thủy khắc Hỏa) hoặc Thủy vs Mộc (Thủy sinh Mộc)
  // Đây là cases còn lại: Mộc vs Thổ (Mộc khắc Thổ), Hỏa vs Thủy (Thủy khắc Hỏa)...
  // Thử reverse
  if (NGU_HANH_SINH[elemB] === elemA) return { type: 'Được Sinh', desc: `${elemB} Sinh ${elemA} — tốt`, color: THEME.accentGreen };
  if (NGU_HANH_KHAC[elemB] === elemA) return { type: 'Bị Khắc', desc: `${elemB} Khắc ${elemA} — xấu`, color: THEME.accentRed };
  return { type: 'Bình', desc: `${elemA} - ${elemB} không quan hệ`, color: THEME.textSub };
};

// ==================== CAN CHI CHO THÁNG ====================
// Month Chi: tháng 1 (Giêng) = Dần (index 2), tháng 12 (Chạp) = Sửu (index 1)
export const getMonthChiIdx = (lunarMonth) => (lunarMonth + 1) % 12;

// Month Can: base = yearCanIdx % 5 * 2, sau đó + (lunarMonth - 1), % 10
export const getMonthCanIdx = (lunarMonth, yearCanIdx) => (yearCanIdx % 5 * 2 + lunarMonth - 1) % 10;

// ==================== CAN CHI CHO GIỜ ====================
// 23-0=Tý(0), 1-2=Sửu(1), 3-4=Dần(2), 5-6=Mão(3), 7-8=Thìn(4), 9-10=Tỵ(5),
// 11-12=Ngọ(6), 13-14=Mùi(7), 15-16=Thân(8), 17-18=Dậu(9), 19-20=Tuất(10), 21-22=Hợi(11)
export const getHourChiIdx = (hour) => Math.floor((hour + 1) / 2) % 12;

// Hour Can: base = dayCanIdx % 5 * 2, + hourChiIdx, % 10
export const getHourCanIdx = (hourChiIdx, dayCanIdx) => (dayCanIdx % 5 * 2 + hourChiIdx) % 10;

// ==================== CỬU TINH (9 STAR KI) ====================
export const getCuuTinh = (lunarYear, lunarDay) => ((lunarYear + lunarDay) % 9) + 1;

export const CUU_TINH_INFO = {
  1: { name: 'Nhất Bạch', element: 'Thủy', meaning: 'Tài lộc, danh vọng. Tốt cho cầu tài, thi cử.' },
  2: { name: 'Nhị Hắc', element: 'Thổ', meaning: 'Bệnh tật, thị phi. Tránh việc lớn.' },
  3: { name: 'Tam Bích', element: 'Mộc', meaning: 'Khẩu thiệt, kiện tụng. Cẩn trọng lời nói.' },
  4: { name: 'Tứ Lục', element: 'Mộc', meaning: 'Văn chương, học vấn. Tốt cho sáng tác.' },
  5: { name: 'Ngũ Hoàng', element: 'Thổ', meaning: 'Tai họa lớn. Đại Kỵ: xây cất, xuất hành.' },
  6: { name: 'Lục Bạch', element: 'Kim', meaning: 'Quan lộc, quý nhân. Rất tốt.' },
  7: { name: 'Thất Xích', element: 'Kim', meaning: 'Phá tài, mất mát. Thận trọng tiền bạc.' },
  8: { name: 'Bát Bạch', element: 'Thổ', meaning: 'Phúc lộc dồi dào. Đại Cát: cưới hỏi, xây cất.' },
  9: { name: 'Cửu Tử', element: 'Hỏa', meaning: 'Hỏa hoạn, vội vã. Cẩn thận lửa, xung đột.' }
};

export const getCuuTinhInfo = (lunarYear, lunarDay) => {
  const star = getCuuTinh(lunarYear, lunarDay);
  return { star, ...CUU_TINH_INFO[star] };
};

// ==================== TIẾT KHÍ ====================
// 24 tiết khí theo thứ tự, bắt đầu từ Tiểu Hàn (tháng 1)
export const TIET_KHI_NAMES = [
  'Tiểu Hàn', 'Đại Hàn', 'Lập Xuân', 'Vũ Thủy', 'Kinh Trập', 'Xuân Phân',
  'Thanh Minh', 'Cốc Vũ', 'Lập Hạ', 'Tiểu Mãn', 'Mãn Chủng', 'Hạ Chí',
  'Tiểu Thử', 'Đại Thử', 'Lập Thu', 'Xử Thử', 'Bạch Lộ', 'Thu Phân',
  'Hàn Lộ', 'Sương Giáng', 'Lập Đông', 'Tiểu Tuyết', 'Đại Tuyết', 'Đông Chí'
];

// Ngày gần đúng (tháng, ngày) cho mỗi tiết khí — sai số ±1 ngày
export const TIET_KHI_DATES = [
  [1, 6], [1, 20], [2, 4], [2, 19], [3, 6], [3, 21],
  [4, 5], [4, 20], [5, 5], [5, 21], [6, 6], [6, 21],
  [7, 6], [7, 22], [8, 7], [8, 23], [9, 7], [9, 23],
  [10, 8], [10, 23], [11, 7], [11, 22], [12, 7], [12, 21]
];

export const TIET_KHI_DESC = {
  'Tiểu Hàn': 'Rét nhẹ, bắt đầu đợt rét đậm.',
  'Đại Hàn': 'Rét nhất trong năm.',
  'Lập Xuân': 'Bắt đầu mùa xuân.',
  'Vũ Thủy': 'Ẩm ướt, mưa phùn.',
  'Kinh Trập': 'Sâu nở, côn trùng hoạt động.',
  'Xuân Phân': 'Ngày dài bằng đêm.',
  'Thanh Minh': 'Trời trong sáng, đi tảo mộ.',
  'Cốc Vũ': 'Mưa rào, mạ non tốt.',
  'Lập Hạ': 'Bắt đầu mùa hè.',
  'Tiểu Mãn': 'Lúa trổ đòng.',
  'Mãn Chủng': 'Mưa lớn, lúa chắc hạt.',
  'Hạ Chí': 'Ngày dài nhất năm.',
  'Tiểu Thử': 'Nóng oi bức.',
  'Đại Thử': 'Nóng nhất năm.',
  'Lập Thu': 'Bắt đầu mùa thu.',
  'Xử Thử': 'Mưa ngâu, hết nóng.',
  'Bạch Lộ': 'Sương mù, mát mẻ.',
  'Thu Phân': 'Ngày bằng đêm.',
  'Hàn Lộ': 'Lạnh dần, sương nhiều.',
  'Sương Giáng': 'Sương muối xuất hiện.',
  'Lập Đông': 'Bắt đầu mùa đông.',
  'Tiểu Tuyết': 'Tuyết nhẹ (miền Bắc).',
  'Đại Tuyết': 'Tuyết dày (miền Bắc).',
  'Đông Chí': 'Đêm dài nhất năm.'
};

export const getTietKhi = (solarMonth, solarDay) => {
  // Tìm chính xác hoặc lân cận ±1 ngày
  for (let i = 0; i < TIET_KHI_DATES.length; i++) {
    const [m, d] = TIET_KHI_DATES[i];
    if (m === solarMonth && Math.abs(solarDay - d) <= 1) {
      return {
        name: TIET_KHI_NAMES[i],
        exact: solarDay === d,
        desc: TIET_KHI_DESC[TIET_KHI_NAMES[i]] || ''
      };
    }
  }
  return null;
};

// ==================== DAY SCORE (đánh giá ngày tốt/xấu) ====================
export const getDayScore = (truc, userChi, dayChi) => {
  let score = 0;
  const trucScores = { 'Kiến': 2, 'Trừ': 1, 'Mãn': 2, 'Bình': 0, 'Định': 2, 'Chấp': 0, 'Phá': -2, 'Nguy': -1, 'Thành': 3, 'Thâu': 1, 'Khai': 2, 'Bế': -1 };
  score += trucScores[truc] || 0;
  if (LUC_XUNG[userChi] === dayChi) score -= 2;
  if (LUC_HOP[userChi] === dayChi) score += 2;
  for (const group of TAM_HOP) {
    if (group.includes(userChi) && group.includes(dayChi) && userChi !== dayChi) { score += 1; break; }
  }
  return score;
};
