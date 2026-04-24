import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const THEME_COLOR = '#2E8B57';

export default function WeatherScreen() {
  const [weather, setWeather] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Bạn đã từ chối quyền Vị trí. Không thể lấy thời tiết.');
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const data = await res.json();
        setWeather(data.current_weather);
      } catch (err) {
        setErrorMsg('Lỗi khi lấy dữ liệu thời tiết.');
      }
    })();
  }, []);

  if (errorMsg) {
    return <View style={styles.center}><Text style={styles.errorText}>{errorMsg}</Text></View>;
  }

  if (!weather) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
        <Text style={{marginTop: 10}}>Đang định vị và lấy thời tiết...</Text>
      </View>
    );
  }

  let iconName = "sunny-outline";
  let bgColors = ['#4DA0B0', '#D39D38']; 
  if (weather.weathercode >= 1 && weather.weathercode <= 3) iconName = "partly-sunny-outline";
  if (weather.weathercode >= 50 && weather.weathercode <= 69) { iconName = "rainy-outline"; bgColors = ['#2C3E50', '#3498DB']; } 

  return (
    <View style={styles.container}>
      <View style={[styles.weatherCard, { backgroundColor: bgColors[1] }]}>
        <Ionicons name={iconName} size={100} color="#fff" />
        <Text style={styles.tempText}>{weather.temperature}°C</Text>
        <Text style={styles.windText}>Tốc độ gió: {weather.windspeed} km/h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  weatherCard: { padding: 40, borderRadius: 20, alignItems: 'center', width: '80%', shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  tempText: { fontSize: 60, fontWeight: 'bold', color: '#fff', marginVertical: 10 },
  windText: { fontSize: 18, color: '#fff' }
});
