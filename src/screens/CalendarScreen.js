import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform, Animated, PanResponder } from 'react-native';
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
  getCuuTinhInfo, getTietKhi, getDayScore
} from '../fengshui';

const THEME = {
  ...BASE_THEME,
  weekendText: '#E74C3C',
  moonColor: '#F39C12',
};

const TABS = ['TỨ TRỤ', 'THẬP THẦN', 'NGŨ HÀNH', 'CỬU TINH'];

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Pillar render component
const PillarColumn = ({ label, can, chi, element, napAm, isMain }) => (
  <View style={[styles.pillarCol, isMain && styles.pillarColMain]}>
    <Text style={styles.pillarLabel}>{label}</Text>
    <Text style={[styles.pillarCanChi, isMain && { color: THEME.accentGold, fontSize: 16 }]}>
      <Text style={{ color: NGU_HANH_COLORS[element] || THEME.textLight }}>{can}</Text>
      {' '}{chi}
    </Text>
    {element && (
      <View style={[styles.pillarElementBadge, { backgroundColor: (NGU_HANH_COLORS[element] || '#888') + '30' }]}>
        <Text style={[styles.pillarElementText, { color: NGU_HANH_COLORS[element] || THEME.textSub }]}>{element}</Text>
      </View>
    )}
    {napAm ? <Text style={styles.pillarNapAm}>{napAm}</Text> : null}
  </View>
);

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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gs) => Math.abs(gs.dx) > 20,
      onPanResponderRelease: (evt, gs) => {
        if (gs.dx > 50) { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); Haptics.selectionAsync(); }
        else if (gs.dx < -50) { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); Haptics.selectionAsync(); }
      }
    })
  ).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const [profile, setProfile] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [inpName, setInpName] = useState('');
  const [inpDOB, setInpDOB] = useState('');
  const [inpGioSinh, setInpGioSinh] = useState('');

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { generateCalendar(currentDate); }, [currentDate]);
  useEffect(() => { updateDetailInfo(selectedDate, profile); }, [selectedDate, profile]);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('USER_BAZI_PROFILE');
      if (stored) {
        const p = JSON.parse(stored);
        if (p.gioSinh === undefined) p.gioSinh = null;
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
    if (inpGioSinh.trim()) {
      const h = parseInt(inpGioSinh, 10);
      if (isNaN(h) || h < 0 || h > 23) return Alert.alert('Lỗi', 'Giờ sinh phải từ 0 đến 23.');
      gioSinh = h;
    }

    try {
      const lunar = lunarCache.getLunar(y, m, d);
      const yearCan = CAN_ARRAY[(lunar[2] + 6) % 10];
      const yearChi = CHI_ARRAY[(lunar[2] + 8) % 12];
      const napAm = LUC_THAP_HOA_GIAP[`${yearCan} ${yearChi}`];
      const jd = lunarCache.getJD(y, m, d);
      const nhatCanIdx = (jd + 9) % 10;
      const nhatCan = CAN_ARRAY[nhatCanIdx];

      const userProfile = { name: inpName, dob: `${d}/${m}/${y}`, yearCan, yearChi, nhatCan, napAm, gioSinh };
      await AsyncStorage.setItem('USER_BAZI_PROFILE', JSON.stringify(userProfile));
      setProfile(userProfile);
      setProfileModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Hồ Sơ Hoàn Tất', `Bản mệnh: ${napAm}\nNhật Can (Chủ Sự): ${nhatCan}\nSẵn sàng luận giải Bát Tự!`);
    } catch (e) { Alert.alert('Lỗi', 'Đã xảy ra lỗi tính toán.'); }
  };

  const clearProfile = async () => {
    await AsyncStorage.removeItem('USER_BAZI_PROFILE');
    setProfile(null); setProfileModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const computeDayScores = (year, month) => {
    if (!profile) return {};
    const scores = {};
    const lastDay = new Date(year, month, 0).getDate();
    for (let day = 1; day <= lastDay; day++) {
      const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const lunar = lunarCache.getLunar(year, month, day);
      const jd = lunarCache.getJD(year, month, day);
      const dayChiIdx = (jd + 1) % 12;
      const dayChi = CHI_ARRAY[dayChiIdx];
      const truc = getTruc(lunar[1], dayChi);
      scores[key] = getDayScore(truc, profile.yearChi, dayChi);
    }
    return scores;
  };

  const generateCalendar = (date) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true })
    ]).start();

    const year = date.getFullYear(), month = date.getMonth() + 1;
    const firstDay = new Date(year, month - 1, 1), lastDay = new Date(year, month, 0);
    let startingDayOfWeek = firstDay.getDay(), grid = [], currentWeek = [];
    for (let i = 0; i < startingDayOfWeek; i++) currentWeek.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(new Date(year, month - 1, day));
      if (currentWeek.length === 7) { grid.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      grid.push(currentWeek);
    }
    setCalendarGrid(grid);

    // Cache + scores
    lunarCache.precomputeMonth(year, month);
    setDayScores(computeDayScores(year, month));
  };

  const updateDetailInfo = (date, userProfile) => {
    try {
      const d = date.getDate(), m = date.getMonth() + 1, y = date.getFullYear();
      const lunar = lunarCache.getLunar(y, m, d);
      const lD = lunar[0], lM = lunar[1], lY = lunar[2];
      const jd = lunarCache.getJD(y, m, d);
      const dayCanIdx = (jd + 9) % 10;
      const dayChiIdx = (jd + 1) % 12;
      const dayCan = CAN_ARRAY[dayCanIdx];
      const dayChi = CHI_ARRAY[dayChiIdx];
      const yearCan = CAN_ARRAY[(lY + 6) % 10];
      const yearChi = CHI_ARRAY[(lY + 8) % 12];
      const namCanChi = `${yearCan} ${yearChi} (${LUC_THAP_HOA_GIAP[`${yearCan} ${yearChi}`]})`;
      const ngayCanChi = `${dayCan} ${dayChi} (${LUC_THAP_HOA_GIAP[`${dayCan} ${dayChi}`] || 'Nạp Âm'})`;

      // Tháng (lunar month -> Can Chi)
      const monthChiIdx = getMonthChiIdx(lM);
      const yearCanIdx = (lY + 6) % 10;
      const monthCanIdx = getMonthCanIdx(lM, yearCanIdx);
      const monthCan = CAN_ARRAY[monthCanIdx];
      const monthChi = CHI_ARRAY[monthChiIdx];
      const monthCanChi = `${monthCan} ${monthChi}`;

      // Giờ (nếu có profile.gioSinh)
      const truc = getTruc(lM, dayChi);
      const hoangDaoHours = getGioHoangDao(dayChi);
      const holiday = getHoliday(lD, lM);

      // 4 pillars
      const tuTru = {
        year: { can: yearCan, chi: yearChi, element: NGU_HANH_ELEMENT_CAN[yearCanIdx], napAm: LUC_THAP_HOA_GIAP[`${yearCan} ${yearChi}`] || '' },
        month: { can: monthCan, chi: monthChi, element: NGU_HANH_ELEMENT_CAN[monthCanIdx], napAm: LUC_THAP_HOA_GIAP[monthCanChi] || '' },
        day: { can: dayCan, chi: dayChi, element: NGU_HANH_ELEMENT_CAN[dayCanIdx], napAm: LUC_THAP_HOA_GIAP[`${dayCan} ${dayChi}`] || '' },
        hour: null
      };

      if (userProfile && userProfile.gioSinh !== null) {
        const hChiIdx = getHourChiIdx(userProfile.gioSinh);
        const hCanIdx = getHourCanIdx(hChiIdx, dayCanIdx);
        const hourCan = CAN_ARRAY[hCanIdx];
        const hourChi = CHI_ARRAY[hChiIdx];
        tuTru.hour = { can: hourCan, chi: hourChi, element: NGU_HANH_ELEMENT_CAN[hCanIdx], napAm: LUC_THAP_HOA_GIAP[`${hourCan} ${hourChi}`] || '' };
      }

      // Ngũ Hành relations
      const pillars = [tuTru.year, tuTru.month, tuTru.day];
      if (tuTru.hour) pillars.push(tuTru.hour);
      const nguHanhRelations = [];
      for (let i = 1; i < pillars.length; i++) {
        nguHanhRelations.push({
          between: `${pillars[i - 1].can}${pillars[i - 1].chi} → ${pillars[i].can}${pillars[i].chi}`,
          ...getNguHanhRelation(pillars[i - 1].element, pillars[i].element)
        });
      }

      // Cửu Tinh + Tiết Khí
      const cuuTinh = getCuuTinhInfo(lY, lD);
      const tietKhi = getTietKhi(m, d);

      // Thập Thần
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
        baziReading,
        tuTru, nguHanhRelations,
        cuuTinh, tietKhi
      });
    } catch (e) {
      setDetailInfo(null);
    }
  };

  const handleDayPress = (date) => {
    if (date) { Haptics.selectionAsync(); setSelectedDate(date); setDetailModalVisible(true); setActiveTab(0); }
  };
  const isSelected = (date) => date && date.toDateString() === selectedDate.toDateString();
  const getDateKey = (date) => date ? toDateStr(date) : '';
  const getScore = (date) => date ? dayScores[toDateStr(date)] || 0 : 0;

  // UI helpers
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {TABS.map((tab, idx) => {
        const isActive = idx === activeTab;
        return (
          <TouchableOpacity key={idx} style={styles.tabBtn} onPress={() => { Haptics.selectionAsync(); setActiveTab(idx); }}>
            <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{tab}</Text>
            {isActive && <View style={styles.tabActiveLine} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTuTru = () => {
    if (!detailInfo?.tuTru) return null;
    const { year, month, day, hour } = detailInfo.tuTru;
    return (
      <View style={styles.tabContent}>
        <View style={styles.pillarRow}>
          <PillarColumn label="Năm" can={year.can} chi={year.chi} element={year.element} napAm={year.napAm} />
          <PillarColumn label="Tháng" can={month.can} chi={month.chi} element={month.element} napAm={month.napAm} />
          <PillarColumn label="Ngày" can={day.can} chi={day.chi} element={day.element} napAm={day.napAm} isMain />
          {hour ? (
            <PillarColumn label="Giờ" can={hour.can} chi={hour.chi} element={hour.element} napAm={hour.napAm} />
          ) : (
            <View style={styles.pillarCol}>
              <Text style={styles.pillarLabel}>Giờ</Text>
              <Text style={[styles.pillarCanChi, { color: THEME.textSub, fontSize: 10 }]}>---</Text>
            </View>
          )}
        </View>
        <View style={styles.hoangDaoBox}>
          <Text style={styles.hoangDaoTitle}>Giờ Hoàng Đạo</Text>
          <View style={styles.hoangDaoList}>
            {detailInfo.hoangDaoHours.map(h => <Text key={h} style={styles.hoangDaoBadge}>{h}</Text>)}
          </View>
        </View>
        <Text style={styles.trucDescText}>{TRUC_DESC[detailInfo.truc]}</Text>
      </View>
    );
  };

  const renderThapThan = () => (
    <View style={styles.tabContent}>
      {detailInfo.baziReading ? (
        <View>
          <View style={styles.astroItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.astroItemTitle}>Thập Thần: </Text>
              <View style={[styles.astroBadge, { backgroundColor: detailInfo.baziReading.thapThan.color }]}>
                <Text style={styles.astroBadgeText}>{detailInfo.baziReading.thapThan.key.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.astroItemDesc}>{detailInfo.baziReading.thapThan.desc}</Text>
          </View>
          <View style={styles.astroItem}>
            <Text style={[styles.astroItemTitle, { color: detailInfo.baziReading.diaChi.color }]}>
              Hành Xung Địa Chi ({detailInfo.baziReading.diaChi.type}):
            </Text>
            <Text style={styles.astroItemDesc}>{detailInfo.baziReading.diaChi.desc}</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.promptProfile} onPress={() => setProfileModal(true)}>
          <Text style={styles.promptProfileText}>Thiết lập Hồ Sơ Bát Tự để xem Thập Thần</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderNguHanh = () => {
    if (!detailInfo?.nguHanhRelations) return null;
    return (
      <View style={styles.tabContent}>
        <View style={styles.elementSummary}>
          {detailInfo.tuTru && ['year', 'month', 'day', 'hour'].map(key => {
            const p = detailInfo.tuTru[key];
            if (!p) return null;
            return (
              <View key={key} style={styles.elementChip}>
                <Text style={[styles.elementChipLabel, { color: NGU_HANH_COLORS[p.element] || THEME.textLight }]}>
                  {p.can}{p.chi}
                </Text>
                <Text style={[styles.elementChipValue, { color: NGU_HANH_COLORS[p.element] || THEME.textSub }]}>
                  {p.element}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.divider} />
        {detailInfo.nguHanhRelations.length === 0 ? (
          <Text style={{ color: THEME.textSub, textAlign: 'center', fontStyle: 'italic' }}>Cần thêm Giờ Sinh để phân tích Ngũ Hành đầy đủ.</Text>
        ) : (
          detailInfo.nguHanhRelations.map((rel, idx) => (
            <View key={idx} style={[styles.relRow, { borderLeftColor: rel.color, borderLeftWidth: 3 }]}>
              <Text style={styles.relBetween}>{rel.between}</Text>
              <Text style={[styles.relType, { color: rel.color }]}>{rel.type}</Text>
              <Text style={styles.relDesc}>{rel.desc}</Text>
            </View>
          ))
        )}
        <Text style={styles.astroMyInfo}>({detailInfo.nguHanhRelations.filter(r => r.type === 'Tương Sinh' || r.type === 'Được Sinh').length} Sinh / {detailInfo.nguHanhRelations.filter(r => r.type === 'Tương Khắc' || r.type === 'Bị Khắc').length} Khắc)</Text>
      </View>
    );
  };

  const renderCuuTinh = () => {
    if (!detailInfo?.cuuTinh) return null;
    const { star, name, element, meaning } = detailInfo.cuuTinh;
    return (
      <View style={styles.tabContent}>
        <View style={[styles.cuuTinhBox, { borderColor: NGU_HANH_COLORS[element] || THEME.accentGold }]}>
          <Text style={styles.cuuTinhStar}>★ {star}</Text>
          <Text style={[styles.cuuTinhName, { color: NGU_HANH_COLORS[element] || THEME.accentGold }]}>{name}</Text>
          <View style={[styles.pillarElementBadge, { backgroundColor: (NGU_HANH_COLORS[element] || '#888') + '30' }]}>
            <Text style={[styles.pillarElementText, { color: NGU_HANH_COLORS[element] || THEME.textSub }]}>{element}</Text>
          </View>
          <Text style={styles.cuuTinhMeaning}>{meaning}</Text>
        </View>
        {detailInfo.tietKhi && (
          <View style={styles.tietKhiBox}>
            <Ionicons name="partly-sunny" size={20} color={THEME.accentGold} style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.tietKhiName}>{detailInfo.tietKhi.name}</Text>
              <Text style={styles.tietKhiDesc}>{detailInfo.tietKhi.desc}</Text>
              {!detailInfo.tietKhi.exact && <Text style={[styles.tietKhiDesc, { color: THEME.accentGold }]}>(gần đúng)</Text>}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 0: return renderTuTru();
      case 1: return renderThapThan();
      case 2: return renderNguHanh();
      case 3: return renderCuuTinh();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setInpName(profile?.name || ''); setInpDOB(profile?.dob ? profile.dob.replace(/\//g, '-') : ''); setInpGioSinh(profile?.gioSinh != null ? String(profile.gioSinh) : ''); setProfileModal(true); }} style={styles.profileBtn}>
            <Ionicons name="compass" size={32} color={profile ? THEME.accentGold : THEME.textSub} />
            {profile && <View style={styles.profileActiveDot} />}
          </TouchableOpacity>
          <View style={styles.monthNavWrap}>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); }} style={styles.navBtn}><Ionicons name="chevron-back" size={20} color={THEME.accentGold} /></TouchableOpacity>
            <Text style={styles.headerText}>Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}</Text>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); }} style={styles.navBtn}><Ionicons name="chevron-forward" size={20} color={THEME.accentGold} /></TouchableOpacity>
          </View>
        </View>

        <Animated.View style={[styles.calendarBox, { opacity: fadeAnim }]} {...panResponder.panHandlers}>
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
                const key = getDateKey(dateObj);
                const lunar = lunarCache.getLunar(key);
                const isRằm = lunar[0] === 15;
                const isMung1 = lunar[0] === 1;
                const isHoliday = !!getHoliday(lunar[0], lunar[1]);
                const score = getScore(dateObj);
                let cellBg = null;
                if (!isSel) {
                  if (score > 2) cellBg = 'rgba(46, 204, 113, 0.12)';
                  else if (score < 0) cellBg = 'rgba(231, 76, 60, 0.10)';
                }

                return (
                  <TouchableOpacity key={dIdx} style={[styles.dayCell, isTod && styles.todayCell, cellBg && { backgroundColor: cellBg }]} onPress={() => handleDayPress(dateObj)} activeOpacity={0.7}>
                    {isSel && <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 12, backgroundColor: THEME.accentGold, transform: [{ scale: pulseAnim }] }]} />}
                    {isRằm && <View style={styles.moonDot} />}
                    {isHoliday && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: THEME.accentRed, position: 'absolute', top: 4 }} />}
                    <Text style={[styles.solarText, isWeekend && { color: THEME.weekendText }, isSel && { color: THEME.bg, fontWeight: 'bold' }]}>{dateObj.getDate()}</Text>
                    <Text style={[styles.lunarText, isMung1 && { color: THEME.accentGold, fontWeight: 'bold' }, isSel && { color: THEME.bg }]}>{lunar[0] === 1 ? `${lunar[0]}/${lunar[1]}` : lunar[0]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Bottom Sheet Chi Tiết Ngày */}
      <Modal visible={detailModalVisible} transparent animationType="slide" onRequestClose={() => setDetailModalVisible(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setDetailModalVisible(false)} />
        <BlurView intensity={90} tint="dark" style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          {detailInfo && (
            <View>
              <View style={styles.detailRibbon}>
                <Text style={styles.detailRibbonText}>
                  {detailInfo.holiday ? `🎉 ${detailInfo.holiday.toUpperCase()}` : (detailInfo.isRằm ? '🌕 RẰM' : (detailInfo.isMung1 ? '🌑 MÙNG 1' : `NGÀY ${detailInfo.truc.toUpperCase()}`))}
                </Text>
              </View>
              <Text style={styles.detailDateMain}>{selectedDate.getDate()} / {selectedDate.getMonth() + 1} / {selectedDate.getFullYear()}</Text>
              <Text style={styles.detailLunarMain}>{detailInfo.lunarStr}</Text>
              {renderTabBar()}
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {renderActiveTab()}
              </ScrollView>
            </View>
          )}
        </BlurView>
      </Modal>

      {/* Modal Profile */}
      <Modal visible={profileModal} transparent animationType="fade">
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}><Ionicons name="compass-outline" size={40} color={THEME.accentGold} /></View>
            <Text style={styles.modalTitle}>THIẾT LẬP BÁT TỰ</Text>
            <Text style={styles.modalSub}>Nhập thông tin để kích hoạt thuật toán Thập Thần và Hoa Giáp.</Text>
            <TextInput style={styles.input} placeholder="Họ và Tên (VD: Nguyễn Văn A)" placeholderTextColor={THEME.textSub} value={inpName} onChangeText={setInpName} />
            <TextInput style={styles.input} placeholder="Ngày Sinh Dương Lịch (DD-MM-YYYY)" placeholderTextColor={THEME.textSub} value={inpDOB} onChangeText={setInpDOB} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Giờ Sinh (0-23, để trống nếu không biết)" placeholderTextColor={THEME.textSub} value={inpGioSinh} onChangeText={setInpGioSinh} keyboardType="numeric" />
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>LƯU HỒ SƠ & PHÂN TÍCH</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              {profile && <TouchableOpacity onPress={clearProfile}><Text style={{ color: THEME.accentRed, fontWeight: 'bold' }}>Xóa Hồ Sơ</Text></TouchableOpacity>}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setProfileModal(false)}><Text style={{ color: THEME.textSub, fontWeight: 'bold' }}>Đóng</Text></TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20 },
  headerText: { fontSize: 18, fontWeight: '900', color: THEME.accentGold, letterSpacing: 1, marginHorizontal: 15 },
  navBtn: { padding: 8, backgroundColor: THEME.card, borderRadius: 12, borderWidth: 1, borderColor: THEME.border },
  monthNavWrap: { flexDirection: 'row', alignItems: 'center' },
  profileBtn: { position: 'relative' },
  profileActiveDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: THEME.accentGreen, borderWidth: 2, borderColor: THEME.bg },
  calendarBox: { backgroundColor: THEME.card, borderRadius: 25, padding: 20, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10, marginHorizontal: 15 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 15 },
  weekDayText: { fontSize: 13, fontWeight: 'bold', color: THEME.textSub, width: 40, textAlign: 'center' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  dayCell: { width: 44, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  todayCell: { borderWidth: 1, borderColor: THEME.accentGold, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  moonDot: { position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.moonColor },
  solarText: { fontSize: 16, color: THEME.textLight, fontWeight: 'bold' },
  lunarText: { fontSize: 9, color: THEME.textSub, marginTop: 2, fontWeight: '600' },

  // Bottom sheet
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '85%', backgroundColor: 'rgba(28, 28, 32, 0.85)', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 10, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20 },
  bottomSheetHandle: { width: 40, height: 5, backgroundColor: '#555', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  detailRibbon: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: THEME.accentRed, paddingVertical: 6, alignItems: 'center', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  detailRibbonText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  detailDateMain: { fontSize: 26, fontWeight: '900', color: THEME.textLight, textAlign: 'center', marginTop: 30, letterSpacing: 1 },
  detailLunarMain: { fontSize: 14, color: THEME.accentGold, fontStyle: 'italic', textAlign: 'center', marginTop: 3, fontWeight: '600' },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 15 },

  // Tab bar
  tabBar: { flexDirection: 'row', marginTop: 12, borderBottomWidth: 1, borderColor: THEME.border },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabBtnText: { fontSize: 11, fontWeight: '700', color: THEME.textSub, letterSpacing: 0.5 },
  tabBtnTextActive: { color: THEME.accentGold },
  tabActiveLine: { height: 3, backgroundColor: THEME.accentGold, width: '70%', borderRadius: 2, marginTop: 8 },
  tabContent: { paddingVertical: 15 },

  // Pillar (Tứ Trụ)
  pillarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  pillarCol: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  pillarColMain: { backgroundColor: 'rgba(212, 175, 55, 0.08)', borderRadius: 10, paddingVertical: 8 },
  pillarLabel: { fontSize: 9, color: THEME.textSub, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  pillarCanChi: { fontSize: 13, color: THEME.textLight, fontWeight: '700', marginBottom: 3 },
  pillarElementBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 2 },
  pillarElementText: { fontSize: 10, fontWeight: 'bold' },
  pillarNapAm: { fontSize: 8, color: THEME.textSub, marginTop: 2, textAlign: 'center' },

  // Hoàng Đạo
  hoangDaoBox: { backgroundColor: THEME.bg, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: THEME.accentGold },
  hoangDaoTitle: { color: THEME.accentGold, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', fontSize: 11, textTransform: 'uppercase' },
  hoangDaoList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  hoangDaoBadge: { backgroundColor: THEME.card, color: THEME.textLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, margin: 3, fontSize: 11, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },

  trucDescText: { color: THEME.textLight, textAlign: 'center', fontSize: 12, lineHeight: 18, fontStyle: 'italic' },

  // Thập Thần / Xung Hợp
  astroItem: { marginBottom: 12, backgroundColor: THEME.card, padding: 12, borderRadius: 10 },
  astroItemTitle: { color: THEME.textLight, fontWeight: 'bold', fontSize: 12, marginBottom: 5 },
  astroBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 10 },
  astroBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  astroItemDesc: { fontSize: 12, lineHeight: 18, color: THEME.textSub, marginTop: 5 },
  astroMyInfo: { color: THEME.accentGold, fontWeight: 'bold', textAlign: 'center', fontSize: 12, marginTop: 10 },

  // Ngũ Hành
  elementSummary: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  elementChip: { alignItems: 'center', marginHorizontal: 6 },
  elementChipLabel: { fontSize: 13, fontWeight: 'bold' },
  elementChipValue: { fontSize: 10, marginTop: 2 },
  relRow: { backgroundColor: THEME.card, padding: 12, borderRadius: 10, marginBottom: 8, paddingLeft: 15 },
  relBetween: { fontSize: 11, color: THEME.textSub, fontWeight: '600' },
  relType: { fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  relDesc: { fontSize: 11, color: THEME.textSub, marginTop: 2 },

  // Cửu Tinh
  cuuTinhBox: { alignItems: 'center', backgroundColor: THEME.card, borderRadius: 15, padding: 20, borderWidth: 1, marginBottom: 15 },
  cuuTinhStar: { fontSize: 32, color: THEME.accentGold, fontWeight: '900' },
  cuuTinhName: { fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
  cuuTinhMeaning: { fontSize: 13, color: THEME.textSub, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  // Tiết Khí
  tietKhiBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: THEME.border },
  tietKhiName: { fontSize: 14, fontWeight: 'bold', color: THEME.textLight },
  tietKhiDesc: { fontSize: 12, color: THEME.textSub, marginTop: 2 },

  promptProfile: { marginTop: 10, backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: THEME.accentGold, borderStyle: 'dashed' },
  promptProfileText: { color: THEME.accentGold, textAlign: 'center', fontWeight: 'bold', fontSize: 12 },

  // Modal Profile
  modalOverlay: { flex: 1, backgroundColor: THEME.modalBg, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: THEME.card, padding: 25, borderRadius: 25, borderWidth: 1, borderColor: THEME.border, shadowColor: THEME.accentGold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
  modalIconBox: { alignSelf: 'center', marginBottom: 15, backgroundColor: THEME.bg, padding: 15, borderRadius: 40, borderWidth: 1, borderColor: THEME.accentGold },
  modalTitle: { color: THEME.accentGold, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
  modalSub: { color: THEME.textSub, textAlign: 'center', marginBottom: 25, fontSize: 13, lineHeight: 20 },
  input: { backgroundColor: THEME.bg, color: THEME.textLight, padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: THEME.border, fontSize: 15 },
  saveBtn: { backgroundColor: THEME.accentGold, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: THEME.accentGold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: THEME.bg, fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});
