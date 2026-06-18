import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform, Animated, PanResponder, Dimensions, Share } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { THEME as BASE_THEME } from '../theme';
import { createCache } from '../lunarCache';

import {
  CAN_ARRAY, CHI_ARRAY, LUC_THAP_HOA_GIAP,
  THAP_THAN_MATRIX, THAP_THAN_DESC,
  TRUC_ARRAY, getTruc, TRUC_DESC,
  checkDiaChi, getGioHoangDao, getHoliday,
  NGU_HANH_ELEMENT_CAN, NGU_HANH_ELEMENT_CHI, NGU_HANH_COLORS,
  getNguHanhRelation,
  getMonthChiIdx, getMonthCanIdx,
  getHourChiIdx, getHourCanIdx,
  getCuuTinhInfo, getTietKhi, getDayScore,
  getSaoHan, getSimpleMenh, MENH_DESC,
  getCungMenh, getWesternZodiac, analyzeNameElements,
  getPersonalYearNumber, PERSONAL_YEAR_INFO,
  getMenhDayAdvice, getMenhDayScore, analyzeElementBalance
} from '../fengshui';

import { tinhQueTheoAmLich, tinhQueTheoJD, gieoQue3DongXu, BAT_QUAI } from '../kinhDich';

const { width: SCREEN_W } = Dimensions.get('window');

const THEME = {
  ...BASE_THEME,
  weekendText: '#E74C3C',
  moonColor: '#F39C12',
};

