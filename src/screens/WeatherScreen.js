import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const THEME_COLOR = '#2E8B57';

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWeather = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Bạn chưa cấp quyền truy cập Vị trí.');
        setIsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // API lấy cả hiện tại và dự báo hôm nay (Nhiệt độ max/min, độ ẩm, cảm giác)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      
      const response = await fetch(url);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      setErrorMsg('Không thể lấy dữ liệu thời tiết. Vui lòng kiểm tra mạng hoặc GPS.');
    } finally {
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const current = weatherData?.current;
  const daily = weatherData?.daily;

  // Xử lý logic icon & màu nền
  let iconName = "sunny-outline";
  let weatherText = "Trời nắng";
  let bgColors = ['#4DA0B0', '#D39D38']; // Nắng (mặc định)
  
  if (current) {
    const code = current.weather_code;
    const isDay = current.is_day === 1;

    if (code >= 1 && code <= 3) {
      iconName = isDay ? "partly-sunny-outline" : "cloudy-night-outline";
      weatherText = "Nhiều mây";
      bgColors = isDay ? ['#5D8AA8', '#87CEEB'] : ['#2C3E50', '#34495E'];
    }
    if (code >= 50 && code <= 69) {
      iconName = "rainy-outline";
      weatherText = "Trời mưa";
      bgColors = ['#4B79A1', '#283E51']; 
    }
    if (code >= 71 && code <= 82) {
      iconName = "snow-outline";
      weatherText = "Có tuyết";
      bgColors = ['#E0EAFC', '#CFDEF3']; 
    }
    if (code >= 95) {
      iconName = "thunderstorm-outline";
      weatherText = "Dông sét";
      bgColors = ['#141E30', '#243B55']; 
    }
    if (code === 0 && !isDay) {
      iconName = "moon-outline";
      weatherText = "Trời trong";
      bgColors = ['#0F2027', '#203A43'];
    }
  }

  // --- Màn hình Chưa lấy dữ liệu ---
  if (!weatherData && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#f5f5f5', justifyContent: 'center' }]}>
        <View style={styles.promptBox}>
          <Ionicons name="location-outline" size={60} color={THEME_COLOR} />
          <Text style={styles.promptTitle}>Trạm Khí Tượng Của Bạn</Text>
          <Text style={styles.promptText}>Bấm nút bên dưới để cấp quyền vị trí và tải dữ liệu thời tiết chi tiết nhất.</Text>
          <TouchableOpacity style={styles.fetchButton} onPress={fetchWeather} activeOpacity={0.8}>
            <Text style={styles.fetchButtonText}>Tải Dữ Liệu</Text>
          </TouchableOpacity>
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        </View>
      </View>
    );
  }

  // --- Màn hình Đang tải ---
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: weatherData ? bgColors[1] : '#f5f5f5', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={weatherData ? '#fff' : THEME_COLOR} />
        <Text style={[styles.loadingText, { color: weatherData ? '#fff' : '#666' }]}>Đang phân tích vệ tinh...</Text>
      </View>
    );
  }

  // --- Màn hình Thời tiết Chi tiết (Modern Glassmorphism Style) ---
  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColors[0] }]} contentContainerStyle={styles.scrollContent}>
      
      {/* Khối Nhiệt độ Chính */}
      <View style={styles.mainHeader}>
        <Ionicons name={iconName} size={110} color="#fff" />
        <Text style={styles.temp}>{Math.round(current.temperature_2m)}°</Text>
        <Text style={styles.weatherText}>{weatherText}</Text>
        <Text style={styles.highLowText}>
          H: {Math.round(daily.temperature_2m_max[0])}°  L: {Math.round(daily.temperature_2m_min[0])}°
        </Text>
      </View>

      {/* Các Khối Thông số Chi tiết (Glassmorphism effect) */}
      <View style={styles.detailsGrid}>
        
        {/* Cảm giác như */}
        <View style={styles.detailCard}>
          <Ionicons name="thermometer-outline" size={24} color="#fff" style={styles.detailIcon}/>
          <Text style={styles.detailTitle}>CẢM GIÁC NHƯ</Text>
          <Text style={styles.detailValue}>{Math.round(current.apparent_temperature)}°</Text>
        </View>

        {/* Độ ẩm */}
        <View style={styles.detailCard}>
          <Ionicons name="water-outline" size={24} color="#fff" style={styles.detailIcon}/>
          <Text style={styles.detailTitle}>ĐỘ ẨM</Text>
          <Text style={styles.detailValue}>{current.relative_humidity_2m}%</Text>
        </View>

        {/* Sức gió */}
        <View style={styles.detailCard}>
          <Ionicons name="leaf-outline" size={24} color="#fff" style={styles.detailIcon}/>
          <Text style={styles.detailTitle}>SỨC GIÓ</Text>
          <Text style={styles.detailValue}>{current.wind_speed_10m} km/h</Text>
        </View>

        {/* Lượng mưa */}
        <View style={styles.detailCard}>
          <Ionicons name="rainy-outline" size={24} color="#fff" style={styles.detailIcon}/>
          <Text style={styles.detailTitle}>LƯỢNG MƯA</Text>
          <Text style={styles.detailValue}>{current.precipitation} mm</Text>
        </View>

      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchWeather} activeOpacity={0.8}>
        <Ionicons name="refresh-circle-outline" size={28} color="#fff" />
        <Text style={styles.refreshText}>Làm mới</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50, alignItems: 'center' },
  
  // Prompt UI
  promptBox: { alignItems: 'center', backgroundColor: '#fff', padding: 35, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, marginHorizontal: 20 },
  promptTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginTop: 15, marginBottom: 12 },
  promptText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  fetchButton: { backgroundColor: THEME_COLOR, paddingHorizontal: 35, paddingVertical: 16, borderRadius: 30, width: '100%', alignItems: 'center' },
  fetchButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#FF3B30', marginTop: 15, textAlign: 'center', fontStyle: 'italic' },
  loadingText: { marginTop: 15, fontSize: 16, fontStyle: 'italic', fontWeight: '500' },
  
  // Modern Weather UI
  mainHeader: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  temp: { fontSize: 110, fontWeight: '200', color: '#fff', marginVertical: -10, includeFontPadding: false },
  weatherText: { fontSize: 28, color: '#fff', fontWeight: '500', marginBottom: 8 },
  highLowText: { fontSize: 18, color: '#fff', fontWeight: '600', opacity: 0.9 },

  // Detail Cards Grid
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  detailCard: { 
    width: '48%', 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glassmorphism effect
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10
    })
  },
  detailIcon: { marginBottom: 10, opacity: 0.8 },
  detailTitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
  detailValue: { fontSize: 24, color: '#fff', fontWeight: '600' },

  // Refresh
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, marginTop: 20 },
  refreshText: { color: '#fff', fontSize: 17, marginLeft: 10, fontWeight: '600' }
});
