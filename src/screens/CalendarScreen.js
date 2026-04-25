import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform, Animated, PanResponder } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
const amlich = require('amlich');

const THEME = {
  bg: '#121214',
  card: '#1C1C20',
  header: '#0D0D0F',
  textLight: '#F5F5F5',
  textSub: '#A0A0A0',
  accentGold: '#D4AF37', 
  accentRed: '#C0392B',  
  accentGreen: '#27AE60',
  accentBlue: '#3498DB',
  border: '#2C2C32',
  weekendText: '#E74C3C',
  moonColor: '#F39C12',
  modalBg: 'rgba(10, 10, 12, 0.95)'
};

const CAN_ARRAY = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI_ARRAY = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

// 60 Lục Thập Hoa Giáp Nạp Âm
const LUC_THAP_HOA_GIAP = {
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

// Thập Thần Matrix [Nhật Can][Day Can]
const THAP_THAN_MATRIX = [
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

const THAP_THAN_DESC = {
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

const TRUC_ARRAY = ['Kiến', 'Trừ', 'Mãn', 'Bình', 'Định', 'Chấp', 'Phá', 'Nguy', 'Thành', 'Thâu', 'Khai', 'Bế'];
const getTruc = (lunarMonth, dayChiStr) => {
  const monthToChiIdx = [null, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];
  const monthChiIdx = monthToChiIdx[lunarMonth] !== undefined ? monthToChiIdx[lunarMonth] : 2;
  const dayChiIdx = CHI_ARRAY.indexOf(dayChiStr);
  let trucIdx = (dayChiIdx - monthChiIdx + 12) % 12;
  return TRUC_ARRAY[trucIdx];
};
const TRUC_DESC = {
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

const checkDiaChi = (myChi, dayChi) => {
  const LUC_XUNG = { 'Tý':'Ngọ', 'Ngọ':'Tý', 'Sửu':'Mùi', 'Mùi':'Sửu', 'Dần':'Thân', 'Thân':'Dần', 'Mão':'Dậu', 'Dậu':'Mão', 'Thìn':'Tuất', 'Tuất':'Thìn', 'Tỵ':'Hợi', 'Hợi':'Tỵ' };
  const LUC_HOP = { 'Tý':'Sửu', 'Sửu':'Tý', 'Dần':'Hợi', 'Hợi':'Dần', 'Mão':'Tuất', 'Tuất':'Mão', 'Thìn':'Dậu', 'Dậu':'Thìn', 'Tỵ':'Thân', 'Thân':'Tỵ', 'Ngọ':'Mùi', 'Mùi':'Ngọ' };
  const TAM_HOP = [ ['Thân','Tý','Thìn'], ['Dần','Ngọ','Tuất'], ['Tỵ','Dậu','Sửu'], ['Hợi','Mão','Mùi'] ];

  if (LUC_XUNG[myChi] === dayChi) return { type: 'Lục Xung (Đại Hung)', color: THEME.accentRed, desc: `Tuổi ${myChi} xung chiếu cực mạnh với ngày ${dayChi}. Tránh đi xa, cẩn thận tai nạn.` };
  if (LUC_HOP[myChi] === dayChi) return { type: 'Lục Hợp (Đại Cát)', color: THEME.accentGreen, desc: `Tuổi ${myChi} hợp với Ngày ${dayChi}. Có quý nhân phù trợ, gia đạo vui vẻ.` };
  
  for(let group of TAM_HOP) {
    if (group.includes(myChi) && group.includes(dayChi) && myChi !== dayChi) {
      return { type: 'Tam Hợp (Tốt)', color: THEME.accentGreen, desc: `Tuổi ${myChi} thuộc Tam Hợp với ngày ${dayChi}. Vận khí tốt đẹp.` };
    }
  }
  return { type: 'Bình Thường', color: THEME.textSub, desc: `Ngày ${dayChi} không xung khắc với tuổi ${myChi}.` };
};

const getGioHoangDao = (dayChiStr) => {
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

const getHoliday = (lunarDay, lunarMonth) => {
  const holidays = {
    '1/1': 'Tết Nguyên Đán',
    '15/1': 'Tết Nguyên Tiêu',
    '10/3': 'Giỗ Tổ Hùng Vương',
    '15/4': 'Lễ Phật Đản',
    '5/5': 'Tết Đoan Ngọ',
    '15/7': 'Lễ Vu Lan',
    '15/8': 'Tết Trung Thu',
    '23/12': 'Ông Công Ông Táo'
  };
  return holidays[`${lunarDay}/${lunarMonth}`];
};

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarGrid, setCalendarGrid] = useState([]);
  const [detailInfo, setDetailInfo] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 20,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
          Haptics.selectionAsync();
        } else if (gestureState.dx < -50) {
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
          Haptics.selectionAsync();
        }
      }
    })
  ).current;

  // Pulse animation for selected cell
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  // Profile State
  const [profile, setProfile] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [inpName, setInpName] = useState('');
  const [inpDOB, setInpDOB] = useState(''); // DD-MM-YYYY

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { generateCalendar(currentDate); }, [currentDate]);
  useEffect(() => { updateDetailInfo(selectedDate, profile); }, [selectedDate, profile]);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('USER_BAZI_PROFILE');
      if (stored) setProfile(JSON.parse(stored));
    } catch(e){}
  };

  const saveProfile = async () => {
    if(!inpName || !inpDOB) return Alert.alert('Lỗi', 'Vui lòng nhập tên và ngày sinh');
    const parts = inpDOB.split(/[-/]/);
    if(parts.length !== 3) return Alert.alert('Lỗi', 'Ngày sinh phải có dạng DD-MM-YYYY');
    
    const d = parseInt(parts[0]), m = parseInt(parts[1]), y = parseInt(parts[2]);
    try {
      const lunar = amlich.convertSolar2Lunar(d, m, y, 7);
      const yearCan = CAN_ARRAY[(lunar[2] + 6) % 10];
      const yearChi = CHI_ARRAY[(lunar[2] + 8) % 12];
      const napAm = LUC_THAP_HOA_GIAP[`${yearCan} ${yearChi}`];

      // Nhật Can (Day Stem from birth date)
      const jd = amlich.jdFromDate(d, m, y);
      const nhatCanIdx = (jd + 9) % 10;
      const nhatCan = CAN_ARRAY[nhatCanIdx];

      const userProfile = { name: inpName, dob: `${d}/${m}/${y}`, yearCan, yearChi, nhatCan, napAm };
      await AsyncStorage.setItem('USER_BAZI_PROFILE', JSON.stringify(userProfile));
      setProfile(userProfile);
      setProfileModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Hồ Sơ Hoàn Tất', `Bản mệnh: ${napAm}\nNhật Can (Chủ Sự): ${nhatCan}\nSẵn sàng luận giải Bát Tự!`);
    } catch(e) { Alert.alert('Lỗi', 'Đã xảy ra lỗi tính toán.'); }
  };

  const clearProfile = async () => {
    await AsyncStorage.removeItem('USER_BAZI_PROFILE');
    setProfile(null); setProfileModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const generateCalendar = (date) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true })
    ]).start();

    const year = date.getFullYear(), month = date.getMonth();
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0);
    let startingDayOfWeek = firstDay.getDay(), grid = [], currentWeek = [];
    for (let i = 0; i < startingDayOfWeek; i++) currentWeek.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) { grid.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      grid.push(currentWeek);
    }
    setCalendarGrid(grid);
  };

  const updateDetailInfo = (date, userProfile) => {
    try {
      const d = date.getDate(), m = date.getMonth() + 1, y = date.getFullYear();
      const lunar = amlich.convertSolar2Lunar(d, m, y, 7);
      const lD = lunar[0], lM = lunar[1], lY = lunar[2];

      const yearCan = CAN_ARRAY[(lY + 6) % 10], yearChi = CHI_ARRAY[(lY + 8) % 12];
      const namCanChi = `${yearCan} ${yearChi} (${LUC_THAP_HOA_GIAP[`${yearCan} ${yearChi}`]})`;

      const jd = amlich.jdFromDate(d, m, y);
      const dayCanIdx = (jd + 9) % 10;
      const dayCan = CAN_ARRAY[dayCanIdx];
      const dayChi = CHI_ARRAY[(jd + 1) % 12];
      const ngayCanChi = `${dayCan} ${dayChi} (${LUC_THAP_HOA_GIAP[`${dayCan} ${dayChi}`] || 'Nạp Âm'})`;
      
      const truc = getTruc(lM, dayChi);
      const hoangDaoHours = getGioHoangDao(dayChi);
      const holiday = getHoliday(lD, lM);

      let baziReading = null;
      if (userProfile) {
        const myCanIdx = CAN_ARRAY.indexOf(userProfile.nhatCan);
        const thapThanKey = THAP_THAN_MATRIX[myCanIdx][dayCanIdx];
        const thapThanInfo = THAP_THAN_DESC[thapThanKey];

        baziReading = {
          thapThan: { key: thapThanKey, ...thapThanInfo },
          diaChi: checkDiaChi(userProfile.yearChi, dayChi)
        };
      }

      setDetailInfo({
        lunarStr: `Mùng ${lD} tháng ${lM} năm ${lY}`,
        namCanChi, ngayCanChi, truc,
        isRằm: lD === 15, isMung1: lD === 1,
        hoangDaoHours, holiday,
        baziReading
      });
    } catch(e) { setDetailInfo(null); }
  };

  const handleDayPress = (date) => { 
    if (date) { 
      Haptics.selectionAsync(); 
      setSelectedDate(date); 
      setDetailModalVisible(true);
    } 
  };
  const isSelected = (date) => date && date.toDateString() === selectedDate.toDateString();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{padding: 15, paddingBottom: 150}} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setInpName(profile?.name || ''); setInpDOB(profile?.dob ? profile.dob.replace(/\//g,'-') : ''); setProfileModal(true); }} style={styles.profileBtn}>
            <Ionicons name="compass" size={32} color={profile ? THEME.accentGold : THEME.textSub} />
            {profile && <View style={styles.profileActiveDot}/>}
          </TouchableOpacity>

          <View style={styles.monthNavWrap}>
            <TouchableOpacity onPress={() => {Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));}} style={styles.navBtn}><Ionicons name="chevron-back" size={20} color={THEME.accentGold} /></TouchableOpacity>
            <Text style={styles.headerText}>Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}</Text>
            <TouchableOpacity onPress={() => {Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));}} style={styles.navBtn}><Ionicons name="chevron-forward" size={20} color={THEME.accentGold} /></TouchableOpacity>
          </View>
        </View>

        {/* Grid Lịch */}
        <Animated.View style={[styles.calendarBox, { opacity: fadeAnim }]} {...panResponder.panHandlers}>
          <View style={styles.weekRow}>
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
              <Text key={idx} style={[styles.weekDayText, (idx === 0 || idx === 6) && {color: THEME.weekendText}]}>{day}</Text>
            ))}
          </View>

          {calendarGrid.map((week, wIdx) => (
            <View key={wIdx} style={styles.daysRow}>
              {week.map((dateObj, dIdx) => {
                if (!dateObj) return <View key={dIdx} style={styles.dayCell} />;
                const isSel = isSelected(dateObj);
                const isTod = dateObj.toDateString() === new Date().toDateString();
                const isWeekend = dIdx === 0 || dIdx === 6;
                let lunar = [1,1,1];
                try { lunar = amlich.convertSolar2Lunar(dateObj.getDate(), dateObj.getMonth()+1, dateObj.getFullYear(), 7); } catch(e) {}
                const isRằm = lunar[0] === 15, isMung1 = lunar[0] === 1;
                const isHoliday = !!getHoliday(lunar[0], lunar[1]);

                return (
                  <TouchableOpacity key={dIdx} style={[styles.dayCell, isTod && styles.todayCell]} onPress={() => handleDayPress(dateObj)} activeOpacity={0.7}>
                    {isSel && <Animated.View style={[StyleSheet.absoluteFill, {borderRadius: 12, backgroundColor: THEME.accentGold, transform: [{scale: pulseAnim}]}]} />}
                    {isRằm && <View style={styles.moonDot} />}
                    {isHoliday && <View style={{width: 4, height: 4, borderRadius: 2, backgroundColor: THEME.accentRed, position: 'absolute', top: 4}} />}
                    <Text style={[styles.solarText, isWeekend && {color: THEME.weekendText}, isSel && {color: THEME.bg, fontWeight: 'bold'}]}>{dateObj.getDate()}</Text>
                    <Text style={[styles.lunarText, isMung1 && {color: THEME.accentGold, fontWeight: 'bold'}, isSel && {color: THEME.bg}]}>{lunar[0] === 1 ? `${lunar[0]}/${lunar[1]}` : lunar[0]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Animated.View>

      </ScrollView>

      {/* Bottom Sheet Chi Tiết Ngày */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={() => setDetailModalVisible(false)} />
        <BlurView intensity={90} tint="dark" style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {detailInfo && (
              <View style={{paddingBottom: 40}}>
                <View style={styles.detailRibbon}>
                  <Text style={styles.detailRibbonText}>
                    {detailInfo.holiday ? `🎉 ${detailInfo.holiday.toUpperCase()}` : (detailInfo.isRằm ? '🌕 RẰM' : (detailInfo.isMung1 ? '🌑 MÙNG 1' : 'TỨ TRỤ BA-ZI'))}
                  </Text>
                </View>
                
                <Text style={styles.detailDateMain}>{selectedDate.getDate()} / {selectedDate.getMonth()+1} / {selectedDate.getFullYear()}</Text>
                <Text style={styles.detailLunarMain}>{detailInfo.lunarStr}</Text>
                <View style={styles.divider} />

                <View style={styles.hoangDaoBox}>
                  <Text style={styles.hoangDaoTitle}>Giờ Hoàng Đạo</Text>
                  <View style={styles.hoangDaoList}>
                    {detailInfo.hoangDaoHours.map(h => <Text key={h} style={styles.hoangDaoBadge}>{h}</Text>)}
                  </View>
                </View>

                <View style={styles.baziGrid}>
                  <View style={styles.baziCol}>
                    <Text style={styles.baziLabel}>Năm</Text>
                    <Text style={styles.baziValue}>{detailInfo.namCanChi.split(' ')[0]} {detailInfo.namCanChi.split(' ')[1]}</Text>
                  </View>
                  <View style={styles.baziColCenter}>
                    <Text style={styles.baziLabel}>Ngày</Text>
                    <Text style={styles.baziValueMain}>{detailInfo.ngayCanChi.split(' ')[0]} {detailInfo.ngayCanChi.split(' ')[1]}</Text>
                  </View>
                  <View style={styles.baziCol}>
                    <Text style={styles.baziLabel}>Thập Nhị Trực</Text>
                    <Text style={[styles.baziValue, {color: THEME.accentGreen}]}>Trực {detailInfo.truc}</Text>
                  </View>
                </View>
                <Text style={styles.napAmText}>Hoa giáp ngày: {detailInfo.ngayCanChi}</Text>
                <Text style={styles.trucDescText}>{TRUC_DESC[detailInfo.truc]}</Text>

                {profile && detailInfo.baziReading && (
                  <View style={styles.astroBox}>
                    <LinearGradient colors={['rgba(212, 175, 55, 0.15)', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFillObject} />
                    <View style={styles.astroHeader}>
                      <Ionicons name="sparkles" size={16} color={THEME.bg} />
                      <Text style={styles.astroTitle}>GIẢI MÃ TỬ VI CHO {profile.name.toUpperCase()}</Text>
                    </View>
                    <View style={styles.astroContent}>
                      <Text style={styles.astroMyInfo}>Mệnh: {profile.napAm}  |  Nhật Can: {profile.nhatCan}</Text>
                      
                      <View style={styles.astroItem}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Text style={styles.astroItemTitle}>Thập Thần: </Text>
                          <View style={[styles.astroBadge, {backgroundColor: detailInfo.baziReading.thapThan.color}]}>
                            <Text style={styles.astroBadgeText}>{detailInfo.baziReading.thapThan.key.toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={styles.astroItemDesc}>{detailInfo.baziReading.thapThan.desc}</Text>
                      </View>

                      <View style={styles.astroItem}>
                        <Text style={[styles.astroItemTitle, {color: detailInfo.baziReading.diaChi.color}]}>Hành Xung Địa Chi ({detailInfo.baziReading.diaChi.type}):</Text>
                        <Text style={styles.astroItemDesc}>{detailInfo.baziReading.diaChi.desc}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {!profile && (
                  <TouchableOpacity style={styles.promptProfile} onPress={() => setProfileModal(true)}>
                    <Text style={styles.promptProfileText}>Thiết lập Hồ Sơ Bát Tự để xem giải mã chuyên sâu</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </BlurView>
      </Modal>

      {/* Modal Profile Tử Vi */}
      <Modal visible={profileModal} transparent animationType="fade">
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}><Ionicons name="compass-outline" size={40} color={THEME.accentGold}/></View>
            <Text style={styles.modalTitle}>THIẾT LẬP BÁT TỰ</Text>
            <Text style={styles.modalSub}>Nhập thông tin để kích hoạt thuật toán Thập Thần và Hoa Giáp độc quyền.</Text>
            
            <TextInput style={styles.input} placeholder="Họ và Tên (VD: Nguyễn Văn A)" placeholderTextColor={THEME.textSub} value={inpName} onChangeText={setInpName} />
            <TextInput style={styles.input} placeholder="Ngày Sinh Dương Lịch (DD-MM-YYYY)" placeholderTextColor={THEME.textSub} value={inpDOB} onChangeText={setInpDOB} keyboardType="numeric" />

            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>LƯU HỒ SƠ & PHÂN TÍCH</Text>
            </TouchableOpacity>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
              {profile && <TouchableOpacity onPress={clearProfile}><Text style={{color: THEME.accentRed, fontWeight: 'bold'}}>Xóa Hồ Sơ</Text></TouchableOpacity>}
              <View style={{flex:1}}/>
              <TouchableOpacity onPress={() => setProfileModal(false)}><Text style={{color: THEME.textSub, fontWeight: 'bold'}}>Đóng</Text></TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: Platform.OS==='ios'?50:20, paddingHorizontal: 20 },
  headerText: { fontSize: 18, fontWeight: '900', color: THEME.accentGold, letterSpacing: 1, marginHorizontal: 15 },
  navBtn: { padding: 8, backgroundColor: THEME.card, borderRadius: 12, borderWidth: 1, borderColor: THEME.border },
  monthNavWrap: { flexDirection: 'row', alignItems: 'center' },
  
  profileBtn: { position: 'relative' },
  profileActiveDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: THEME.accentGreen, borderWidth: 2, borderColor: THEME.bg },

  calendarBox: { backgroundColor: THEME.card, borderRadius: 25, padding: 20, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10, marginHorizontal: 15 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 15 },
  weekDayText: { fontSize: 13, fontWeight: 'bold', color: THEME.textSub, width: 40, textAlign: 'center' },
  
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  dayCell: { width: 44, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  todayCell: { borderWidth: 1, borderColor: THEME.accentGold, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  selectedCell: { backgroundColor: THEME.accentGold, shadowColor: THEME.accentGold, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  
  moonDot: { position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.moonColor },
  solarText: { fontSize: 16, color: THEME.textLight, fontWeight: 'bold' },
  lunarText: { fontSize: 9, color: THEME.textSub, marginTop: 2, fontWeight: '600' },

  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '80%', backgroundColor: 'rgba(28, 28, 32, 0.85)', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 10, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: {width: 0, height: -10}, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20 },
  bottomSheetHandle: { width: 40, height: 5, backgroundColor: '#555', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  
  detailRibbon: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: THEME.accentRed, paddingVertical: 6, alignItems: 'center', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  detailRibbonText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  detailDateMain: { fontSize: 28, fontWeight: '900', color: THEME.textLight, textAlign: 'center', marginTop: 25, letterSpacing: 1 },
  detailLunarMain: { fontSize: 16, color: THEME.accentGold, fontStyle: 'italic', textAlign: 'center', marginTop: 5, fontWeight: '600' },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 15 },

  hoangDaoBox: { backgroundColor: THEME.bg, borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: THEME.accentGold },
  hoangDaoTitle: { color: THEME.accentGold, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', fontSize: 13, textTransform: 'uppercase' },
  hoangDaoList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  hoangDaoBadge: { backgroundColor: THEME.card, color: THEME.textLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, margin: 4, fontSize: 12, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  
  baziGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: THEME.bg, borderRadius: 15, padding: 15, borderWidth: 1, borderColor: THEME.border },
  baziCol: { alignItems: 'center', flex: 1 },
  baziColCenter: { alignItems: 'center', flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: THEME.border },
  baziLabel: { fontSize: 10, color: THEME.textSub, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  baziValue: { fontSize: 13, color: THEME.textLight, fontWeight: '600' },
  baziValueMain: { fontSize: 14, color: THEME.accentGold, fontWeight: 'bold' },

  napAmText: { color: THEME.textSub, textAlign: 'center', marginTop: 15, fontSize: 13, fontStyle: 'italic' },
  trucDescText: { color: THEME.textLight, textAlign: 'center', marginTop: 5, fontSize: 13, lineHeight: 20 },

  astroBox: { marginTop: 20, backgroundColor: THEME.bg, borderRadius: 15, borderWidth: 1, borderColor: THEME.accentGold, overflow: 'hidden' },
  astroHeader: { flexDirection: 'row', backgroundColor: THEME.accentGold, padding: 12, alignItems: 'center', justifyContent: 'center' },
  astroTitle: { color: THEME.bg, fontWeight: '900', marginLeft: 8, fontSize: 13, letterSpacing: 1 },
  astroContent: { padding: 15 },
  astroMyInfo: { color: THEME.accentGold, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, fontSize: 14 },
  astroItem: { marginBottom: 15, backgroundColor: THEME.card, padding: 12, borderRadius: 10 },
  astroItemTitle: { color: THEME.textLight, fontWeight: 'bold', fontSize: 13, marginBottom: 5 },
  astroBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 10 },
  astroBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  astroItemDesc: { fontSize: 13, lineHeight: 20, color: THEME.textSub, marginTop: 5 },

  promptProfile: { marginTop: 20, backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: THEME.accentGold, borderStyle: 'dashed' },
  promptProfileText: { color: THEME.accentGold, textAlign: 'center', fontWeight: 'bold', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: THEME.modalBg, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: THEME.card, padding: 25, borderRadius: 25, borderWidth: 1, borderColor: THEME.border, shadowColor: THEME.accentGold, shadowOffset: {width:0, height:0}, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
  modalIconBox: { alignSelf: 'center', marginBottom: 15, backgroundColor: THEME.bg, padding: 15, borderRadius: 40, borderWidth: 1, borderColor: THEME.accentGold },
  modalTitle: { color: THEME.accentGold, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  modalSub: { color: THEME.textSub, textAlign: 'center', marginBottom: 25, fontSize: 13, lineHeight: 20 },
  input: { backgroundColor: THEME.bg, color: THEME.textLight, padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: THEME.border, fontSize: 15 },
  saveBtn: { backgroundColor: THEME.accentGold, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: THEME.accentGold, shadowOffset: {width:0, height:4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: THEME.bg, fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});