const TABS = ['TỨ TRỤ', 'THẬP THẦN', 'NGŨ HÀNH', 'CỬU TINH', 'CÔNG VIỆC', 'KINH DỊCH'];
const TAB_ICONS = ['git-network', 'sparkles', 'color-palette', 'star', 'briefcase', 'book'];
const SPREADSHEET_ID = '1Od2c46Msy7FraALvf4YWyvRgfHxhfBHpGr0djUQdnq8';

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── Animated Pillar Card ───
const PillarCard = ({ label, can, chi, element, napAm, isMain, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true })
    ]).start();
  }, []);
  const elColor = NGU_HANH_COLORS[element] || THEME.accentGold;
  return (
    <Animated.View style={[styles.pillarCard, isMain && styles.pillarCardMain, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient colors={isMain ? ['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.02)'] : ['rgba(255,255,255,0.04)', 'rgba(0,0,0,0.1)']} style={StyleSheet.absoluteFillObject} borderRadius={14} />
      <Text style={[styles.pillarLabel, isMain && { color: THEME.accentGold }]}>{label}</Text>
      <Text style={[styles.pillarCanChi, { color: elColor }, isMain && { fontSize: 17 }]}>
        {can} {chi}
      </Text>
      <View style={[styles.pillarElBadge, { backgroundColor: elColor + '25', borderColor: elColor + '40' }]}>
        <View style={[styles.pillarElDot, { backgroundColor: elColor }]} />
        <Text style={[styles.pillarElText, { color: elColor }]}>{element}</Text>
      </View>
      {napAm ? <Text style={styles.pillarNapAm} numberOfLines={1}>{napAm}</Text> : null}
    </Animated.View>
  );
};

// ─── Hoang Dao Badge ───
const HoangDaoBadge = ({ chi }) => {
  const colors = { 'Tý': '#3498DB', 'Ngọ': '#E74C3C', 'Mão': '#2ECC71', 'Dậu': '#F1C40F' };
  return (
    <View style={[styles.hdBadge, { borderColor: colors[chi] || THEME.accentGold }]}>
      <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(0,0,0,0.2)']} style={StyleSheet.absoluteFillObject} borderRadius={16} />
      <Text style={styles.hdBadgeText}>{chi}</Text>
    </View>
  );
};

// ─── Element Node (for Ngu Hanh flow) ───
const ElementNode = ({ can, chi, element, elColor, isLast }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={[styles.elNodeCircle, { borderColor: elColor, shadowColor: elColor }]}>
      <Text style={[styles.elNodeCanChi, { color: elColor }]}>{can}{chi}</Text>
    </View>
    <Text style={[styles.elNodeLabel, { color: elColor }]}>{element}</Text>
  </View>
);

// ─── Relation Arrow ───
const RelationArrow = ({ type, color }) => {
  const arrow = type === 'Tương Sinh' || type === 'Được Sinh' ? '→' : '✕';
  return (
    <View style={styles.relArrowWrap}>
      <Text style={[styles.relArrow, { color }]}>{arrow}</Text>
      <Text style={[styles.relArrowLabel, { color }]}>{type === 'Tương Sinh' || type === 'Được Sinh' ? 'Sinh' : 'Khắc'}</Text>
    </View>
  );
};

// ═══════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════
export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarGrid, setCalendarGrid] = useState([]);
  const [detailInfo, setDetailInfo] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [dayScores, setDayScores] = useState({});

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lunarCache = useRef(createCache()).current;

  // Tab indicator animation
  const tabAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(tabAnim, { toValue: activeTab, friction: 8, tension: 80, useNativeDriver: true }).start(); }, [activeTab]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gs) => Math.abs(gs.dx) > 20,
      onPanResponderRelease: (evt, gs) => {
        if (gs.dx > 50) { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); Haptics.selectionAsync(); }
        else if (gs.dx < -50) { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); Haptics.selectionAsync(); }
      }
    })
  ).current;

  // Pulse for selected cell
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true })
    ])).start();
  }, []);

  const [profile, setProfile] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [inpName, setInpName] = useState('');
  const [inpDOB, setInpDOB] = useState('');
  const [inpGioSinh, setInpGioSinh] = useState('');
  const [inpGender, setInpGender] = useState(null);

  // Tasks integration
  const [allTasks, setAllTasks] = useState([]);
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);

  useEffect(() => { loadProfile(); fetchTasks(); }, []);
  useEffect(() => { generateCalendar(currentDate); }, [currentDate]);
  useEffect(() => { updateDetailInfo(selectedDate, profile); }, [selectedDate, profile]);
  useEffect(() => {
    if (detailModalVisible && selectedDate && allTasks.length) {
      const key = `${String(selectedDate.getDate()).padStart(2,'0')}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${selectedDate.getFullYear()}`;
      const dayTasks = allTasks.filter(t => t.dateStr === key).sort((a,b) => a.timeVal - b.timeVal);
      setSelectedDayTasks(dayTasks);
    }
  }, [detailModalVisible, selectedDate, allTasks]);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('USER_BAZI_PROFILE');
      if (stored) {
        const p = JSON.parse(stored);
        if (p.gioSinh === undefined) p.gioSinh = null;
        if (p.gender === undefined) p.gender = null;
        if (!p.simpleMenh) p.simpleMenh = getSimpleMenh(CAN_ARRAY.indexOf(p.yearCan));
        setProfile(p);
      }
    } catch (e) {}
  };

  const saveProfile = async () => {
    if (!inpName || !inpDOB) return Alert.alert('Lỗi', 'Vui lòng nhập tên và ngày sinh');
    const parts = inpDOB.split(/[-/]/);
    if (parts.length !== 3) return Alert.alert('Lỗi', 'Ngày sinh phải có dạng DD-MM-YYYY');
    const d = parseInt(parts[0], 10), m = parseInt(parts[1], 10), y = parseInt(parts[2], 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return Alert.alert('Lỗi', 'Ngày sinh không hợp lệ.');
    if (y < 1900 || y > 2100) return Alert.alert('Lỗi', 'Năm sinh phải từ 1900 đến 2100.');
    if (m < 1 || m > 12) return Alert.alert('Lỗi', 'Tháng sinh phải từ 1 đến 12.');
    if (d < 1 || d > 31) return Alert.alert('Lỗi', 'Ngày sinh phải từ 1 đến 31.');
    const maxDay = new Date(y, m, 0).getDate();
    if (d > maxDay) return Alert.alert('Lỗi', `Tháng ${m} chỉ có ${maxDay} ngày.`);
    let gioSinh = null;
    if (inpGioSinh.trim()) { const h = parseInt(inpGioSinh, 10); if (isNaN(h) || h < 0 || h > 23) return Alert.alert('Lỗi', 'Giờ sinh phải từ 0 đến 23.'); gioSinh = h; }
    try {
      const lunar = lunarCache.getLunar(y, m, d);
      const yearCan = CAN_ARRAY[(lunar[2] + 6) % 10], yearChi = CHI_ARRAY[(lunar[2] + 8) % 12];
      const napAm = LUC_THAP_HOA_GIAP[`${yearCan} ${yearChi}`];
      const jd = lunarCache.getJD(y, m, d);
      const nhatCanIdx = (jd + 9) % 10;
      const nhatCan = CAN_ARRAY[nhatCanIdx];
      const userProfile = { name: inpName, dob: `${d}/${m}/${y}`, yearCan, yearChi, nhatCan, napAm, gioSinh, gender: inpGender, simpleMenh: getSimpleMenh((lunar[2] + 6) % 10), westernZodiac: getWesternZodiac(m, d) };
      await AsyncStorage.setItem('USER_BAZI_PROFILE', JSON.stringify(userProfile));
      setProfile(userProfile); setProfileModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Hồ Sơ Hoàn Tất', `Bản mệnh: ${napAm}\nNhật Can (Chủ Sự): ${nhatCan}\nSẵn sàng luận giải Bát Tự!`);
    } catch (e) { Alert.alert('Lỗi', 'Đã xảy ra lỗi tính toán.'); }
  };

  const clearProfile = async () => {
    await AsyncStorage.removeItem('USER_BAZI_PROFILE');
    setProfile(null); setProfileModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  // ─── Task Integration ───
  const fetchTasks = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Abc`;
      const resp = await fetch(url);
      const text = await resp.text();
      const lines = text.split('\n');
      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split('","').map(v => v.replace(/^"|"$/g, ''));
        const dateStr = row[0], job = row[1];
        if (!dateStr || !job) continue;
        const fH = row[2]?.padStart(2,'0') || '00', fM = row[3]?.padStart(2,'0') || '00';
        const tH = row[4]?.padStart(2,'0') || '00', tM = row[5]?.padStart(2,'0') || '00';
        const status = row[6]?.toUpperCase() || 'WAIT';
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          const std = `${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}-${parts[2]}`;
          parsed.push({ id: `cloud_${i}`, dateStr: std, job, fromTime: `${fH}:${fM}`, toTime: `${tH}:${tM}`, timeVal: parseInt(fH)*60+parseInt(fM), status });
        }
      }
      const localStr = await AsyncStorage.getItem('LOCAL_TASKS');
      if (localStr) JSON.parse(localStr).forEach(t => parsed.push({ id: t.id, dateStr: t.dateStr, job: t.job, fromTime: '00:00', toTime: '23:59', timeVal: 0, status: 'LOCAL' }));
      setAllTasks(parsed);
    } catch (e) { /* silent */ }
  };

  const getTasksForDate = (date) => {
    const key = `${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`;
    return allTasks.filter(t => t.dateStr === key);
  };

  // ─── Share ───
  const handleShare = async () => {
    if (!detailInfo) return;
    let text = `📅 ${selectedDate.getDate()}/${selectedDate.getMonth()+1}/${selectedDate.getFullYear()}\n`;
    text += `🌙 ${detailInfo.lunarStr}\n`;
    text += `🔮 Can Chi: ${detailInfo.namCanChi} | ${detailInfo.ngayCanChi}\n`;
    text += `⭐ Trực: ${detailInfo.truc}\n`;
    if (detailInfo.hoangDaoHours?.length) text += `☀️ Giờ Hoàng Đạo: ${detailInfo.hoangDaoHours.join(', ')}\n`;
    if (detailInfo.holiday) text += `🎉 ${detailInfo.holiday}\n`;
    if (detailInfo.baziReading) text += `📊 Thập Thần: ${detailInfo.baziReading.thapThan.key}\n`;
    text += `\n— Ứng dụng Lịch Vạn Niên Pro`;
    try { await Share.share({ message: text }); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
  };

  const computeDayScores = (year, month) => {
    if (!profile) return {};
    const scores = {};
    const lastDay = new Date(year, month, 0).getDate();
    const myCanIdx = CAN_ARRAY.indexOf(profile.nhatCan);
    const menhEl = profile.simpleMenh || getSimpleMenh(CAN_ARRAY.indexOf(profile.yearCan));
    for (let day = 1; day <= lastDay; day++) {
      const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const lunar = lunarCache.getLunar(year, month, day);
      const jd = lunarCache.getJD(year, month, day);
      const dayCanIdx = (jd + 9) % 10;
      const dayChiIdx = (jd + 1) % 12;
      const dayChi = CHI_ARRAY[dayChiIdx];
      const isHoangDao = getGioHoangDao(dayChi).length > 0;
      const thapThanKey = (myCanIdx >= 0 && THAP_THAN_MATRIX[myCanIdx]) ? THAP_THAN_MATRIX[myCanIdx][dayCanIdx] : 'Bình Thường';
      const dayEl = NGU_HANH_ELEMENT_CAN[dayCanIdx] || 'Thổ';
      const menhSc = getMenhDayScore(menhEl, dayEl);
      const baseSc = getDayScore(getTruc(lunar[1], dayChi), profile.yearChi, dayChi, thapThanKey, isHoangDao);
      scores[key] = baseSc + menhSc.score;
    }
    return scores;
  };

  const generateCalendar = (date) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true })
    ]).start();
    const year = date.getFullYear(), month = date.getMonth() + 1;
    const firstDay = new Date(year, month - 1, 1), lastDay = new Date(year, month, 0);
    let startingDayOfWeek = firstDay.getDay(), grid = [], currentWeek = [];
    for (let i = 0; i < startingDayOfWeek; i++) currentWeek.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(new Date(year, month - 1, day));
      if (currentWeek.length === 7) { grid.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) { while (currentWeek.length < 7) currentWeek.push(null); grid.push(currentWeek); }
    setCalendarGrid(grid);
    lunarCache.precomputeMonth(year, month);
    setDayScores(computeDayScores(year, month));
  };

  const updateDetailInfo = (date, userProfile) => {
    try {
      const d = date.getDate(), m = date.getMonth() + 1, y = date.getFullYear();
      const lunar = lunarCache.getLunar(y, m, d);
      const lD = lunar[0], lM = lunar[1], lY = lunar[2];
      const jd = lunarCache.getJD(y, m, d);
      const dayCanIdx = (jd + 9) % 10, dayChiIdx = (jd + 1) % 12;
      const dayCan = CAN_ARRAY[dayCanIdx], dayChi = CHI_ARRAY[dayChiIdx];
      const yearCanIdx = (lY + 6) % 10;
      const yearCan = CAN_ARRAY[yearCanIdx], yearChi = CHI_ARRAY[(lY + 8) % 12];
      const monthChiIdx = getMonthChiIdx(lM), monthCanIdx = getMonthCanIdx(lM, yearCanIdx);
      const monthCan = CAN_ARRAY[monthCanIdx], monthChi = CHI_ARRAY[monthChiIdx];
      const truc = getTruc(lM, dayChi);
      const hoangDaoHours = getGioHoangDao(dayChi);
      const holiday = getHoliday(lD, lM, d, m);

      const tuTru = {
        year: { can: yearCan, chi: yearChi, element: NGU_HANH_ELEMENT_CAN[yearCanIdx], napAm: LUC_THAP_HOA_GIAP[`${yearCan} ${yearChi}`] || '' },
        month: { can: monthCan, chi: monthChi, element: NGU_HANH_ELEMENT_CAN[monthCanIdx], napAm: LUC_THAP_HOA_GIAP[`${monthCan} ${monthChi}`] || '' },
        day: { can: dayCan, chi: dayChi, element: NGU_HANH_ELEMENT_CAN[dayCanIdx], napAm: LUC_THAP_HOA_GIAP[`${dayCan} ${dayChi}`] || '' },
        hour: null
      };
      if (userProfile && userProfile.gioSinh !== null) {
        const hChiIdx = getHourChiIdx(userProfile.gioSinh), hCanIdx = getHourCanIdx(hChiIdx, dayCanIdx);
        tuTru.hour = { can: CAN_ARRAY[hCanIdx], chi: CHI_ARRAY[hChiIdx], element: NGU_HANH_ELEMENT_CAN[hCanIdx], napAm: LUC_THAP_HOA_GIAP[`${CAN_ARRAY[hCanIdx]} ${CHI_ARRAY[hChiIdx]}`] || '' };
      }

      const pillars = [tuTru.year, tuTru.month, tuTru.day];
      if (tuTru.hour) pillars.push(tuTru.hour);
      const nguHanhRelations = [];
      for (let i = 1; i < pillars.length; i++) nguHanhRelations.push({ between: `${pillars[i-1].can}${pillars[i-1].chi} → ${pillars[i].can}${pillars[i].chi}`, ...getNguHanhRelation(pillars[i-1].element, pillars[i].element) });

      const cuuTinh = getCuuTinhInfo(lY, lD);
      const tietKhi = getTietKhi(m, d);
      const isHoangDao = hoangDaoHours.length > 0;

      // Sao hạn năm (nếu có profile)
      let saoHan = null;
      if (userProfile) {
        try {
          const dobParts = userProfile.dob.split('/');
          const birthYear = parseInt(dobParts[2], 10);
          saoHan = getSaoHan(birthYear, y);
        } catch (e) {}
      }

      let baziReading = null;
      if (userProfile) {
        const myCanIdx = CAN_ARRAY.indexOf(userProfile.nhatCan);
        const thapThanKey = (myCanIdx >= 0 && THAP_THAN_MATRIX[myCanIdx]) ? THAP_THAN_MATRIX[myCanIdx][dayCanIdx] : 'Bình Thường';
        baziReading = { thapThan: { key: thapThanKey, ...(THAP_THAN_DESC[thapThanKey] || { desc: '', color: THEME.textSub }) }, diaChi: checkDiaChi(userProfile.yearChi, dayChi) };
      }
      setDetailInfo({ lunarStr: `Mùng ${lD} tháng ${lM} năm ${lY}`, namCanChi: `${yearCan} ${yearChi}`, ngayCanChi: `${dayCan} ${dayChi}`, truc, isRằm: lD === 15, isMung1: lD === 1, hoangDaoHours, holiday, baziReading, tuTru, nguHanhRelations, cuuTinh, tietKhi, isHoangDao, saoHan, dayCanIdx });
    } catch (e) { setDetailInfo(null); }
  };

  const handleDayPress = (date) => {
    if (date) { Haptics.selectionAsync(); setSelectedDate(date); setDetailModalVisible(true); setActiveTab(0);
      const key = `${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`;
      setSelectedDayTasks(allTasks.filter(t => t.dateStr === key).sort((a,b) => a.timeVal - b.timeVal));
    }
  };
  const isSelected = (date) => date && date.toDateString() === selectedDate.toDateString();
  const getDateKey = (date) => date ? toDateStr(date) : '';
  const getScore = (date) => date ? dayScores[toDateStr(date)] || 0 : 0;

  // ─── Tab Bar ───
  const renderTabBar = () => {
    const tabW = (SCREEN_W - 40) / TABS.length;
    return (
      <View style={styles.tabBarOuter}>
        <BlurView intensity={60} tint="dark" style={styles.tabBarBlur}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity key={idx} style={styles.tabBtn} onPress={() => { Haptics.selectionAsync(); setActiveTab(idx); }}>
              <Ionicons name={TAB_ICONS[idx]} size={14} color={activeTab === idx ? THEME.accentGold : THEME.textSub} />
              <Text style={[styles.tabBtnText, activeTab === idx && styles.tabBtnTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
          <Animated.View style={[styles.tabIndicator, { width: tabW - 12, transform: [{ translateX: Animated.multiply(tabAnim, tabW) }] }]} />
        </BlurView>
      </View>
    );
  };

  // ─── Tab 0: Tứ Trụ ───
  const renderTuTru = () => {
    if (!detailInfo?.tuTru) return null;
    const { year, month, day, hour } = detailInfo.tuTru;
    return (
      <View style={styles.tabContent}>
        <View style={styles.pillarRow}>
          <PillarCard label="Năm" can={year.can} chi={year.chi} element={year.element} napAm={year.napAm} delay={0} />
          <PillarCard label="Tháng" can={month.can} chi={month.chi} element={month.element} napAm={month.napAm} delay={80} />
          <PillarCard label="Ngày" can={day.can} chi={day.chi} element={day.element} napAm={day.napAm} isMain delay={160} />
          {hour ? <PillarCard label="Giờ" can={hour.can} chi={hour.chi} element={hour.element} napAm={hour.napAm} delay={240} /> : (
            <View style={[styles.pillarCard, { justifyContent: 'center', opacity: 0.5 }]}>
              <Text style={styles.pillarLabel}>Giờ</Text>
              <Ionicons name="time-outline" size={20} color={THEME.textSub} style={{ marginVertical: 6 }} />
              <Text style={{ fontSize: 9, color: THEME.textSub }}>Chưa nhập</Text>
            </View>
          )}
        </View>
        <View style={styles.dividerLine} />
        <View style={styles.hoangDaoBox}>
          <View style={styles.hdHeader}>
            <Ionicons name="sunny" size={14} color={THEME.accentGold} />
            <Text style={styles.hdTitle}>Giờ Hoàng Đạo</Text>
          </View>
          <View style={styles.hdList}>
            {detailInfo.hoangDaoHours.map(h => <HoangDaoBadge key={h} chi={h} />)}
          </View>
        </View>
        <View style={styles.trucBox}>
          <Text style={styles.trucLabel}>Trực {detailInfo.truc}</Text>
          <Text style={styles.trucDesc}>{TRUC_DESC[detailInfo.truc]}</Text>
        </View>

        {/* Mệnh chủ */}
        {profile?.simpleMenh && (
          <View style={[styles.menhBox, { borderColor: (NGU_HANH_COLORS[profile.simpleMenh] || THEME.accentGold) + '40' }]}>
            <View style={[styles.menhBadge, { backgroundColor: NGU_HANH_COLORS[profile.simpleMenh] || THEME.accentGold }]}>
              <Text style={styles.menhBadgeText}>Mệnh {profile.simpleMenh}</Text>
            </View>
            <Text style={styles.menhNapAm}>{profile.napAm}</Text>
            {MENH_DESC[profile.simpleMenh] && (
              <Text style={styles.menhMeaning}>{MENH_DESC[profile.simpleMenh].meaning}</Text>
            )}
          </View>
        )}

        {/* Cung Mệnh (nếu có gender) */}
        {profile?.gender && profile?.dob && (
          (() => {
            const dobP = profile.dob.split('/');
            const birthY = parseInt(dobP[2], 10);
            const cung = getCungMenh(birthY, profile.gender);
            if (!cung) return null;
            return (
              <View style={[styles.ttCard, { borderColor: (NGU_HANH_COLORS[cung.element] || THEME.accentGold) + '30' }]}>
                <View style={styles.ttHeader}>
                  <Ionicons name="compass-outline" size={16} color={NGU_HANH_COLORS[cung.element] || THEME.accentGold} />
                  <Text style={[styles.ttLabel, { color: NGU_HANH_COLORS[cung.element] || THEME.accentGold }]}>Cung Mệnh (Bát Trạch)</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: NGU_HANH_COLORS[cung.element] || THEME.textLight, textAlign: 'center', marginVertical: 4 }}>{cung.name}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                  <View style={[styles.pillarElBadge, { backgroundColor: (NGU_HANH_COLORS[cung.element] || '#888') + '25', borderColor: (NGU_HANH_COLORS[cung.element] || '#888') + '40' }]}>
                    <View style={[styles.pillarElDot, { backgroundColor: NGU_HANH_COLORS[cung.element] || '#888' }]} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: NGU_HANH_COLORS[cung.element] || THEME.textSub }}>{cung.element}</Text>
                  </View>
                  <View style={[styles.pillarElBadge, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: THEME.border }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.textSub }}>{cung.direction}</Text>
                  </View>
                </View>
                <Text style={styles.ttDesc}>{cung.meaning}</Text>
              </View>
            );
          })()
        )}

        {/* Hôm nay hợp với mệnh */}
        {profile?.simpleMenh && detailInfo.dayCanIdx !== undefined && (
          (() => {
            const dayEl = NGU_HANH_ELEMENT_CAN[detailInfo.dayCanIdx] || 'Thổ';
            const advice = getMenhDayAdvice(profile.simpleMenh, dayEl);
            if (!advice) return null;
            return (
              <View style={[styles.ttCard, { borderColor: advice.color + '40' }]}>
                <View style={styles.ttHeader}>
                  <Ionicons name="leaf-outline" size={16} color={advice.color} />
                  <Text style={[styles.ttLabel, { color: advice.color }]}>Hôm nay — {advice.verdict}</Text>
                </View>
                <Text style={[styles.ttTypeBadge, { color: advice.color, borderColor: advice.color + '50', alignSelf: 'center', fontSize: 13, paddingHorizontal: 16 }]}>{advice.verdict} với mệnh {profile.simpleMenh}</Text>
                <Text style={styles.ttDesc}>{advice.desc}</Text>
              </View>
            );
          })()
        )}
      </View>
    );
  };

  // ─── Tab 1: Thập Thần ───
  const renderThapThan = () => (
    <View style={styles.tabContent}>
      {detailInfo.baziReading ? (
        <View>
          <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={[styles.ttCard, { borderColor: detailInfo.baziReading.thapThan.color + '40' }]}>
            <View style={styles.ttHeader}>
              <Ionicons name="analytics" size={16} color={detailInfo.baziReading.thapThan.color} />
              <Text style={[styles.ttLabel, { color: detailInfo.baziReading.thapThan.color }]}>Thập Thần hôm nay</Text>
            </View>
            <View style={[styles.ttBadgeLarge, { backgroundColor: detailInfo.baziReading.thapThan.color }]}>
              <Text style={styles.ttBadgeText}>{detailInfo.baziReading.thapThan.key.toUpperCase()}</Text>
            </View>
            <Text style={styles.ttDesc}>{detailInfo.baziReading.thapThan.desc}</Text>
          </LinearGradient>
          <View style={styles.ttCard}>
            <View style={styles.ttHeader}>
              <Ionicons name="git-compare" size={16} color={detailInfo.baziReading.diaChi.color} />
              <Text style={[styles.ttLabel, { color: detailInfo.baziReading.diaChi.color }]}>Địa Chi</Text>
            </View>
            <Text style={[styles.ttTypeBadge, { color: detailInfo.baziReading.diaChi.color, borderColor: detailInfo.baziReading.diaChi.color + '50' }]}>{detailInfo.baziReading.diaChi.type}</Text>
            <Text style={styles.ttDesc}>{detailInfo.baziReading.diaChi.desc}</Text>
          </View>
          {/* Western Zodiac */}
          {profile?.westernZodiac && (
            <View style={styles.ttCard}>
              <View style={styles.ttHeader}>
                <Ionicons name="planet-outline" size={16} color={THEME.accentGold} />
                <Text style={[styles.ttLabel, { color: THEME.accentGold }]}>Cung Hoàng Đạo</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: THEME.textLight, textAlign: 'center', marginBottom: 4 }}>{profile.westernZodiac.name}</Text>
              <Text style={{ fontSize: 13, color: THEME.textSub, textAlign: 'center' }}>{profile.westernZodiac.meaning}</Text>
            </View>
          )}
          {/* Name Analysis */}
          {profile?.name && analyzeNameElements(profile.name) && (
            (() => {
              const na = analyzeNameElements(profile.name);
              if (!na.counts || Object.values(na.counts).every(v => v === 0)) return null;
              return (
                <View style={styles.ttCard}>
                  <View style={styles.ttHeader}>
                    <Ionicons name="text-outline" size={16} color={THEME.accentGreen} />
                    <Text style={[styles.ttLabel, { color: THEME.accentGreen }]}>Phân Tích Tên</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                    {Object.entries(na.counts).filter(([k]) => k !== 'Không Xác Định').map(([el, cnt]) => cnt > 0 && (
                      <View key={el} style={[styles.pillarElBadge, { backgroundColor: (NGU_HANH_COLORS[el] || '#888') + '25', borderColor: (NGU_HANH_COLORS[el] || '#888') + '40' }]}>
                        <View style={[styles.pillarElDot, { backgroundColor: NGU_HANH_COLORS[el] || '#888' }]} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: NGU_HANH_COLORS[el] || THEME.textSub }}>{el}: {cnt}</Text>
                      </View>
                    ))}
                  </View>
                  {na.dominant.length > 0 && (
                    <Text style={{ fontSize: 13, color: THEME.textLight, textAlign: 'center', fontWeight: '600' }}>
                      Thiên hướng: {na.dominant.join(', ')}
                    </Text>
                  )}
                  {na.hasAmbiguous && (
                    <Text style={{ fontSize: 11, color: THEME.textSub, textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
                      (Một số chữ chưa xác định được Ngũ Hành)
                    </Text>
                  )}
                </View>
              );
            })()
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.promptProfile} onPress={() => setProfileModal(true)}>
          <Ionicons name="person-add-outline" size={28} color={THEME.accentGold} />
          <Text style={styles.promptProfileText}>Thiết lập Hồ Sơ Bát Tự để xem Thập Thần</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Tab 2: Ngũ Hành ───
  const renderNguHanh = () => {
    if (!detailInfo?.nguHanhRelations) return null;
    const pillars = [detailInfo.tuTru.year, detailInfo.tuTru.month, detailInfo.tuTru.day];
    if (detailInfo.tuTru.hour) pillars.push(detailInfo.tuTru.hour);
    return (
      <View style={styles.tabContent}>
        <View style={styles.nhFlow}>
          {pillars.map((p, i) => (
            <React.Fragment key={i}>
              <ElementNode can={p.can} chi={p.chi} element={p.element} elColor={NGU_HANH_COLORS[p.element] || THEME.textLight} />
              {i < pillars.length - 1 && detailInfo.nguHanhRelations[i] && (
                <RelationArrow type={detailInfo.nguHanhRelations[i].type} color={detailInfo.nguHanhRelations[i].color} />
              )}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.dividerLine} />
        {detailInfo.nguHanhRelations.length > 0 ? (
          detailInfo.nguHanhRelations.map((rel, idx) => (
            <View key={idx} style={[styles.nhRelCard, { borderLeftColor: rel.color }]}>
              <Text style={styles.nhRelBetween}>{rel.between}</Text>
              <Text style={[styles.nhRelType, { color: rel.color }]}>{rel.type}</Text>
              <Text style={styles.nhRelDesc}>{rel.desc}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: THEME.textSub, textAlign: 'center', fontStyle: 'italic', padding: 20 }}>Cần thêm Giờ Sinh để phân tích đầy đủ.</Text>
        )}
        {detailInfo.nguHanhRelations.length > 0 && (
          <View style={styles.nhSummary}>
            <Text style={styles.nhSummaryText}>
              Sinh: <Text style={{ color: THEME.accentGreen }}>{detailInfo.nguHanhRelations.filter(r => r.type === 'Tương Sinh' || r.type === 'Được Sinh').length}</Text>
              {' '}· Khắc: <Text style={{ color: THEME.accentRed }}>{detailInfo.nguHanhRelations.filter(r => r.type === 'Tương Khắc' || r.type === 'Bị Khắc').length}</Text>
            </Text>
          </View>
        )}
        {/* Phân Tích Ngũ Hành */}
        <View style={styles.dividerLine} />
        <View style={styles.ttCard}>
          <View style={styles.ttHeader}>
            <Ionicons name="stats-chart" size={16} color={THEME.accentBlue} />
            <Text style={[styles.ttLabel, { color: THEME.accentBlue }]}>Ngũ Hành Tứ Trụ</Text>
          </View>
          {(pillars.length >= 3) && (() => {
            const bal = analyzeElementBalance(pillars);
            return (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
                  {Object.entries(bal.counts).map(([el, cnt]) => (
                    <View key={el} style={{ alignItems: 'center' }}>
                      <View style={[styles.pillarElBadge, { backgroundColor: (NGU_HANH_COLORS[el] || '#888') + '25', borderColor: (NGU_HANH_COLORS[el] || '#888') + '40' }]}>
                        <View style={[styles.pillarElDot, { backgroundColor: NGU_HANH_COLORS[el] || '#888' }]} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: NGU_HANH_COLORS[el] || THEME.textSub }}>{cnt}</Text>
                      </View>
                      <Text style={{ fontSize: 9, color: NGU_HANH_COLORS[el] || THEME.textSub, marginTop: 2 }}>{el}</Text>
                    </View>
                  ))}
                </View>
                {bal.missing.length > 0 && <Text style={{ fontSize: 12, color: THEME.accentRed, textAlign: 'center' }}>Khuyết: {bal.missing.join(', ')}</Text>}
                {bal.excess.length > 0 && <Text style={{ fontSize: 12, color: THEME.accentGreen, textAlign: 'center'}}>Dư: {bal.excess.join(', ')}</Text>}
                {bal.balanced.length > 0 && <Text style={{ fontSize: 11, color: THEME.textSub, textAlign: 'center', marginTop: 2 }}>Vừa: {bal.balanced.join(', ')}</Text>}
              </View>
            );
          })()}
        </View>
      </View>
    );
  };

  // ─── Tab 3: Cửu Tinh ───
  const renderCuuTinh = () => {
    if (!detailInfo?.cuuTinh) return null;
    const { star, name, element, meaning } = detailInfo.cuuTinh;
    const elColor = NGU_HANH_COLORS[element] || THEME.accentGold;
    return (
      <View style={styles.tabContent}>
        <View style={[styles.ctPanel, { borderColor: elColor + '50' }]}>
          <LinearGradient colors={[elColor + '15', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={20} />
          <View style={[styles.ctStarCircle, { borderColor: elColor, shadowColor: elColor }]}>
            <Text style={[styles.ctStarNum, { color: elColor }]}>{star}</Text>
          </View>
          <View style={[styles.ctElBadge, { backgroundColor: elColor + '25' }]}>
            <View style={[styles.pillarElDot, { backgroundColor: elColor }]} />
            <Text style={[styles.ctElText, { color: elColor }]}>{element}</Text>
          </View>
          <Text style={[styles.ctName, { color: elColor }]}>{name}</Text>
          <Text style={styles.ctMeaning}>{meaning}</Text>
        </View>
        {detailInfo.tietKhi && (
          <View style={styles.tkBox}>
            <LinearGradient colors={['rgba(212,175,55,0.08)', 'rgba(0,0,0,0.2)']} style={StyleSheet.absoluteFillObject} borderRadius={14} />
            <Ionicons name="partly-sunny" size={22} color={THEME.accentGold} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tkName}>{detailInfo.tietKhi.name}</Text>
              <Text style={styles.tkDesc}>{detailInfo.tietKhi.desc}</Text>
              {!detailInfo.tietKhi.exact && <Text style={[styles.tkDesc, { color: THEME.accentGold, marginTop: 2 }]}>(gần đúng ±1 ngày)</Text>}
            </View>
          </View>
        )}
        {/* Sao hạn năm */}
        {detailInfo.saoHan && (
          <View style={[styles.ctPanel, { borderColor: (detailInfo.saoHan.info?.color || THEME.accentGold) + '50', marginTop: 10 }]}>
            <LinearGradient colors={['rgba(200,50,50,0.08)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={20} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Ionicons name="warning" size={18} color={detailInfo.saoHan.info?.color || THEME.accentGold} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.textSub, letterSpacing: 1 }}>SAO HẠN NĂM</Text>
            </View>
            <Text style={[styles.ctName, { color: detailInfo.saoHan.info?.color || THEME.accentGold, fontSize: 18 }]}>
              {detailInfo.saoHan.starNum}: {detailInfo.saoHan.info?.name}
            </Text>
            <View style={[styles.ctElBadge, { backgroundColor: (detailInfo.saoHan.info?.color || '#888') + '25' }]}>
              <View style={[styles.pillarElDot, { backgroundColor: detailInfo.saoHan.info?.color || '#888' }]} />
              <Text style={[styles.ctElText, { color: detailInfo.saoHan.info?.color || THEME.textSub }]}>{detailInfo.saoHan.info?.element}</Text>
            </View>
            <Text style={styles.ctMeaning}>{detailInfo.saoHan.info?.meaning}</Text>
            <Text style={[styles.ctMeaning, { marginTop: 6, fontStyle: 'italic', fontSize: 12, color: detailInfo.saoHan.info?.color }]}>
              🙏 {detailInfo.saoHan.info?.remedy}
            </Text>
          </View>
        )}
        {/* Năm Cá Nhân */}
        {profile?.dob && (() => {
          const dobP = profile.dob.split('/');
          const pd = parseInt(dobP[0], 10), pm = parseInt(dobP[1], 10), py = parseInt(dobP[2], 10);
          const pyn = getPersonalYearNumber(pd, pm, py);
          const pyi = PERSONAL_YEAR_INFO[pyn];
          if (!pyi) return null;
          return (
            <View style={[styles.ctPanel, { borderColor: (NGU_HANH_COLORS[pyi.element] || THEME.accentGold) + '50', marginTop: 10 }]}>
              <LinearGradient colors={['rgba(100,100,255,0.06)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={20} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="trending-up" size={18} color={THEME.accentGold} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.textSub, letterSpacing: 1 }}>NĂM CÁ NHÂN</Text>
              </View>
              <Text style={[styles.ctStarNum, { color: NGU_HANH_COLORS[pyi.element] || THEME.accentGold }]}>{pyn}</Text>
              <View style={[styles.ctElBadge, { backgroundColor: (NGU_HANH_COLORS[pyi.element] || '#888') + '25' }]}>
                <View style={[styles.pillarElDot, { backgroundColor: NGU_HANH_COLORS[pyi.element] || '#888' }]} />
                <Text style={[styles.ctElText, { color: NGU_HANH_COLORS[pyi.element] || THEME.textSub }]}>{pyi.element}</Text>
              </View>
              <Text style={styles.ctMeaning}>{pyi.meaning}</Text>
            </View>
          );
        })()}
      </View>
    );
  };

  // ─── Tab 4: CÔNG VIỆC ───
  const renderTasks = () => (
    <View style={styles.tabContent}>
      {selectedDayTasks.length === 0 ? (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <Ionicons name="cafe-outline" size={40} color={THEME.textSub} />
          <Text style={{ color: THEME.textSub, textAlign: 'center', marginTop: 10, fontStyle: 'italic' }}>Không có công việc nào trong ngày này.</Text>
        </View>
      ) : (
        selectedDayTasks.map((t, idx) => {
          const c = { MISSED: THEME.accentRed, DONE: THEME.accentGreen, LOCAL: THEME.accentBlue };
          const sc = c[t.status] || THEME.accentYellow;
          return (
            <View key={t.id} style={[styles.ttCard, { borderLeftColor: sc, borderLeftWidth: 3 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: THEME.textSub }}>
                  <Ionicons name="time-outline" size={12} color={THEME.textSub} /> {t.fromTime} - {t.toTime}
                </Text>
                <View style={{ backgroundColor: sc + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: sc }}>{t.status}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 15, color: THEME.textLight, fontWeight: '500' }}>{t.job}</Text>
            </View>
          );
        })
      )}
    </View>
  );

  // ─── Tab 5: KINH DỊCH ───
  const [kinhDichResult, setKinhDichResult] = useState(null);
  const [kinhDichMethod, setKinhDichMethod] = useState('amlich');

  useEffect(() => {
    if (detailInfo && selectedDate) {
      const d = selectedDate.getDate(), m = selectedDate.getMonth() + 1, y = selectedDate.getFullYear();
      const lunar = lunarCache.getLunar(y, m, d);
      const jd = lunarCache.getJD(y, m, d);
      if (kinhDichMethod === 'amlich') setKinhDichResult(tinhQueTheoAmLich(lunar[2], lunar[1], lunar[0]));
      else if (kinhDichMethod === 'julian') setKinhDichResult(tinhQueTheoJD(jd));
      else setKinhDichResult(gieoQue3DongXu());
    }
  }, [detailInfo, kinhDichMethod, selectedDate]);

  const renderKinhDich = () => {
    if (!kinhDichResult) return <View style={styles.tabContent}><Text style={{ color: THEME.textSub, textAlign: 'center', padding: 20, fontStyle: 'italic' }}>Chọn ngày để xem quẻ Kinh Dịch.</Text></View>;
    const q = kinhDichResult;
    const lineColors = ['#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6'];

    return (
      <View style={styles.tabContent}>
        {/* Method selector */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          {[
            { key: 'amlich', label: 'Âm lịch' },
            { key: 'julian', label: 'Julian' },
            { key: 'gieo', label: 'Gieo quẻ' }
          ].map(mt => (
            <TouchableOpacity key={mt.key} style={[styles.methodBtn, kinhDichMethod === mt.key && styles.methodBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setKinhDichMethod(mt.key); }}>
              <Text style={[styles.methodBtnText, kinhDichMethod === mt.key && styles.methodBtnTextActive]}>{mt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quẻ chủ */}
        <View style={styles.ttCard}>
          <View style={styles.ttHeader}>
            <Ionicons name="book" size={16} color={THEME.accentGold} />
            <Text style={[styles.ttLabel, { color: THEME.accentGold }]}>Quẻ Chủ: {q.queChu.nameVN} (số {q.queChu.number})</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 10 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>{q.thuongQuai.image}</Text>
              <Text style={{ fontSize: 11, color: THEME.textSub }}>{q.thuongQuai.nameVN} (Thượng)</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>{q.haQuai.image}</Text>
              <Text style={{ fontSize: 11, color: THEME.textSub }}>{q.haQuai.nameVN} (Hạ)</Text>
            </View>
          </View>
          {/* Vẽ 6 hào */}
          <View style={{ alignItems: 'center', gap: 3, marginVertical: 6 }}>
            {[...Array(6)].map((_, i) => {
              const haoIdx = 5 - i; // vẽ từ trên xuống
              const isDong = q.haoDong === haoIdx + 1;
              const val = q.lines[haoIdx];
              return (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 10, color: THEME.textSub, width: 40, textAlign: 'right' }}>Hào {haoIdx + 1}</Text>
                  <View style={[styles.haoLine, { backgroundColor: isDong ? THEME.accentGold : 'transparent', padding: 2, borderRadius: 4 }]}>
                    {val === 1 ? (
                      <View style={{ width: 80, height: 4, backgroundColor: THEME.textLight, borderRadius: 2 }} />
                    ) : (
                      <View style={{ flexDirection: 'row', width: 80, gap: 10 }}>
                        <View style={{ flex: 1, height: 4, backgroundColor: THEME.textLight, borderRadius: 2 }} />
                        <View style={{ flex: 1, height: 4, backgroundColor: THEME.textLight, borderRadius: 2 }} />
                      </View>
                    )}
                  </View>
                  {isDong && <Ionicons name="flash" size={12} color={THEME.accentGold} />}
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11, color: THEME.accentGold }}>⚡ Hào động: {q.haoDong}</Text>
            <Text style={{ fontSize: 11, color: THEME.textSub }}>Phương pháp: {q.method}</Text>
          </View>
          {q.queBien && (
            <View style={{ marginTop: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: THEME.accentRed, fontWeight: '600' }}>
                Quẻ Biến: {q.queBien.nameVN} (số {q.queBien.number})
              </Text>
            </View>
          )}
          {q.hoQue && (
            <View style={{ marginTop: 4, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: THEME.textSub }}>
                Hỗ Quái: {q.hoQue.nameVN} (số {q.hoQue.number})
              </Text>
            </View>
          )}
        </View>

        {/* Ý nghĩa */}
        <View style={styles.kdCard}>
          <Text style={styles.kdSectionTitle}>Ý NGHĨA</Text>
          <Text style={styles.kdText}>{q.queChu.meaning}</Text>
        </View>

        {/* 4 Prediction */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {[
            { icon: 'briefcase', label: 'Sự nghiệp', text: q.queChu.career, color: THEME.accentBlue },
            { icon: 'heart', label: 'Tình cảm', text: q.queChu.love, color: THEME.accentRed },
            { icon: 'cash', label: 'Tài chính', text: q.queChu.finance, color: THEME.accentYellow },
            { icon: 'fitness', label: 'Sức khỏe', text: q.queChu.health, color: THEME.accentGreen },
          ].map((item, idx) => (
            <View key={idx} style={[styles.kdPredCard, { borderColor: item.color + '30' }]}>
              <View style={styles.ttHeader}>
                <Ionicons name={item.icon} size={14} color={item.color} />
                <Text style={[styles.ttLabel, { color: item.color, fontSize: 11 }]}>{item.label}</Text>
              </View>
              <Text style={[styles.kdText, { fontSize: 12 }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Lời khuyên */}
        <View style={[styles.kdCard, { borderColor: THEME.accentGold + '30' }]}>
          <Text style={[styles.kdSectionTitle, { color: THEME.accentGold }]}>LỜI KHUYÊN</Text>
          <Text style={[styles.kdText, { fontStyle: 'italic' }]}>☯ {q.queChu.advice}</Text>
        </View>
      </View>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 0: return renderTuTru();
      case 1: return renderThapThan();
      case 2: return renderNguHanh();
      case 3: return renderCuuTinh();
      case 4: return renderTasks();
      case 5: return renderKinhDich();
      default: return null;
    }
  };

  // ═══════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        {/* ─── Header ─── */}
        <LinearGradient colors={['#0D0D0F', '#121214']} style={styles.headerGradient}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => { setInpName(profile?.name || ''); setInpDOB(profile?.dob ? profile.dob.replace(/\//g, '-') : ''); setInpGioSinh(profile?.gioSinh != null ? String(profile.gioSinh) : ''); setInpGender(profile?.gender || null); setProfileModal(true); }} style={styles.profileBtn}>
              <BlurView intensity={40} tint="dark" style={styles.profileBtnBlur}>
                <Ionicons name="compass" size={26} color={profile ? THEME.accentGold : THEME.textSub} />
              </BlurView>
              {profile && <View style={styles.profileActiveDot} />}
            </TouchableOpacity>
            <View style={styles.monthNavWrap}>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); }} style={styles.navBtn}><Ionicons name="chevron-back" size={18} color={THEME.accentGold} /></TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.headerMonth}>Tháng {currentDate.getMonth() + 1}</Text>
                <Text style={styles.headerYear}>{currentDate.getFullYear()}</Text>
              </View>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); }} style={styles.navBtn}><Ionicons name="chevron-forward" size={18} color={THEME.accentGold} /></TouchableOpacity>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>

        {/* ─── Calendar Grid ─── */}
        <Animated.View style={[styles.calendarWrap, { opacity: fadeAnim }]} {...panResponder.panHandlers}>
          <LinearGradient colors={['rgba(255,255,255,0.04)', 'rgba(0,0,0,0.2)']} style={StyleSheet.absoluteFillObject} borderRadius={26} />
          <View style={styles.weekRow}>
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
              <Text key={idx} style={[styles.weekDayText, (idx === 0 || idx === 6) && { color: THEME.weekendText }]}>{day}</Text>
            ))}
          </View>
          {calendarGrid.map((week, wIdx) => (
            <View key={wIdx} style={styles.daysRow}>
              {week.map((dateObj, dIdx) => {
                if (!dateObj) return <View key={dIdx} style={styles.dayCell} />;
                const isSel = isSelected(dateObj);
                const isTod = dateObj.toDateString() === new Date().toDateString();
                const isWeekend = dIdx === 0 || dIdx === 6;
                const lunar = lunarCache.getLunar(getDateKey(dateObj));
                const isRằm = lunar[0] === 15;
                const isMung1 = lunar[0] === 1;
                const isHoliday = !!getHoliday(lunar[0], lunar[1], dateObj.getDate(), dateObj.getMonth() + 1);
                const score = getScore(dateObj);
                const tasksForDay = getTasksForDate(dateObj);
                const hasTask = tasksForDay.length > 0;
                const hasMissed = tasksForDay.some(t => t.status === 'MISSED');
                let bgTint = null;
                if (!isSel) { if (score > 2) bgTint = 'rgba(46,204,113,0.12)'; else if (score < 0) bgTint = 'rgba(231,76,60,0.09)'; }
                return (
                  <TouchableOpacity key={dIdx} style={[styles.dayCell, isTod && styles.todayCell, bgTint && { backgroundColor: bgTint }]} onPress={() => handleDayPress(dateObj)} activeOpacity={0.7}>
                    {isSel && <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 12, backgroundColor: THEME.accentGold, transform: [{ scale: pulseAnim }] }]} />}
                    {isRằm && <View style={styles.moonDot} />}
                    {isHoliday && <View style={styles.holidayDot} />}
                    <Text style={[styles.solarText, isWeekend && { color: THEME.weekendText }, isSel && { color: THEME.bg, fontWeight: '900' }]}>{dateObj.getDate()}</Text>
                    <Text style={[styles.lunarText, isMung1 && { color: THEME.accentGold, fontWeight: '700' }, isSel && { color: THEME.bg }]}>{lunar[0] === 1 ? `${lunar[0]}/${lunar[1]}` : lunar[0]}</Text>
                    {hasTask && <View style={[styles.taskDot, hasMissed && styles.taskDotMissed]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* ─── Bottom Sheet ─── */}
      <Modal visible={detailModalVisible} transparent animationType="slide" onRequestClose={() => setDetailModalVisible(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setDetailModalVisible(false)} />
        <BlurView intensity={95} tint="dark" style={styles.bottomSheet}>
          <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 32, borderTopRightRadius: 32 }]} />
          <View style={styles.bSheetHandleWrap}>
            <View style={styles.bSheetHandle} />
          </View>
          {detailInfo && (
            <View>
              <View style={styles.detailHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles.detailDateMain}>{selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}</Text>
                  <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Ionicons name="share-outline" size={16} color={THEME.accentGold} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailLunarMain}>{detailInfo.lunarStr}</Text>
                <View style={styles.detailBadgeRow}>
                  {detailInfo.holiday && <View style={styles.detailBadge}><Text style={styles.detailBadgeText}>🎉 {detailInfo.holiday}</Text></View>}
                  {detailInfo.isRằm && <View style={[styles.detailBadge, { backgroundColor: 'rgba(243,156,18,0.2)' }]}><Text style={styles.detailBadgeText}>🌕 Rằm</Text></View>}
                  {detailInfo.isMung1 && <View style={[styles.detailBadge, { backgroundColor: 'rgba(212,175,55,0.2)' }]}><Text style={styles.detailBadgeText}>🌑 Mùng 1</Text></View>}
                  <View style={[styles.detailBadge, { backgroundColor: 'rgba(39,174,96,0.15)' }]}><Text style={[styles.detailBadgeText, { color: THEME.accentGreen }]}>Trực {detailInfo.truc}</Text></View>
                </View>
              </View>
              {renderTabBar()}
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {renderActiveTab()}
              </ScrollView>
            </View>
          )}
        </BlurView>
      </Modal>

      {/* ─── Profile Modal ─── */}
      <Modal visible={profileModal} transparent animationType="fade">
        <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
          <Animated.View style={styles.modalContent}>
            <LinearGradient colors={['rgba(212,175,55,0.06)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={26} />
            <View style={styles.modalIconBox}><Ionicons name="compass-outline" size={36} color={THEME.accentGold} /></View>
            <Text style={styles.modalTitle}>BÁT TỰ HỒ SƠ</Text>
            <Text style={styles.modalSub}>Nhập thông tin để kích hoạt thuật toán Thập Thần và Hoa Giáp.</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={16} color={THEME.textSub} style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Họ và Tên" placeholderTextColor={THEME.textSub} value={inpName} onChangeText={setInpName} />
            </View>
            <View style={styles.inputGroup}>
              <Ionicons name="calendar-outline" size={16} color={THEME.textSub} style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Ngày Sinh DL (DD-MM-YYYY)" placeholderTextColor={THEME.textSub} value={inpDOB} onChangeText={setInpDOB} keyboardType="numeric" />
            </View>
            <View style={styles.inputGroup}>
              <Ionicons name="time-outline" size={16} color={THEME.textSub} style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Giờ Sinh (0-23, để trống nếu không biết)" placeholderTextColor={THEME.textSub} value={inpGioSinh} onChangeText={setInpGioSinh} keyboardType="numeric" />
            </View>
            <View style={styles.inputGroup}>
              <Ionicons name="male-female-outline" size={16} color={THEME.textSub} style={{ marginRight: 8 }} />
              <TouchableOpacity onPress={() => setInpGender(inpGender === null ? 'male' : inpGender === 'male' ? 'female' : null)} style={{ flex: 1, paddingVertical: 14 }}>
                <Text style={{ color: inpGender ? THEME.textLight : THEME.textSub, fontSize: 14 }}>
                  {inpGender === null ? 'Giới tính (chọn)' : inpGender === 'male' ? 'Nam' : 'Nữ'}
                </Text>
              </TouchableOpacity>
              <Ionicons name={inpGender === 'male' ? 'man' : inpGender === 'female' ? 'woman' : 'help-circle-outline'} size={18} color={inpGender === 'male' ? THEME.accentBlue : inpGender === 'female' ? THEME.accentRed : THEME.textSub} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <LinearGradient colors={['#D4AF37', '#B8960C']} style={StyleSheet.absoluteFillObject} borderRadius={14} />
              <Text style={styles.saveBtnText}>LƯU HỒ SƠ & PHÂN TÍCH</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
              {profile && <TouchableOpacity onPress={clearProfile} style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="trash-outline" size={16} color={THEME.accentRed} style={{ marginRight: 4 }} /><Text style={{ color: THEME.accentRed, fontWeight: 'bold', fontSize: 13 }}>Xóa Hồ Sơ</Text></TouchableOpacity>}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setProfileModal(false)} style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="close-outline" size={16} color={THEME.textSub} style={{ marginRight: 4 }} /><Text style={{ color: THEME.textSub, fontWeight: 'bold', fontSize: 13 }}>Đóng</Text></TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // ─── Header ───
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: THEME.border },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileBtn: { position: 'relative' },
  profileBtnBlur: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: THEME.border },
  profileActiveDot: { position: 'absolute', top: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: THEME.accentGreen, borderWidth: 2, borderColor: THEME.bg },
  monthNavWrap: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.border },
  headerMonth: { fontSize: 20, fontWeight: '900', color: THEME.textLight, letterSpacing: 1 },
  headerYear: { fontSize: 12, color: THEME.textSub, marginTop: 1 },

  // ─── Calendar Box ───
  calendarWrap: { marginHorizontal: 14, marginTop: 14, backgroundColor: THEME.card, borderRadius: 26, padding: 16, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 25, elevation: 10 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 12 },
  weekDayText: { fontSize: 12, fontWeight: '700', color: THEME.textSub, width: 40, textAlign: 'center', letterSpacing: 1 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  dayCell: { width: 46, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  todayCell: { borderWidth: 1.5, borderColor: THEME.accentGold, backgroundColor: 'rgba(212,175,55,0.08)' },
  moonDot: { position: 'absolute', top: 2, right: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: THEME.moonColor },
  holidayDot: { position: 'absolute', top: 3, left: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: THEME.accentRed },
  taskDot: { position: 'absolute', bottom: 3, right: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.accentBlue },
  taskDotMissed: { backgroundColor: THEME.accentRed },
  solarText: { fontSize: 17, color: THEME.textLight, fontWeight: '700' },
  lunarText: { fontSize: 9, color: THEME.textSub, marginTop: 1, fontWeight: '500' },

  // ─── Bottom Sheet ───
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '82%', backgroundColor: 'rgba(20,20,24,0.92)', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingTop: 6, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: -15 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 25 },
  bSheetHandleWrap: { alignItems: 'center', marginBottom: 8 },
  bSheetHandle: { width: 44, height: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3 },

  // ─── Detail Header ───
  detailHeader: { alignItems: 'center', marginBottom: 4 },
  shareBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  detailDateMain: { fontSize: 28, fontWeight: '900', color: THEME.textLight, letterSpacing: 1 },
  detailLunarMain: { fontSize: 14, color: THEME.accentGold, fontStyle: 'italic', marginTop: 2, fontWeight: '600' },
  detailBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 },
  detailBadge: { backgroundColor: 'rgba(231,76,60,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  detailBadgeText: { fontSize: 10, fontWeight: '700', color: THEME.accentRed },

  // ─── Tab Bar ───
  tabBarOuter: { marginTop: 10, marginBottom: 2 },
  tabBarBlur: { flexDirection: 'row', backgroundColor: 'rgba(20,20,24,0.6)', borderRadius: 14, padding: 3, position: 'relative', overflow: 'hidden' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 4, zIndex: 2 },
  tabBtnText: { fontSize: 10, fontWeight: '700', color: THEME.textSub, letterSpacing: 0.5 },
  tabBtnTextActive: { color: THEME.accentGold },
  tabIndicator: { position: 'absolute', top: 3, bottom: 3, backgroundColor: 'rgba(212,175,55,0.12)', borderRadius: 11, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  tabContent: { paddingVertical: 12 },

  // ─── Pillar Cards ───
  pillarRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  pillarCard: { flex: 1, backgroundColor: 'rgba(28,28,32,0.6)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  pillarCardMain: { borderColor: 'rgba(212,175,55,0.4)', shadowColor: THEME.accentGold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  pillarLabel: { fontSize: 9, color: THEME.textSub, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  pillarCanChi: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  pillarElBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, marginTop: 1 },
  pillarElDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  pillarElText: { fontSize: 9, fontWeight: '700' },
  pillarNapAm: { fontSize: 8, color: THEME.textSub, marginTop: 2, textAlign: 'center' },

  dividerLine: { height: 1, backgroundColor: THEME.border, marginVertical: 10 },

  // ─── Hoàng Đạo ───
  hoangDaoBox: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  hdHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, gap: 6 },
  hdTitle: { color: THEME.accentGold, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  hdList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  hdBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: THEME.accentGold, backgroundColor: 'rgba(28,28,32,0.6)', overflow: 'hidden' },
  hdBadgeText: { fontSize: 12, fontWeight: '700', color: THEME.textLight },

  // ─── Trực ───
  trucBox: { alignItems: 'center', paddingVertical: 6 },
  trucLabel: { fontSize: 13, fontWeight: '800', color: THEME.accentGreen, letterSpacing: 1 },
  trucDesc: { fontSize: 12, color: THEME.textSub, textAlign: 'center', marginTop: 4, lineHeight: 18, fontStyle: 'italic' },

  // ─── Thập Thần ───
  ttCard: { backgroundColor: 'rgba(28,28,32,0.6)', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  ttHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  ttLabel: { fontSize: 13, fontWeight: '700' },
  ttBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8, marginBottom: 10 },
  ttBadgeText: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  ttDesc: { fontSize: 13, color: THEME.textSub, lineHeight: 20 },
  ttTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, borderWidth: 1, fontSize: 11, fontWeight: '700', marginBottom: 8, overflow: 'hidden' },

  // ─── Ngũ Hành Flow ───
  nhFlow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, flexWrap: 'wrap' },
  elNodeCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  elNodeCanChi: { fontSize: 12, fontWeight: '800' },
  elNodeLabel: { fontSize: 9, fontWeight: '600', marginTop: 3 },
  relArrowWrap: { alignItems: 'center', marginHorizontal: 4 },
  relArrow: { fontSize: 18, fontWeight: '900' },
  relArrowLabel: { fontSize: 8, fontWeight: '700', marginTop: -2 },
  nhRelCard: { backgroundColor: 'rgba(28,28,32,0.6)', padding: 12, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderWidth: 1, borderColor: THEME.border },
  nhRelBetween: { fontSize: 11, color: THEME.textSub, fontWeight: '600' },
  nhRelType: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  nhRelDesc: { fontSize: 12, color: THEME.textSub, marginTop: 3, lineHeight: 18 },
  nhSummary: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
  nhSummaryText: { fontSize: 13, fontWeight: '700', color: THEME.textSub },

  // ─── Cửu Tinh ───
  ctPanel: { alignItems: 'center', backgroundColor: 'rgba(28,28,32,0.6)', borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  ctStarCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  ctStarNum: { fontSize: 28, fontWeight: '900' },
  ctElBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 10 },
  ctElText: { fontSize: 12, fontWeight: '700', marginLeft: 5 },
  ctName: { fontSize: 20, fontWeight: '800', marginTop: 8, letterSpacing: 1 },
  ctMeaning: { fontSize: 13, color: THEME.textSub, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  // ─── Tiết Khí ───
  tkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(28,28,32,0.6)', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  tkName: { fontSize: 14, fontWeight: '700', color: THEME.textLight },
  tkDesc: { fontSize: 12, color: THEME.textSub, marginTop: 2, lineHeight: 17 },

  // ─── Prompt ───
  promptProfile: { alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: THEME.accentGold, borderStyle: 'dashed', backgroundColor: 'rgba(212,175,55,0.04)' },

  // ─── Mệnh ───
  menhBox: { alignItems: 'center', backgroundColor: 'rgba(28,28,32,0.6)', borderRadius: 14, padding: 12, marginTop: 10, borderWidth: 1 },
  menhBadge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12 },
  menhBadgeText: { color: THEME.bg, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  menhNapAm: { fontSize: 12, color: THEME.textSub, marginTop: 6, fontStyle: 'italic' },
  menhMeaning: { fontSize: 12, color: THEME.textSub, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  // ─── Kinh Dịch ───
  methodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: THEME.card, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  methodBtnActive: { backgroundColor: 'rgba(212,175,55,0.12)', borderColor: THEME.accentGold },
  methodBtnText: { fontSize: 12, fontWeight: '600', color: THEME.textSub },
  methodBtnTextActive: { color: THEME.accentGold },
  haoLine: { padding: 2, borderRadius: 4, marginVertical: 1 },
  kdCard: { backgroundColor: 'rgba(28,28,32,0.6)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: THEME.border },
  kdSectionTitle: { fontSize: 11, fontWeight: '700', color: THEME.accentBlue, marginBottom: 6, letterSpacing: 1 },
  kdText: { fontSize: 13, color: THEME.textSub, lineHeight: 20 },
  kdPredCard: { width: '47%', backgroundColor: 'rgba(28,28,32,0.6)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: THEME.border },
  promptProfileText: { color: THEME.accentGold, textAlign: 'center', fontWeight: '700', fontSize: 13, marginTop: 8 },

  // ─── Profile Modal ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,12,0.95)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: 'rgba(28,28,32,0.95)', padding: 24, borderRadius: 26, borderWidth: 1, borderColor: THEME.border, shadowColor: THEME.accentGold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 15, overflow: 'hidden' },
  modalIconBox: { alignSelf: 'center', marginBottom: 12, width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.accentGold },
  modalTitle: { color: THEME.accentGold, fontSize: 18, fontWeight: '900', textAlign: 'center', letterSpacing: 2 },
  modalSub: { color: THEME.textSub, textAlign: 'center', marginBottom: 20, marginTop: 8, fontSize: 13, lineHeight: 20 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.bg, borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: THEME.border },
  input: { flex: 1, color: THEME.textLight, paddingVertical: 14, fontSize: 14 },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 6, overflow: 'hidden' },
  saveBtnText: { color: THEME.bg, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
});
