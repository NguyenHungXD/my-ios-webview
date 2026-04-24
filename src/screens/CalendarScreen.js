import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { convertSolar2Lunar } from 'amlich';
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
    const lunar = convertSolar2Lunar(date.day, date.month, date.year, 7);
    setLunarDetail(`Ngày Âm: ${lunar[0]}/${lunar[1]}/${lunar[2]}`);
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        dayComponent={({date, state}) => {
          const lunar = convertSolar2Lunar(date.day, date.month, date.year, 7);
          const isSelected = date.dateString === selected;
          return (
            <TouchableOpacity 
              onPress={() => handleDayPress(date)} 
              style={[styles.dayContainer, isSelected && styles.selectedDay]}
            >
              <Text style={{
                textAlign: 'center', 
                color: state === 'disabled' ? 'gray' : (isSelected ? 'white' : 'black'),
                fontWeight: isSelected ? 'bold' : 'normal'
              }}>
                {date.day}
              </Text>
              <Text style={{
                fontSize: 10, 
                color: isSelected ? '#eee' : 'red',
                marginTop: 2
              }}>
                {lunar[0] === 1 ? `${lunar[0]}/${lunar[1]}` : lunar[0]}
              </Text>
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
