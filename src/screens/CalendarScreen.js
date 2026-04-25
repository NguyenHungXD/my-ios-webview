import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
const amlich = require('amlich');

const THEME_COLOR = '#2E8B57';
const BG_COLOR = '#F9F9F9';

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarGrid, setCalendarGrid] = useState([]);
  const [lunarDetail, setLunarDetail] = useState('');

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  useEffect(() => {
    generateCalendar(currentDate);
  }, [currentDate]);

  useEffect(() => {
    updateLunarDetail(selectedDate);
  }, [selectedDate]);

  const generateCalendar = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Ngày đầu tiên của tháng
    const firstDay = new Date(year, month, 1);
    // Số ngày của tháng
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    let startingDayOfWeek = firstDay.getDay(); // 0: CN, 1: T2...

    let grid = [];
    let currentWeek = [];

    // Điền khoảng trống của tháng trước
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Điền các ngày trong tháng
    for (let day = 1; day <= totalDays; day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }

    // Điền khoảng trống của tháng sau
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      grid.push(currentWeek);
    }

    setCalendarGrid(grid);
  };

  const updateLunarDetail = (date) => {
    try {
      const d = date.getDate();
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const lunar = amlich.convertSolar2Lunar(d, m, y, 7);
      setLunarDetail(`Ngày Âm: ${lunar[0]} tháng ${lunar[1]} năm ${lunar[2]}`);
    } catch(e) {
      setLunarDetail(`Không thể tính Âm lịch cho ngày này.`);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayPress = (date) => {
    if (!date) return;
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
      
      {/* Header Tháng / Năm */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={THEME_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Tháng {currentDate.getMonth() + 1} - {currentDate.getFullYear()}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color={THEME_COLOR} />
        </TouchableOpacity>
      </View>

      {/* Grid Lịch */}
      <View style={styles.calendarBox}>
        {/* Hàng Thứ */}
        <View style={styles.weekRow}>
          {daysOfWeek.map((day, idx) => (
            <Text key={idx} style={[styles.weekDayText, (idx === 0 || idx === 6) && {color: '#FF3B30'}]}>{day}</Text>
          ))}
        </View>

        {/* Các Hàng Ngày */}
        {calendarGrid.map((week, wIdx) => (
          <View key={wIdx} style={styles.daysRow}>
            {week.map((dateObj, dIdx) => {
              if (!dateObj) {
                return <View key={dIdx} style={styles.dayCell} />;
              }

              const isSel = isSelected(dateObj);
              const isTod = isToday(dateObj);
              let lunar = [1,1,1];
              try {
                lunar = amlich.convertSolar2Lunar(dateObj.getDate(), dateObj.getMonth()+1, dateObj.getFullYear(), 7);
              } catch(e) {}

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
                  <Text style={[
                    styles.solarText, 
                    isTod && {color: THEME_COLOR, fontWeight: 'bold'},
                    isSel && {color: '#fff', fontWeight: 'bold'}
                  ]}>
                    {dateObj.getDate()}
                  </Text>
                  <Text style={[
                    styles.lunarText,
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

      {/* Chi tiết Ngày */}
      <View style={styles.detailBox}>
        <Ionicons name="information-circle" size={24} color={THEME_COLOR} style={{marginRight: 10}}/>
        <View>
          <Text style={styles.detailDate}>
            Ngày {selectedDate.getDate()} tháng {selectedDate.getMonth()+1} năm {selectedDate.getFullYear()}
          </Text>
          <Text style={styles.detailLunar}>{lunarDetail}</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  headerText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  navBtn: { padding: 10, backgroundColor: BG_COLOR, borderRadius: 10 },
  
  calendarBox: { backgroundColor: '#fff', borderRadius: 15, padding: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#eee' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 10 },
  weekDayText: { fontSize: 14, fontWeight: 'bold', color: '#666', width: 40, textAlign: 'center' },
  
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 },
  dayCell: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  todayCell: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: THEME_COLOR },
  selectedCell: { backgroundColor: THEME_COLOR, shadowColor: THEME_COLOR, shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.4, shadowRadius: 5, elevation: 5 },
  
  solarText: { fontSize: 16, color: '#333' },
  lunarText: { fontSize: 9, color: '#FF3B30', marginTop: 2, fontWeight: '500' },

  detailBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG_COLOR, marginTop: 25, padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#eee' },
  detailDate: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  detailLunar: { fontSize: 14, color: THEME_COLOR, fontStyle: 'italic', fontWeight: '500' }
});
