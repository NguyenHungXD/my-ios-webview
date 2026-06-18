import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Modal, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME as BASE_THEME } from '../theme';
const amlich = require('amlich');

const SPREADSHEET_ID = '1Od2c46Msy7FraALvf4YWyvRgfHxhfBHpGr0djUQdnq8';

const THEME = {
  ...BASE_THEME,
  accentBlue: '#3498DB',
  satBg: '#1B4332',
  satBorder: '#27AE60',
  sunBg: '#7F1D1D',
  sunBorder: '#E74C3C',
  badgeRed: '#E74C3C',
};

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [city, setCity] = useState('VỊ TRÍ CỦA BẠN');

  const [allTasks, setAllTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const fadeAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([...Array(5)].map(() => new Animated.Value(50))).current;
  const detailAnim = useRef(new Animated.Value(0)).current;

  const bgColors = ['rgba(52,152,219,0.06)', 'rgba(46,204,113,0.04)', 'rgba(241,196,15,0.04)', 'rgba(231,76,60,0.04)', 'rgba(155,89,182,0.04)'];

  useEffect(() => {
    Promise.all([fetchWeather(), fetchTasksFromGoogle()]);
  }, []);

  useEffect(() => {
    if (weatherData) {
      Animated.stagger(120, fadeAnims.map((anim, i) =>
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slideAnims[i], { toValue: 0, duration: 500, useNativeDriver: true })
        ])
      )).start();
    }
  }, [weatherData]);

  useEffect(() => {
    if (modalVisible) { Animated.spring(detailAnim, { toValue: 1, friction: 8, tension: 65, useNativeDriver: true }).start(); }
    else { detailAnim.setValue(0); }
  }, [modalVisible]);

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
        const dateStr = row[0], jobStr = row[1];
        if (!dateStr || !jobStr) continue;
        const fromH = row[2] ? row[2].padStart(2, '0') : '00';
        const fromM = row[3] ? row[3].padStart(2, '0') : '00';
        const toH = row[4] ? row[4].padStart(2, '0') : '00';
        const toM = row[5] ? row[5].padStart(2, '0') : '00';
        const status = row[6] ? row[6].toUpperCase() : 'WAIT';
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          const standardizedDateStr = `${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}-${parts[2]}`;
          parsedTasks.push({ id: `cloud_${i}`, dateStr: standardizedDateStr, job: jobStr, fromTime: `${fromH}:${fromM}`, toTime: `${toH}:${toM}`, timeVal: parseInt(fromH)*60+parseInt(fromM), status });
        }
      }
      const localTasksStr = await AsyncStorage.getItem('LOCAL_TASKS');
      if (localTasksStr) {
        JSON.parse(localTasksStr).forEach(t => parsedTasks.push({ id: t.id, dateStr: t.dateStr, job: t.job, fromTime: '00:00', toTime: '23:59', timeVal: 0, status: 'LOCAL' }));
      }
      setAllTasks(parsedTasks);
    } catch (err) { console.log('Lỗi tải task', err); }
  };

  const getDayName = (dateStr) => { const d = new Date(dateStr); return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]; };
  const getLunarInfo = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) { const lunar = amlich.convertSolar2Lunar(parseInt(parts[2],10), parseInt(parts[1],10), parseInt(parts[0],10), 7); return `${lunar[0]}/${lunar[1]}`; }
    } catch (e) {} return '--/--';
  };
  const isWeekend = (dateStr) => { const d = new Date(dateStr); return { isSat: d.getDay() === 6, isSun: d.getDay() === 0 }; };

  const fetchWeather = async () => {
    setIsLoading(true); setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setErrorMsg('Bạn chưa cấp quyền Vị trí.'); setIsLoading(false); return; }
      let loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      try {
        let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode && geocode.length > 0) setCity((geocode[0].subregion || geocode[0].city || geocode[0].region || 'VỊ TRÍ CỦA BẠN').toUpperCase());
      } catch (e) {}
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const response = await fetch(url);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) { setErrorMsg('Lỗi kết nối. Vui lòng kiểm tra mạng.'); }
    finally { setIsLoading(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
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
    const parts = dateStr.split('-');
    const formatDDMMYYYY = `${parts[2]}-${parts[1]}-${parts[0]}`;
    const dayTasks = allTasks.filter(t => t.dateStr === formatDDMMYYYY).sort((a, b) => a.timeVal - b.timeVal);
    setSelectedDateStr(`${parts[2]}/${parts[1]}/${parts[0]}`);
    setSelectedDayTasks(dayTasks);
    setModalVisible(true);
  };

  const getWeatherGradient = (code) => {
    if (code >= 95) return ['#2C3E50', '#1A1A2E'];
    if (code >= 50) return ['#34495E', '#2C3E50'];
    if (code >= 1 && code <= 3) return ['#2C3E50', '#1B4332'];
    return ['#1A202C', '#121214'];
  };

  if (!weatherData && !isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <LinearGradient colors={['#121214', '#1C1C20']} style={StyleSheet.absoluteFillObject} />
        <BlurView intensity={60} tint="dark" style={styles.promptBox}>
          <Ionicons name="cloud-download-outline" size={60} color={THEME.accentBlue} />
          <Text style={styles.promptTitle}>DỮ LIỆU THỜI TIẾT</Text>
          <TouchableOpacity style={styles.fetchButton} onPress={fetchWeather}><Text style={styles.fetchButtonText}>CẬP NHẬT NGAY</Text></TouchableOpacity>
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        </BlurView>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#121214', '#1A202C']} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color={THEME.accentBlue} />
        <Text style={{ color: THEME.textSub, marginTop: 15, fontStyle: 'italic' }}>Đang kết nối vệ tinh...</Text>
      </View>
    );
  }

  const current = weatherData.current;
  const daily = weatherData.daily;
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} - ${getDayName(now.toISOString().split('T')[0])}, ${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;

  const renderForecast = () => {
    let days = [];
    for (let i = 0; i < 5; i++) {
      if (!daily.time[i]) continue;
      const dateStr = daily.time[i];
      const { isSat, isSun } = isWeekend(dateStr);
      const parts = dateStr.split('-');
      const shortDate = `${parts[2]}/${parts[1]}`;
      const matchFormat = `${parts[2]}-${parts[1]}-${parts[0]}`;
      const dayTasks = allTasks.filter(t => t.dateStr === matchFormat);
      const taskCount = dayTasks.length;
      const isWeekendDay = isSat || isSun;
      days.push(
        <Animated.View key={i} style={{ opacity: fadeAnims[i], transform: [{ translateY: slideAnims[i] }] }}>
          <TouchableOpacity style={[styles.fcCard, isSat && styles.fcSat, isSun && styles.fcSun]} onPress={() => handleDayPress(dateStr)} activeOpacity={0.8}>
            <LinearGradient colors={bgColors[i]} style={StyleSheet.absoluteFillObject} borderRadius={16} />
            {isSat && <LinearGradient colors={['rgba(39,174,96,0.15)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={16} />}
            {isSun && <LinearGradient colors={['rgba(231,76,60,0.12)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={16} />}
            {taskCount > 0 && (
              <View style={styles.fcBadge}>
                <Text style={styles.fcBadgeText}>{taskCount > 9 ? '9+' : taskCount}</Text>
              </View>
            )}
            <View style={[styles.fcDayDot, { backgroundColor: isSat ? THEME.satBorder : isSun ? THEME.sunBorder : THEME.accentBlue }]} />
            <Text style={[styles.fcDayName, isWeekendDay && { color: isSat ? THEME.satBorder : THEME.sunBorder }]}>{getDayName(dateStr)}</Text>
            <Text style={styles.fcSolarDate}>{shortDate}</Text>
            <View style={styles.fcIconWrap}>
              <Ionicons name={getIcon(daily.weather_code[i])} size={22} color={THEME.accentBlue} />
            </View>
            <Text style={styles.fcTemp}>{Math.round(daily.temperature_2m_max[i])}°</Text>
            <Text style={styles.fcMinMax}>{Math.round(daily.temperature_2m_min[i])}°/{Math.round(daily.temperature_2m_max[i])}°</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }
    return days;
  };

  const renderModalTasks = () => {
    if (selectedDayTasks.length === 0) {
      return (
        <View style={styles.emptyTaskBox}>
          <Ionicons name="cafe-outline" size={50} color={THEME.textSub} />
          <Text style={styles.emptyTaskText}>Bạn có một ngày thảnh thơi!</Text>
          <Text style={styles.emptyTaskSubText}>Không có lịch trình nào được xếp.</Text>
        </View>
      );
    }
    return selectedDayTasks.map((t, idx) => {
      const colors = { MISSED: THEME.accentRed, DONE: '#2ECC71', LOCAL: THEME.accentBlue };
      const statusColor = colors[t.status] || THEME.accentYellow;
      return (
        <View key={idx} style={[styles.modalTaskCard, { borderLeftColor: statusColor }]}>
          <View style={styles.modalTaskTimeWrap}>
            <Ionicons name="time-outline" size={12} color={THEME.textSub} style={{ marginRight: 4 }} />
            <Text style={styles.modalTaskTime}>{t.fromTime} - {t.toTime}</Text>
            <View style={[styles.modalTaskStatus, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.modalTaskStatusText, { color: statusColor }]}>{t.status}</Text>
            </View>
          </View>
          <Text style={styles.modalTaskName}>{t.job}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#121214', '#1A202C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 150 }}>
        {/* ─── Current Weather Card ─── */}
        <LinearGradient colors={getWeatherGradient(current.weather_code)} style={styles.mainCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.mainCardContent}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={THEME.accentGreen} />
              <Text style={styles.location}>{city}</Text>
            </View>
            <Text style={styles.currentTime}>{timeStr}</Text>
            <View style={styles.mainInfo}>
              <View style={styles.mainIconBox}>
                <LinearGradient colors={['rgba(241,196,15,0.2)', 'rgba(241,196,15,0.05)']} style={StyleSheet.absoluteFillObject} borderRadius={40} />
                <Ionicons name={getIcon(current.weather_code)} size={48} color="#F1C40F" />
              </View>
              <View style={{ marginLeft: 20 }}>
                <Text style={styles.temp}>{Math.round(current.temperature_2m)}°</Text>
                <Text style={styles.desc}>{getDesc(current.weather_code)}</Text>
              </View>
            </View>
            <View style={styles.dividerLight} />
            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Ionicons name="thermometer-outline" size={14} color={THEME.textSub} />
                <Text style={styles.detailLabel}>Thấp nhất</Text>
                <Text style={styles.detailValue}>{Math.round(daily.temperature_2m_min[0])}°C</Text>
              </View>
              <View style={styles.detailCard}>
                <Ionicons name="flame-outline" size={14} color={THEME.textSub} />
                <Text style={styles.detailLabel}>Cao nhất</Text>
                <Text style={styles.detailValue}>{Math.round(daily.temperature_2m_max[0])}°C</Text>
              </View>
              <View style={styles.detailCard}>
                <Ionicons name="leaf-outline" size={14} color={THEME.textSub} />
                <Text style={styles.detailLabel}>Gió</Text>
                <Text style={styles.detailValue}>{current.wind_speed_10m} km/h</Text>
              </View>
              <View style={styles.detailCard}>
                <Ionicons name="water-outline" size={14} color={THEME.textSub} />
                <Text style={styles.detailLabel}>Độ ẩm</Text>
                <Text style={styles.detailValue}>{current.relative_humidity_2m}%</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ─── 5-Day Forecast ─── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={16} color={THEME.accentBlue} />
            <Text style={styles.sectionTitle}>DỰ BÁO 5 NGÀY TỚI</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {renderForecast()}
            </View>
          </ScrollView>
        </View>

        {/* ─── Refresh Button ─── */}
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchWeather}>
          <BlurView intensity={40} tint="dark" style={styles.refreshBlur}>
            <Ionicons name="refresh" size={18} color={THEME.textLight} />
            <Text style={styles.refreshText}>Cập nhật</Text>
          </BlurView>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Tasks Modal ─── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <BlurView intensity={85} tint="dark" style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: detailAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }], opacity: detailAnim }]}>
            <LinearGradient colors={['rgba(52,152,219,0.06)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={20} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>CÔNG VIỆC</Text>
                <Text style={styles.modalHeaderDate}>{selectedDateStr}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <BlurView intensity={40} tint="dark" style={styles.closeBtnBlur}>
                  <Ionicons name="close" size={18} color={THEME.textLight} />
                </BlurView>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {renderModalTasks()}
            </ScrollView>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // ─── Prompt ───
  promptBox: { margin: 20, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  promptTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.textLight, marginTop: 15, marginBottom: 20 },
  fetchButton: { backgroundColor: THEME.accentBlue, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  fetchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  errorText: { color: '#E74C3C', marginTop: 15 },

  // ─── Main Card ───
  mainCard: { borderRadius: 24, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  mainCardContent: { padding: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  location: { fontSize: 18, fontWeight: 'bold', color: THEME.textLight, textAlign: 'center' },
  currentTime: { fontSize: 11, color: THEME.textSub, textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
  dividerLight: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 15 },

  mainInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
  mainIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(241,196,15,0.2)' },
  temp: { fontSize: 52, fontWeight: '200', color: THEME.textLight, includeFontPadding: false, lineHeight: 60, letterSpacing: -2 },
  desc: { fontSize: 14, fontWeight: '600', color: THEME.accentBlue, marginTop: -2 },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailCard: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  detailLabel: { fontSize: 11, color: THEME.textSub, flex: 1 },
  detailValue: { fontSize: 15, fontWeight: 'bold', color: THEME.textLight },

  // ─── Section Card ───
  sectionCard: { backgroundColor: THEME.card, borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: THEME.textLight, letterSpacing: 0.5 },

  // ─── Forecast Cards ───
  fcCard: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1, borderColor: THEME.border, minWidth: 72, overflow: 'hidden' },
  fcSat: { borderColor: THEME.satBorder, borderWidth: 1.5 },
  fcSun: { borderColor: THEME.sunBorder, borderWidth: 1.5 },
  fcDayDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 6 },
  fcDayName: { fontSize: 12, fontWeight: 'bold', color: THEME.textLight, marginBottom: 2 },
  fcSolarDate: { fontSize: 10, color: THEME.textSub },
  fcIconWrap: { marginVertical: 6 },
  fcTemp: { fontSize: 16, fontWeight: 'bold', color: THEME.accentBlue, marginBottom: 2 },
  fcMinMax: { fontSize: 9, color: THEME.textSub, fontWeight: '600' },

  fcBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: THEME.badgeRed, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: THEME.card, zIndex: 5 },
  fcBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  // ─── Refresh ───
  refreshBtn: { marginBottom: 30, borderRadius: 14, overflow: 'hidden' },
  refreshBlur: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(28,28,32,0.6)', borderWidth: 1, borderColor: THEME.border, gap: 8 },
  refreshText: { color: THEME.textLight, fontWeight: 'bold', fontSize: 13 },

  // ─── Modal ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,12,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: 'rgba(28,28,32,0.95)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 15, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 15 },
  modalHeaderTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.textLight, letterSpacing: 1 },
  modalHeaderDate: { fontSize: 14, color: THEME.accentBlue, fontWeight: '600', marginTop: 2 },
  closeBtn: { marginTop: -5, marginRight: -5 },
  closeBtnBlur: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },

  modalTaskCard: { backgroundColor: 'rgba(20,20,24,0.6)', padding: 14, borderRadius: 12, marginBottom: 10, borderLeftWidth: 3, borderWidth: 1, borderColor: THEME.border },
  modalTaskTimeWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  modalTaskTime: { fontSize: 12, color: THEME.textSub, fontWeight: '600' },
  modalTaskStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  modalTaskStatusText: { fontSize: 9, fontWeight: 'bold' },
  modalTaskName: { fontSize: 15, color: THEME.textLight, fontWeight: '500', lineHeight: 22 },

  emptyTaskBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTaskText: { fontSize: 16, color: THEME.textLight, fontWeight: 'bold', marginTop: 15, textAlign: 'center' },
  emptyTaskSubText: { fontSize: 13, color: THEME.textSub, marginTop: 5, textAlign: 'center' }
});
