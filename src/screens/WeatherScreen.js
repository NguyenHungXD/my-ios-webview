import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
const amlich = require('amlich');

const SPREADSHEET_ID = '1Od2c46Msy7FraALvf4YWyvRgfHxhfBHpGr0djUQdnq8';

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
  sunBorder: '#E74C3C',
  badgeRed: '#E74C3C',
  modalBg: 'rgba(15, 23, 42, 0.95)' // Kính mờ siêu cấp
};

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [city, setCity] = useState('VỊ TRÍ CỦA BẠN');
  
  // Dữ liệu công việc
  const [allTasks, setAllTasks] = useState([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  useEffect(() => {
    fetchWeather();
    fetchTasksFromGoogle();
  }, []);

  const fetchTasksFromGoogle = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Abc`;
      const response = await fetch(url);
      const text = await response.text();
      const lines = text.split('\n');
      const parsedTasks = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split('","').map(v => v.replace(/^"|"$/g, ''));
        const dateStr = row[0];
        const jobStr = row[1];
        if (!dateStr || !jobStr) continue;

        const fromH = row[2] ? row[2].padStart(2, '0') : '00';
        const fromM = row[3] ? row[3].padStart(2, '0') : '00';
        const toH = row[4] ? row[4].padStart(2, '0') : '00';
        const toM = row[5] ? row[5].padStart(2, '0') : '00';
        const status = row[6] ? row[6].toUpperCase() : 'WAIT';

        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          // Format chuẩn hóa để match với forecast (YYYY-MM-DD -> DD-MM-YYYY)
          const standardizedDateStr = `${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}-${parts[2]}`;
          
          parsedTasks.push({ 
            id: `cloud_${i}`, 
            dateStr: standardizedDateStr, 
            job: jobStr,
            fromTime: `${fromH}:${fromM}`,
            toTime: `${toH}:${toM}`,
            timeVal: parseInt(fromH) * 60 + parseInt(fromM),
            status
          });
        }
      }

      // Nạp thêm task từ LocalStorage
      const localTasksStr = await AsyncStorage.getItem('LOCAL_TASKS');
      if (localTasksStr) {
        const localTasks = JSON.parse(localTasksStr);
        localTasks.forEach(t => {
          parsedTasks.push({ 
            id: t.id, dateStr: t.dateStr, job: t.job, 
            fromTime: '00:00', toTime: '23:59', timeVal: 0, status: 'LOCAL' 
          });
        });
      }

      setAllTasks(parsedTasks);
    } catch(err) {
      console.log('Lỗi tải task cho thời tiết', err);
    }
  };

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
    } catch(e) {}
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

  const handleDayPress = (dateStr) => {
    Haptics.selectionAsync();
    
    // Convert YYYY-MM-DD from forecast to DD-MM-YYYY
    const parts = dateStr.split('-');
    const formatDDMMYYYY = `${parts[2]}-${parts[1]}-${parts[0]}`;
    
    // Tìm các task trong ngày đó
    const dayTasks = allTasks.filter(t => t.dateStr === formatDDMMYYYY);
    dayTasks.sort((a,b) => a.timeVal - b.timeVal);

    setSelectedDateStr(`${parts[2]}/${parts[1]}/${parts[0]}`);
    setSelectedDayTasks(dayTasks);
    setModalVisible(true);
  };

  if (!weatherData && !isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <View style={styles.promptBox}>
          <Ionicons name="cloud-download-outline" size={60} color={THEME.textLight} />
          <Text style={styles.promptTitle}>DỮ LIỆU THỜI TIẾT</Text>
          <TouchableOpacity style={styles.fetchButton} onPress={fetchWeather}>
            <Text style={styles.fetchButtonText}>CẬP NHẬT NGAY</Text>
          </TouchableOpacity>
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={THEME.accentBlue} />
        <Text style={{color: THEME.textSub, marginTop: 15, fontStyle: 'italic'}}>Đang kết nối vệ tinh...</Text>
      </View>
    );
  }

  const current = weatherData.current;
  const daily = weatherData.daily;

  const renderForecast = () => {
    let days = [];
    for(let i=0; i<5; i++) {
      if(!daily.time[i]) continue;
      const dateStr = daily.time[i]; // YYYY-MM-DD
      const { isSat, isSun } = isWeekend(dateStr);
      const parts = dateStr.split('-');
      const shortDate = `${parts[2]}/${parts[1]}`;
      const matchFormat = `${parts[2]}-${parts[1]}-${parts[0]}`;
      
      const dayTasks = allTasks.filter(t => t.dateStr === matchFormat);
      const taskCount = dayTasks.length;

      let dayStyle = styles.forecastDay;
      if (isSat) dayStyle = [styles.forecastDay, { backgroundColor: THEME.satBg, borderColor: THEME.satBorder, borderWidth: 2 }];
      if (isSun) dayStyle = [styles.forecastDay, { backgroundColor: THEME.sunBg, borderColor: THEME.sunBorder, borderWidth: 2 }];

      days.push(
        <TouchableOpacity key={i} style={dayStyle} onPress={() => handleDayPress(dateStr)} activeOpacity={0.8}>
          {taskCount > 0 && (
            <View style={styles.badgeBox}>
              <Text style={styles.badgeText}>{taskCount > 9 ? '9+' : taskCount}</Text>
            </View>
          )}

          <Text style={[styles.fcDayName, isSat && {color: THEME.satBorder}, isSun && {color: THEME.sunBorder}]}>
            {getDayName(dateStr)}
          </Text>
          <Text style={styles.fcSolarDate}>{shortDate}</Text>
          <Text style={styles.fcLunarDate}>{getLunarInfo(dateStr)}</Text>
          <Ionicons name={getIcon(daily.weather_code[i])} size={26} color={THEME.accentBlue} style={{marginVertical: 5}}/>
          <Text style={styles.fcTemp}>{Math.round(daily.temperature_2m_max[i])}°</Text>
          <Text style={styles.fcMinMax}>{Math.round(daily.temperature_2m_min[i])}° / {Math.round(daily.temperature_2m_max[i])}°</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} - ${getDayName(now.toISOString().split('T')[0])}, ${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;

  const renderModalTasks = () => {
    if (selectedDayTasks.length === 0) {
      return (
        <View style={styles.emptyTaskBox}>
          <Ionicons name="cafe-outline" size={60} color={THEME.textSub} />
          <Text style={styles.emptyTaskText}>Bạn có một ngày thảnh thơi!</Text>
          <Text style={styles.emptyTaskSubText}>Không có lịch trình nào được xếp.</Text>
        </View>
      );
    }

    return selectedDayTasks.map((t, idx) => {
      let statusColor = THEME.accentBlue;
      if (t.status === 'MISSED') statusColor = THEME.accentRed;
      if (t.status === 'DONE') statusColor = '#2ECC71';

      return (
        <View key={idx} style={[styles.modalTaskCard, { borderLeftColor: statusColor }]}>
          <View style={styles.modalTaskTimeWrap}>
            <Ionicons name="time-outline" size={14} color={THEME.textSub} style={{marginRight: 5}}/>
            <Text style={styles.modalTaskTime}>{t.fromTime} - {t.toTime}</Text>
          </View>
          <Text style={styles.modalTaskName}>{t.job}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{padding: 15, paddingBottom: 100}}>
        
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
            <View style={{flexDirection: 'row', paddingVertical: 10}}>
              {renderForecast()}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchWeather}>
          <Ionicons name="refresh" size={20} color={THEME.textLight} />
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
        
      </ScrollView>

      {/* Modal Hiện Lịch Trình Công Việc (Glassmorphism effect) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>LỊCH TRÌNH</Text>
                <Text style={styles.modalHeaderDate}>{selectedDateStr}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close-circle" size={32} color={THEME.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{maxHeight: 400}} showsVerticalScrollIndicator={false}>
              {renderModalTasks()}
            </ScrollView>

          </View>
        </View>
      </Modal>

    </View>
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
  card: { backgroundColor: THEME.card, borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset:{width:0, height: 4}, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  location: { fontSize: 20, fontWeight: 'bold', color: THEME.textLight, textAlign: 'center', letterSpacing: 1 },
  currentTime: { fontSize: 12, color: THEME.textSub, textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
  
  mainInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  mainIconBox: { backgroundColor: THEME.header, padding: 15, borderRadius: 50, borderWidth: 1, borderColor: THEME.border, marginRight: 20 },
  temp: { fontSize: 50, fontWeight: '300', color: THEME.textLight, includeFontPadding: false, lineHeight: 60 },
  desc: { fontSize: 14, fontWeight: '600', color: THEME.accentBlue },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detailCard: { width: '48%', backgroundColor: THEME.header, borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: THEME.border },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  detailLabel: { fontSize: 11, color: THEME.textSub },
  detailValue: { fontSize: 16, fontWeight: 'bold', color: THEME.textLight, marginLeft: 20 },
  
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: THEME.textLight },
  
  forecastDay: { backgroundColor: THEME.header, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: THEME.border, minWidth: 70 },
  fcDayName: { fontSize: 12, fontWeight: 'bold', color: THEME.textLight, marginBottom: 2 },
  fcSolarDate: { fontSize: 10, color: THEME.textSub },
  fcLunarDate: { fontSize: 9, color: '#E74C3C', fontStyle: 'italic', marginTop: 2, fontWeight: 'bold' },
  fcTemp: { fontSize: 14, fontWeight: 'bold', color: THEME.accentBlue, marginBottom: 2 },
  fcMinMax: { fontSize: 9, color: THEME.textSub, fontWeight: 'bold' },

  badgeBox: { position: 'absolute', top: -6, right: -6, backgroundColor: THEME.badgeRed, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: THEME.header, zIndex: 5 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  refreshBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.card, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: THEME.border, marginBottom: 30 },
  refreshText: { color: THEME.textLight, fontWeight: 'bold', marginLeft: 8 },

  // Modal UI
  modalOverlay: { flex: 1, backgroundColor: THEME.modalBg, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: THEME.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: {width:0, height: 10}, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 15 },
  modalHeaderTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.textLight, letterSpacing: 1 },
  modalHeaderDate: { fontSize: 14, color: THEME.accentBlue, fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 5, marginTop: -5, marginRight: -5 },
  
  modalTaskCard: { backgroundColor: THEME.header, padding: 15, borderRadius: 10, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: THEME.border },
  modalTaskTimeWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  modalTaskTime: { fontSize: 12, color: THEME.textSub, fontWeight: '600' },
  modalTaskName: { fontSize: 16, color: THEME.textLight, fontWeight: '500', lineHeight: 22 },

  emptyTaskBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTaskText: { fontSize: 16, color: THEME.textLight, fontWeight: 'bold', marginTop: 15, textAlign: 'center' },
  emptyTaskSubText: { fontSize: 13, color: THEME.textSub, marginTop: 5, textAlign: 'center' }
});
