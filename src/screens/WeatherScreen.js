import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const THEME_COLOR = '#2E8B57';

export default function WeatherScreen() {
  const [weather, setWeather] = useState(null);
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

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`);
      const data = await response.json();
      setWeather(data.current_weather);
    } catch (error) {
      setErrorMsg('Không thể lấy dữ liệu thời tiết. Vui lòng bật GPS.');
    } finally {
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Code Thời Tiết (WMO Weather interpretation codes)
  let iconName = "sunny-outline";
  let bgColors = ['#4DA0B0', '#D39D38']; // Nắng
  
  if (weather) {
    if (weather.weathercode >= 1 && weather.weathercode <= 3) iconName = "partly-sunny-outline";
    if (weather.weathercode >= 50 && weather.weathercode <= 69) { iconName = "rainy-outline"; bgColors = ['#2C3E50', '#3498DB']; } // Mưa
    if (weather.weathercode >= 71 && weather.weathercode <= 82) { iconName = "snow-outline"; bgColors = ['#E0EAFC', '#CFDEF3']; } // Tuyết
    if (weather.weathercode >= 95) { iconName = "thunderstorm-outline"; bgColors = ['#141E30', '#243B55']; } // Sấm chớp
  }

  return (
    <View style={[styles.container, { backgroundColor: weather ? bgColors[0] : '#f5f5f5' }]}>
      {!weather && !isLoading && (
        <View style={styles.promptBox}>
          <Ionicons name="location-outline" size={60} color={THEME_COLOR} />
          <Text style={styles.promptTitle}>Xem Thời Tiết Tại Đây</Text>
          <Text style={styles.promptText}>Bấm nút bên dưới để lấy vị trí và cập nhật thời tiết chính xác nhất.</Text>
          <TouchableOpacity style={styles.fetchButton} onPress={fetchWeather}>
            <Text style={styles.fetchButtonText}>Lấy Thời Tiết Ngay</Text>
          </TouchableOpacity>
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={weather ? '#fff' : THEME_COLOR} />
          <Text style={[styles.loadingText, { color: weather ? '#fff' : '#666' }]}>Đang kết nối vệ tinh...</Text>
        </View>
      )}

      {weather && !isLoading && (
        <View style={styles.weatherBox}>
          <Ionicons name={iconName} size={100} color="#fff" />
          <Text style={styles.temp}>{Math.round(weather.temperature)}°C</Text>
          <Text style={styles.wind}>Sức gió: {weather.windspeed} km/h</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchWeather}>
            <Ionicons name="refresh-outline" size={24} color="#fff" />
            <Text style={styles.refreshText}>Cập nhật lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  promptBox: { alignItems: 'center', backgroundColor: '#fff', padding: 30, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  promptTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
  promptText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25 },
  fetchButton: { backgroundColor: THEME_COLOR, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  fetchButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#FF3B30', marginTop: 15, textAlign: 'center', fontStyle: 'italic' },
  loadingBox: { alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, fontStyle: 'italic' },
  weatherBox: { alignItems: 'center' },
  temp: { fontSize: 80, fontWeight: 'bold', color: '#fff', marginVertical: 10 },
  wind: { fontSize: 20, color: '#fff', opacity: 0.9, marginBottom: 40 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  refreshText: { color: '#fff', fontSize: 16, marginLeft: 8, fontWeight: '600' }
});
