import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
const amlich = require('amlich');

const { width } = Dimensions.get('window');

// Tông màu Hoàng Gia / Dark Glassmorphism
const THEME = {
  bg: '#1A1A1D',
  card: '#2D2D34',
  header: '#121214',
  textLight: '#F5F5F5',
  textSub: '#A0A0A0',
  accentGold: '#D4AF37', // Vàng hoàng gia
  accentRed: '#C0392B',  // Đỏ đô
  border: '#3E3E42',
  weekendText: '#E74C3C',
  moonColor: '#F39C12'
};

const CAN_ARRAY = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI_ARRAY = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

// Giờ Hoàng Đạo theo Chi của Ngày
const HOANG_DAO_HOURS = {
  'Tý': 'Tý (23-1), Sửu (1-3), Mão (5-7), Ngọ (11-13), Thân (15-17), Dậu (17-19)',
  'Ngọ': 'Tý (23-1), Sửu (1-3), Mão (5-7), Ngọ (11-13), Thân (15-17), Dậu (17-19)',
  
  'Sửu': 'Dần (3-5), Mão (5-7), Tỵ (9-11), Thân (15-17), Tuất (19-21), Hợi (21-23)',
  'Mùi': 'Dần (3-5), Mão (5-7), Tỵ (9-11), Thân (15-17), Tuất (19-21), Hợi (21-23)',
  
  'Dần': 'Tý (23-1), Sửu (1-3), Thìn (7-9), Tỵ (9-11), Mùi (13-15), Tuất (19-21)',
  'Thân': 'Tý (23-1), Sửu (1-3), Thìn (7-9), Tỵ (9-11), Mùi (13-15), Tuất (19-21)',
  
  'Mão': 'Tý (23-1), Dần (3-5), Mão (5-7), Ngọ (11-13), Mùi (13-15), Dậu (17-19)',
  'Dậu': 'Tý (23-1), Dần (3-5), Mão (5-7), Ngọ (11-13), Mùi (13-15), Dậu (17-19)',
  
  'Thìn': 'Dần (3-5), Thìn (7-9), Tỵ (9-11), Thân (15-17), Dậu (17-19), Hợi (21-23)',
  'Tuất': 'Dần (3-5), Thìn (7-9), Tỵ (9-11), Thân (15-17), Dậu (17-19), Hợi (21-23)',
  
  'Tỵ': 'Sửu (1-3), Thìn (7-9), Ngọ (11-13), Mùi (13-15), Tuất (19-21), Hợi (21-23)',
  'Hợi': 'Sửu (1-3), Thìn (7-9), Ngọ (11-13), Mùi (13-15), Tuất (19-21), Hợi (21-23)',
};

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarGrid, setCalendarGrid] = useState([]);
  const [detailInfo, setDetailInfo] = useState(null);

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  useEffect(() => {
    generateCalendar(currentDate);
  }, [currentDate]);

  useEffect(() => {
    updateDetailInfo(selectedDate);
  }, [selectedDate]);

  const generateCalendar = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    let startingDayOfWeek = firstDay.getDay(); 
    let grid = [];
    let currentWeek = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      grid.push(currentWeek);
    }
    setCalendarGrid(grid);
  };

  const updateDetailInfo = (date) => {
    try {
      const d = date.getDate();
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      
      const lunar = amlich.convertSolar2Lunar(d, m, y, 7);
      const lD = lunar[0], lM = lunar[1], lY = lunar[2];

      // Năm Can Chi
      const yearCan = CAN_ARRAY[(lY + 6) % 10];
      const yearChi = CHI_ARRAY[(lY + 8) % 12];
      const namCanChi = `${yearCan} ${yearChi}`;

      // Ngày Can Chi (Dùng JD)
      const jd = amlich.jdFromDate(d, m, y);
      const dayCan = CAN_ARRAY[(jd + 9) % 10];
      const dayChi = CHI_ARRAY[(jd + 1) % 12];
      const ngayCanChi = `${dayCan} ${dayChi}`;

      // Giờ Hoàng Đạo
      const hoangDao = HOANG_DAO_HOURS[dayChi] || '';

      setDetailInfo({
        lunarStr: `Mùng ${lD} tháng ${lM} năm ${lY}`,
        namCanChi,
        ngayCanChi,
        hoangDao,
        isRằm: lD === 15,
        isMung1: lD === 1
      });
    } catch(e) {
      setDetailInfo(null);
    }
  };

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDayPress = (date) => {
    if (!date) return;
    Haptics.selectionAsync();
    setSelectedDate(date);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!date) return false;
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding: 15, paddingBottom: 50}}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={THEME.accentGold} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color={THEME.accentGold} />
        </TouchableOpacity>
      </View>

      {/* Grid Lịch */}
      <View style={styles.calendarBox}>
        {/* Hàng Thứ */}
        <View style={styles.weekRow}>
          {daysOfWeek.map((day, idx) => (
            <Text key={idx} style={[styles.weekDayText, (idx === 0 || idx === 6) && {color: THEME.weekendText}]}>{day}</Text>
          ))}
        </View>

        {/* Các Hàng Ngày */}
        {calendarGrid.map((week, wIdx) => (
          <View key={wIdx} style={styles.daysRow}>
            {week.map((dateObj, dIdx) => {
              if (!dateObj) return <View key={dIdx} style={styles.dayCell} />;

              const isSel = isSelected(dateObj);
              const isTod = isToday(dateObj);
              const isWeekend = dIdx === 0 || dIdx === 6;
              
              let lunar = [1,1,1];
              try { lunar = amlich.convertSolar2Lunar(dateObj.getDate(), dateObj.getMonth()+1, dateObj.getFullYear(), 7); } catch(e) {}
              
              const isRằm = lunar[0] === 15;
              const isMung1 = lunar[0] === 1;

              return (
                <TouchableOpacity 
                  key={dIdx} 
                  style={[
                    styles.dayCell, 
                    isTod && styles.todayCell, 
                    isSel && styles.selectedCell
                  ]}
                  onPress={() => handleDayPress(dateObj)}
                  activeOpacity={0.7}
                >
                  {isRằm && <View style={styles.moonDot} />}
                  <Text style={[
                    styles.solarText, 
                    isWeekend && {color: THEME.weekendText},
                    isSel && {color: '#fff', fontWeight: 'bold'}
                  ]}>
                    {dateObj.getDate()}
                  </Text>
                  <Text style={[
                    styles.lunarText,
                    isMung1 && {color: THEME.accentGold, fontWeight: 'bold'},
                    isSel && {color: '#eee'}
                  ]}>
                    {lunar[0] === 1 ? `${lunar[0]}/${lunar[1]}` : lunar[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Khung Chi Tiết */}
      {detailInfo && (
        <View style={styles.detailBox}>
          <View style={styles.detailRibbon}>
            <Text style={styles.detailRibbonText}>
              {detailInfo.isRằm ? '🌕 NGÀY RẰM' : (detailInfo.isMung1 ? '🌑 MÙNG MỘT' : 'THÔNG TIN BÁT TỰ')}
            </Text>
          </View>
          
          <Text style={styles.detailDateMain}>
            {selectedDate.getDate()} / {selectedDate.getMonth()+1} / {selectedDate.getFullYear()}
          </Text>
          <Text style={styles.detailLunarMain}>{detailInfo.lunarStr}</Text>
          
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="leaf-outline" size={16} color={THEME.accentGold} />
            <Text style={styles.infoLabel}> Năm:</Text>
            <Text style={styles.infoValue}>{detailInfo.namCanChi}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="sunny-outline" size={16} color={THEME.accentGold} />
            <Text style={styles.infoLabel}> Ngày:</Text>
            <Text style={styles.infoValue}>{detailInfo.ngayCanChi}</Text>
          </View>

          <View style={[styles.infoRow, {alignItems: 'flex-start', marginTop: 10}]}>
            <Ionicons name="time-outline" size={16} color={THEME.accentGold} style={{marginTop: 2}}/>
            <View style={{marginLeft: 5, flex: 1}}>
              <Text style={[styles.infoLabel, {color: THEME.accentGold}]}>Giờ Hoàng Đạo:</Text>
              <Text style={styles.hoangDaoText}>{detailInfo.hoangDao}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Nút Về Hôm Nay */}
      <TouchableOpacity style={styles.todayBtn} onPress={handleGoToday}>
        <Ionicons name="calendar" size={18} color="#fff" />
        <Text style={styles.todayBtnText}>Về Hôm Nay</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  headerText: { fontSize: 20, fontWeight: 'bold', color: THEME.accentGold, letterSpacing: 1 },
  navBtn: { padding: 10, backgroundColor: THEME.card, borderRadius: 12, borderWidth: 1, borderColor: THEME.border },
  
  calendarBox: { backgroundColor: THEME.card, borderRadius: 15, padding: 15, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 15 },
  weekDayText: { fontSize: 13, fontWeight: 'bold', color: THEME.textSub, width: 40, textAlign: 'center' },
  
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  dayCell: { width: 42, height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  todayCell: { borderWidth: 1, borderColor: THEME.accentGold, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  selectedCell: { backgroundColor: THEME.accentRed, shadowColor: THEME.accentRed, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  
  moonDot: { position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.moonColor },
  solarText: { fontSize: 16, color: THEME.textLight, fontWeight: '500' },
  lunarText: { fontSize: 9, color: THEME.textSub, marginTop: 2 },

  detailBox: { backgroundColor: THEME.header, marginTop: 25, padding: 20, borderRadius: 15, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  detailRibbon: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: THEME.accentRed, paddingVertical: 5, alignItems: 'center' },
  detailRibbonText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  
  detailDateMain: { fontSize: 26, fontWeight: 'bold', color: THEME.textLight, textAlign: 'center', marginTop: 15 },
  detailLunarMain: { fontSize: 16, color: THEME.accentGold, fontStyle: 'italic', textAlign: 'center', marginTop: 5 },
  
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 15 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: THEME.textSub, fontWeight: 'bold', marginLeft: 5 },
  infoValue: { fontSize: 14, color: THEME.textLight, marginLeft: 10, fontWeight: '500' },
  
  hoangDaoText: { fontSize: 13, color: THEME.textLight, lineHeight: 20, marginTop: 5, fontStyle: 'italic' },

  todayBtn: { flexDirection: 'row', backgroundColor: THEME.card, alignSelf: 'center', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, marginTop: 25, borderWidth: 1, borderColor: THEME.accentGold, alignItems: 'center' },
  todayBtnText: { color: THEME.accentGold, fontWeight: 'bold', marginLeft: 8 }
});
