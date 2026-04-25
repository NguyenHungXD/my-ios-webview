import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
const amlich = require('amlich');

// Tông màu Dark Theme từ bản gốc WPF
const THEME = {
  bg: '#2C333A',
  card: '#3B4453',
  header: '#1A202C',
  border: '#4A5568',
  textLight: '#E2E8F0',
  textSub: '#A0AEC0',
  accentBlue: '#3498DB',
  satBg: '#1B4332',
  satBorder: '#27AE60',
  sunBg: '#7F1D1D',
  sunBorder: '#E74C3C'
};

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [city, setCity] = useState('VỊ TRÍ CỦA BẠN');

  useEffect(() => {
    fetchWeather();
  }, []);

  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[d.getDay()];
  };

  const getLunarInfo = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const lunar = amlich.convertSolar2Lunar(d, m, y, 7);
        return `${lunar[0]}/${lunar[1]}`;
      }
    } catch(e) { console.log(e); }
    return '--/--';
  };

  const isWeekend = (dateStr) => {
    const d = new Date(dateStr);
    return { isSat: d.getDay() === 6, isSun: d.getDay() === 0 };
  };

  const fetchWeather = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Bạn chưa cấp quyền Vị trí.');
        setIsLoading(false); return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // Lấy tên thành phố
      try {
        let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode && geocode.length > 0) {
          setCity((geocode[0].subregion || geocode[0].city || geocode[0].region || 'VỊ TRÍ CỦA BẠN').toUpperCase());
        }
      } catch(e) {}

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      
      const response = await fetch(url);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      setErrorMsg('Lỗi kết nối. Vui lòng kiểm tra mạng.');
    } finally {
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getIcon = (code) => {
    if (code >= 1 && code <= 3) return "partly-sunny";
    if (code >= 50 && code <= 69) return "rainy";
    if (code >= 71 && code <= 82) return "snow";
    if (code >= 95) return "thunderstorm";
    return "sunny";
  };

  const getDesc = (code) => {
    if (code >= 1 && code <= 3) return "Nhiều mây";
    if (code >= 50 && code <= 69) return "Có mưa rào";
    if (code >= 71 && code <= 82) return "Có tuyết";
    if (code >= 95) return "Giông bão";
    return "Bầu trời quang đãng";
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={THEME.accentBlue} />
        <Text style={{color: THEME.textSub, marginTop: 15, fontStyle: 'italic'}}>Đang kết nối vệ tinh...</Text>
      </View>
    );
  }

  // Nếu không có dữ liệu hợp lệ (bị lỗi API hoặc chưa lấy được)
  if (!weatherData || !weatherData.current || !weatherData.daily) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <View style={styles.promptBox}>
          <Ionicons name="cloud-download-outline" size={60} color={THEME.textLight} />
          <Text style={styles.promptTitle}>KHÔNG LẤY ĐƯỢC DỮ LIỆU</Text>
          <TouchableOpacity style={styles.fetchButton} onPress={fetchWeather}>
            <Text style={styles.fetchButtonText}>THỬ LẠI</Text>
          </TouchableOpacity>
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        </View>
      </View>
    );
  }

  const current = weatherData.current;
  const daily = weatherData.daily;

  const renderForecast = () => {
    let days = [];
    // Hiển thị 5 ngày tới
    for(let i=0; i<5; i++) {
      if(!daily.time[i]) continue;
      const dateStr = daily.time[i];
      const { isSat, isSun } = isWeekend(dateStr);
      const parts = dateStr.split('-');
      const shortDate = `${parts[2]}/${parts[1]}`;
      
      let dayStyle = styles.forecastDay;
      if (isSat) dayStyle = [styles.forecastDay, { backgroundColor: THEME.satBg, borderColor: THEME.satBorder, borderWidth: 2 }];
      if (isSun) dayStyle = [styles.forecastDay, { backgroundColor: THEME.sunBg, borderColor: THEME.sunBorder, borderWidth: 2 }];

      days.push(
        <View key={i} style={dayStyle}>
          <Text style={[styles.fcDayName, isSat && {color: THEME.satBorder}, isSun && {color: THEME.sunBorder}]}>
            {getDayName(dateStr)}
          </Text>
          <Text style={styles.fcSolarDate}>{shortDate}</Text>
          <Text style={styles.fcLunarDate}>{getLunarInfo(dateStr)}</Text>
          <Ionicons name={getIcon(daily.weather_code[i])} size={26} color={THEME.accentBlue} style={{marginVertical: 5}}/>
          <Text style={styles.fcTemp}>{Math.round(daily.temperature_2m_max[i])}°</Text>
          <Text style={styles.fcMinMax}>{Math.round(daily.temperature_2m_min[i])}° / {Math.round(daily.temperature_2m_max[i])}°</Text>
        </View>
      );
    }
    return days;
  };

  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} - ${getDayName(now.toISOString().split('T')[0])}, ${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding: 15}}>
      
      <View style={styles.card}>
        <Text style={styles.location}>{city}</Text>
        <Text style={styles.currentTime}>{timeStr}</Text>

        <View style={styles.mainInfo}>
          <View style={styles.mainIconBox}>
            <Ionicons name={getIcon(current.weather_code)} size={60} color="#F1C40F" />
          </View>
          <View>
            <Text style={styles.temp}>{Math.round(current.temperature_2m)}°</Text>
            <Text style={styles.desc}>{getDesc(current.weather_code)}</Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Ionicons name="thermometer-outline" size={16} color={THEME.textLight} />
              <Text style={styles.detailLabel}> Thấp nhất</Text>
            </View>
            <Text style={styles.detailValue}>{Math.round(daily.temperature_2m_min[0])}°C</Text>
          </View>
          
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Ionicons name="flame-outline" size={16} color={THEME.textLight} />
              <Text style={styles.detailLabel}> Cao nhất</Text>
            </View>
            <Text style={styles.detailValue}>{Math.round(daily.temperature_2m_max[0])}°C</Text>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Ionicons name="leaf-outline" size={16} color={THEME.textLight} />
              <Text style={styles.detailLabel}> Gió</Text>
            </View>
            <Text style={styles.detailValue}>{current.wind_speed_10m} km/h</Text>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Ionicons name="water-outline" size={16} color={THEME.textLight} />
              <Text style={styles.detailLabel}> Độ ẩm</Text>
            </View>
            <Text style={styles.detailValue}>{current.relative_humidity_2m}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="calendar-outline" size={16} color={THEME.textLight} />
          <Text style={styles.sectionTitle}> DỰ BÁO 5 NGÀY TỚI</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection: 'row', paddingVertical: 5}}>
            {renderForecast()}
          </View>
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchWeather}>
        <Ionicons name="refresh" size={20} color={THEME.textLight} />
        <Text style={styles.refreshText}>Làm mới</Text>
      </TouchableOpacity>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  
  // Prompt UI
  promptBox: { backgroundColor: THEME.card, margin: 20, padding: 30, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  promptTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.textLight, marginTop: 15, marginBottom: 20 },
  fetchButton: { backgroundColor: THEME.accentBlue, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 6 },
  fetchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  errorText: { color: '#E74C3C', marginTop: 15 },
  
  // Weather UI
  card: { backgroundColor: THEME.card, borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: THEME.border },
  location: { fontSize: 20, fontWeight: 'bold', color: THEME.textLight, textAlign: 'center', letterSpacing: 1 },
  currentTime: { fontSize: 12, color: THEME.textSub, textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
  
  mainInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  mainIconBox: { backgroundColor: THEME.header, padding: 15, borderRadius: 50, borderWidth: 1, borderColor: THEME.border, marginRight: 20 },
  temp: { fontSize: 50, fontWeight: '300', color: THEME.textLight, includeFontPadding: false, lineHeight: 60 },
  desc: { fontSize: 14, fontWeight: '600', color: THEME.accentBlue },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detailCard: { width: '48%', backgroundColor: THEME.header, borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: THEME.border },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  detailLabel: { fontSize: 11, color: THEME.textSub },
  detailValue: { fontSize: 16, fontWeight: 'bold', color: THEME.textLight, marginLeft: 20 },
  
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: THEME.textLight },
  
  forecastDay: { backgroundColor: THEME.header, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 10, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: THEME.border, minWidth: 65 },
  fcDayName: { fontSize: 12, fontWeight: 'bold', color: THEME.textLight, marginBottom: 2 },
  fcSolarDate: { fontSize: 10, color: THEME.textSub },
  fcLunarDate: { fontSize: 9, color: '#E74C3C', fontStyle: 'italic', marginTop: 2, fontWeight: 'bold' },
  fcTemp: { fontSize: 14, fontWeight: 'bold', color: THEME.accentBlue, marginBottom: 2 },
  fcMinMax: { fontSize: 9, color: THEME.textSub, fontWeight: 'bold' },

  refreshBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.card, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: THEME.border, marginBottom: 30 },
  refreshText: { color: THEME.textLight, fontWeight: 'bold', marginLeft: 8 }
});
