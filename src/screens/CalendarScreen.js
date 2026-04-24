import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
const amlich = require('amlich');
import * as Haptics from 'expo-haptics';

LocaleConfig.locales['vn'] = {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vn';

const THEME_COLOR = '#2E8B57';

export default function CalendarScreen() {
  const [selected, setSelected] = useState('');
  const [lunarDetail, setLunarDetail] = useState('');

  const handleDayPress = (date) => {
    setSelected(date.dateString);
    try {
      const lunar = amlich.convertSolar2Lunar(date.day, date.month, date.year, 7);
      setLunarDetail(`Ngày Âm: ${lunar[0]}/${lunar[1]}/${lunar[2]}`);
    } catch(e) {
      setLunarDetail(`Lỗi Âm lịch: ${e.message}`);
    }
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        dayComponent={({date, state}) => {
          if (!date) return <View style={styles.dayContainer} />;
          
          let lunar = [1, 1, 1];
          try {
             if (date.day && date.month && date.year) {
               lunar = amlich.convertSolar2Lunar(date.day, date.month, date.year, 7);
             }
          } catch(e) { console.log('Lunar Error:', e); }
          
          const isSelected = date.dateString === selected;
          return (
            <TouchableOpacity 
              onPress={() => handleDayPress(date)} 
              style={[styles.dayContainer, isSelected && styles.selectedDay]}
              activeOpacity={0.7}
            >
              <Text style={{
                textAlign: 'center', 
                color: state === 'disabled' ? '#ccc' : (isSelected ? 'white' : '#333'),
                fontWeight: isSelected ? 'bold' : 'normal',
                fontSize: 16
              }}>
                {date.day}
              </Text>
              {state !== 'disabled' && (
                <Text style={{
                  fontSize: 10, 
                  color: isSelected ? '#eee' : '#FF3B30',
                  marginTop: 2,
                  fontWeight: '500'
                }}>
                  {lunar[0] === 1 ? `${lunar[0]}/${lunar[1]}` : lunar[0]}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
        theme={{
          todayTextColor: THEME_COLOR,
          arrowColor: THEME_COLOR,
          textMonthFontWeight: 'bold',
        }}
      />
      <View style={styles.detailBox}>
        <Text style={styles.detailTitle}>Chi tiết ngày</Text>
        <Text style={styles.detailText}>{lunarDetail || 'Bấm vào một ngày để xem chi tiết Âm lịch.'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  dayContainer: { alignItems: 'center', justifyContent: 'center', padding: 5, borderRadius: 5, width: 40, height: 40 },
  selectedDay: { backgroundColor: THEME_COLOR },
  detailBox: { padding: 20, backgroundColor: '#f9f9f9', margin: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: THEME_COLOR, marginBottom: 10 },
  detailText: { fontSize: 16, color: '#333' }
});
