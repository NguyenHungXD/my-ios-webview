import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Modal, Platform, Animated, RefreshControl, AppState, Share, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME as BASE_THEME } from '../theme';
const amlich = require('amlich');

const { width: SCREEN_W } = Dimensions.get('window');
const SPREADSHEET_ID = '1Od2c46Msy7FraALvf4YWyvRgfHxhfBHpGr0djUQdnq8';

const THEME = { ...BASE_THEME, accentBlue: '#3498DB', satBg: '#1B4332', satBorder: '#27AE60', sunBg: '#7F1D1D', sunBorder: '#E74C3C', badgeRed: '#E74C3C' };

const WMO_ICONS = { sunny: 'sunny', cloudy: 'partly-sunny', overcast: 'cloudy', rainy: 'rainy', snowy: 'snow', thunder: 'thunderstorm' };
const WMO_DESC = {
  0: { icon: 'sunny', desc: 'Quang đãng' }, 1: { icon: 'partly-sunny', desc: 'Ít mây' }, 2: { icon: 'cloudy', desc: 'Nhiều mây' }, 3: { icon: 'cloudy', desc: 'Âm u' },
  45: { icon: 'cloudy', desc: 'Sương mù' }, 48: { icon: 'cloudy', desc: 'Sương đóng băng' },
  51: { icon: 'rainy', desc: 'Mưa nhỏ' }, 53: { icon: 'rainy', desc: 'Mưa vừa' }, 55: { icon: 'rainy', desc: 'Mưa to' },
  56: { icon: 'rainy', desc: 'Mưa đá nhỏ' }, 57: { icon: 'rainy', desc: 'Mưa đá to' },
  61: { icon: 'rainy', desc: 'Mưa rào nhỏ' }, 63: { icon: 'rainy', desc: 'Mưa rào vừa' }, 65: { icon: 'rainy', desc: 'Mưa rào to' },
  66: { icon: 'rainy', desc: 'Mưa đá rải rác' }, 67: { icon: 'rainy', desc: 'Mưa đá dày' },
  71: { icon: 'snow', desc: 'Tuyết rơi nhẹ' }, 73: { icon: 'snow', desc: 'Tuyết vừa' }, 75: { icon: 'snow', desc: 'Tuyết dày' },
  80: { icon: 'rainy', desc: 'Mưa rào' }, 81: { icon: 'rainy', desc: 'Mưa rào nặng hạt' }, 82: { icon: 'rainy', desc: 'Mưa rào rất to' },
  95: { icon: 'thunderstorm', desc: 'Giông bão' }, 96: { icon: 'thunderstorm', desc: 'Giông kèm mưa đá' }, 99: { icon: 'thunderstorm', desc: 'Giông lớn' },
};
const getWMO = (code) => WMO_DESC[code] || { icon: 'sunny', desc: 'Không xác định' };
const getWindDir = (deg) => {
  const dirs = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
  return dirs[Math.round(deg / 45) % 8];
};

const getMoonPhase = (date) => {
  let y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  if (m <= 2) { y--; m += 12; }
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d - 1524.5 + 7 / 24;
  const phase = ((jd - 2451550.1) / 29.53058867) % 1;
  if (phase < 0.125) return { name: 'Trăng mới', icon: 'moon-outline' };
  if (phase < 0.25) return { name: 'Trăng lưỡi liềm', icon: 'moon-outline' };
  if (phase < 0.375) return { name: 'Trăng bán nguyệt', icon: 'moon-outline' };
  if (phase < 0.5) return { name: 'Trăng khuyết', icon: 'moon-outline' };
  if (phase < 0.625) return { name: 'Trăng tròn', icon: 'moon-full-outline' };
  if (phase < 0.75) return { name: 'Trăng khuyết', icon: 'moon-outline' };
  if (phase < 0.875) return { name: 'Trăng bán nguyệt', icon: 'moon-outline' };
  return { name: 'Trăng lưỡi liềm', icon: 'moon-outline' };
};

const formatTime = (isoStr) => {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
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
  const [hourlyData, setHourlyData] = useState([]);
  const [currentHourIdx, setCurrentHourIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([...Array(5)].map(() => new Animated.Value(50))).current;
  const detailAnim = useRef(new Animated.Value(0)).current;
  const alertPulse = useRef(new Animated.Value(1)).current;
  const lastFetch = useRef(0);
  const appState = useRef(AppState.currentState);
  const scrollY = useRef(new Animated.Value(0)).current;
  const bgColors = ['rgba(52,152,219,0.07)', 'rgba(46,204,113,0.05)', 'rgba(241,196,15,0.05)', 'rgba(231,76,60,0.05)', 'rgba(155,89,182,0.05)'];

  useEffect(() => { Promise.all([fetchWeather(), fetchTasksFromGoogle()]); }, []);

  useEffect(() => {
    if (weatherData) {
      Animated.stagger(120, fadeAnims.map((anim, i) => Animated.parallel([
        Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnims[i], { toValue: 0, duration: 500, useNativeDriver: true })
      ]))).start();
    }
  }, [weatherData]);

  useEffect(() => {
    if (modalVisible) Animated.spring(detailAnim, { toValue: 1, friction: 8, tension: 65, useNativeDriver: true }).start();
    else detailAnim.setValue(0);
  }, [modalVisible]);

  useEffect(() => {
    if (weatherData?.current?.weather_code >= 95) {
      Animated.loop(Animated.sequence([
        Animated.timing(alertPulse, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
        Animated.timing(alertPulse, { toValue: 1, duration: 1200, useNativeDriver: true })
      ])).start();
    }
  }, [weatherData]);

  // AppState auto-refresh
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const elapsed = Date.now() - lastFetch.current;
        if (elapsed > 300000) fetchWeather();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
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
        const dateStr = row[0], jobStr = row[1];
        if (!dateStr || !jobStr) continue;
        const fromH = (row[2] || '').padStart(2, '0'), fromM = (row[3] || '').padStart(2, '0');
        const toH = (row[4] || '').padStart(2, '0'), toM = (row[5] || '').padStart(2, '0');
        const status = (row[6] || '').toUpperCase() || 'WAIT';
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          const std = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
          parsedTasks.push({ id: `cloud_${i}`, dateStr: std, job: jobStr, fromTime: `${fromH}:${fromM}`, toTime: `${toH}:${toM}`, timeVal: parseInt(fromH) * 60 + parseInt(fromM), status });
        }
      }
      const localStr = await AsyncStorage.getItem('LOCAL_TASKS');
      if (localStr) JSON.parse(localStr).forEach(t => parsedTasks.push({ id: t.id, dateStr: t.dateStr, job: t.job, fromTime: '00:00', toTime: '23:59', timeVal: 0, status: 'LOCAL' }));
      setAllTasks(parsedTasks);
    } catch (err) { console.log('Lỗi tải task', err); }
  };

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
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,pressure_msl,dew_point_2m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max,wind_speed_10m_max,wind_direction_10m_dominant&timezone=auto&forecast_days=5`;
      const response = await fetch(url);
      const data = await response.json();
      setWeatherData(data);
      // Parse hourly
      if (data.hourly?.time) {
        const now = new Date();
        const currentISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:00`;
        const idx = data.hourly.time.findIndex(t => t >= currentISO);
        const sidx = idx >= 0 ? idx : 0;
        setCurrentHourIdx(sidx);
        const next24 = [];
        for (let i = 0; i < 24; i++) {
          const hIdx = sidx + i;
          if (hIdx < data.hourly.time.length) {
            next24.push({ time: data.hourly.time[hIdx], temp: data.hourly.temperature_2m[hIdx], precip: data.hourly.precipitation_probability[hIdx], code: data.hourly.weather_code[hIdx], wind: data.hourly.wind_speed_10m[hIdx], uv: data.hourly.uv_index[hIdx] });
          }
        }
        setHourlyData(next24);
      }
      lastFetch.current = Date.now();
    } catch (error) { setErrorMsg('Lỗi kết nối. Vui lòng kiểm tra mạng.'); }
    finally { setIsLoading(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWeather(), fetchTasksFromGoogle()]);
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!weatherData) return;
    const c = weatherData.current;
    const w = getWMO(c.weather_code);
    try { await Share.share({ message: `🌤 Thời tiết ${city}\n🌡 ${Math.round(c.temperature_2m)}°C (cảm giác ${Math.round(c.apparent_temperature)}°C)\n💧 Độ ẩm: ${c.relative_humidity_2m}%\n💨 Gió: ${c.wind_speed_10m} km/h\n${w.desc}\n— Ứng dụng Lịch Vạn Niên Pro` }); } catch {}
  };

  const getDayName = (dateStr) => { const d = new Date(dateStr); return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]; };
  const getLunarInfo = (dateStr) => {
    try { const p = dateStr.split('-'); if (p.length === 3) { const l = amlich.convertSolar2Lunar(parseInt(p[2],10), parseInt(p[1],10), parseInt(p[0],10), 7); return `${l[0]}/${l[1]}`; } } catch (e) {} return '--/--';
  };
  const isWeekend = (dateStr) => { const d = new Date(dateStr); return { isSat: d.getDay() === 6, isSun: d.getDay() === 0 }; };

  const handleDayPress = (dateStr) => {
    Haptics.selectionAsync();
    const parts = dateStr.split('-');
    const fmt = `${parts[2]}-${parts[1]}-${parts[0]}`;
    setSelectedDateStr(`${parts[2]}/${parts[1]}/${parts[0]}`);
    setSelectedDayTasks(allTasks.filter(t => t.dateStr === fmt).sort((a, b) => a.timeVal - b.timeVal));
    setModalVisible(true);
  };

  // ─── Weather background gradient by condition ───
  const getWeatherGradient = (code) => {
    if (code >= 95) return ['#2C3E50', '#1A1A2E'];
    if (code >= 50) return ['#34495E', '#2C3E50'];
    if (code >= 1 && code <= 3) return ['#2C3E50', '#1B4332'];
    return ['#1A202C', '#121214'];
  };

  // ─── Loading / Initial states ───
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
  if (isLoading && !weatherData) {
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
  const mPhase = getMoonPhase(now);
  const isAlert = current.weather_code >= 95;

  // ─── Detail Grid ───
  const renderDetails = () => (
    <View style={styles.detailGrid}>
      <View style={styles.detailCard}><Ionicons name="thermometer-outline" size={14} color="#6EE7B7" /><Text style={styles.detailLabel}>Thấp nhất</Text><Text style={styles.detailVal}>{Math.round(daily.temperature_2m_min[0])}°</Text></View>
      <View style={styles.detailCard}><Ionicons name="flame-outline" size={14} color="#FCA5A5" /><Text style={styles.detailLabel}>Cao nhất</Text><Text style={styles.detailVal}>{Math.round(daily.temperature_2m_max[0])}°</Text></View>
      <View style={styles.detailCard}><Ionicons name="thermometer" size={14} color="#FDE68A" /><Text style={styles.detailLabel}>Cảm giác</Text><Text style={styles.detailVal}>{Math.round(current.apparent_temperature)}°</Text></View>
      <View style={styles.detailCard}><Ionicons name="sunny" size={14} color="#FBBF24" /><Text style={styles.detailLabel}>UV</Text><Text style={styles.detailVal}>{daily.uv_index_max?.[0]?.toFixed(1) || '--'}</Text></View>
      <View style={styles.detailCard}><Ionicons name="speedometer-outline" size={14} color="#93C5FD" /><Text style={styles.detailLabel}>Áp suất</Text><Text style={[styles.detailVal, { fontSize: 12 }]}>{current.pressure_msl ? Math.round(current.pressure_msl) + ' hPa' : '--'}</Text></View>
      <View style={styles.detailCard}><Ionicons name="eye-outline" size={14} color="#A7F3D0" /><Text style={styles.detailLabel}>Tầm nhìn</Text><Text style={styles.detailVal}>{current.visibility ? (current.visibility / 1000).toFixed(1) + 'km' : '--'}</Text></View>
      <View style={styles.detailCard}><Ionicons name="water-outline" size={14} color="#67E8F9" /><Text style={styles.detailLabel}>Sương</Text><Text style={styles.detailVal}>{current.dew_point_2m ? Math.round(current.dew_point_2m) + '°' : '--'}</Text></View>
      <View style={styles.detailCard}><Ionicons name="wind" size={14} color="#BFDBFE" /><Text style={styles.detailLabel}>Gió giật</Text><Text style={styles.detailVal}>{current.wind_gusts_10m ? Math.round(current.wind_gusts_10m) + '' : '--'}</Text></View>
    </View>
  );

  // ─── Wind Compass ───
  const renderWindCompass = () => {
    const deg = daily.wind_direction_10m_dominant?.[0];
    if (deg == null) return null;
    return (
      <View style={styles.compassCard}>
        <Text style={styles.compassTitle}>Hướng gió</Text>
        <View style={styles.compassBody}>
          <View style={styles.compassCircle}>
            <View style={[styles.compassArrow, { transform: [{ rotate: `${deg}deg` }] }]}>
              <Ionicons name="arrow-up" size={20} color={THEME.accentBlue} />
            </View>
          </View>
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.compassDir}>{getWindDir(deg)}</Text>
            <Text style={styles.compassDeg}>{Math.round(deg)}°</Text>
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: THEME.textSub }}>Gió: {daily.wind_speed_10m_max?.[0] || current.wind_speed_10m} km/h</Text>
              {current.wind_gusts_10m > 0 && <Text style={{ fontSize: 12, color: THEME.accentRed }}>(giật {Math.round(current.wind_gusts_10m)})</Text>}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ─── Sun/Moon ───
  const renderSunMoon = () => (
    <View style={styles.sunMoonCard}>
      <View style={styles.sunMoonRow}>
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="sunny-outline" size={18} color="#FBBF24" />
          <Text style={styles.sunMoonTime}>{formatTime(daily.sunrise?.[0])}</Text>
          <Text style={styles.sunMoonLabel}>Mọc</Text>
        </View>
        <View style={styles.sunArc}>
          <LinearGradient colors={['#FBBF24', '#FDE68A', '#374151']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} borderRadius={4} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="sunny-outline" size={18} color="#FCA5A5" />
          <Text style={styles.sunMoonTime}>{formatTime(daily.sunset?.[0])}</Text>
          <Text style={styles.sunMoonLabel}>Lặn</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, gap: 6 }}>
        <Ionicons name={mPhase.icon} size={16} color={THEME.accentGold} />
        <Text style={{ fontSize: 13, color: THEME.accentGold, fontWeight: '600' }}>{mPhase.name}</Text>
      </View>
    </View>
  );

  // ─── Hourly Forecast ───
  const renderHourly = () => {
    if (!hourlyData.length) return null;
    const temps = hourlyData.map(h => h.temp).filter(t => t != null);
    const minT = Math.min(...temps), maxT = Math.max(...temps);
    const range = maxT - minT || 1;
    const barMaxH = 80;
    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="time-outline" size={16} color={THEME.accentBlue} />
          <Text style={styles.sectionTitle}>DỰ BÁO THEO GIỜ</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 4 }}>
            {hourlyData.map((h, i) => {
              const t = h.temp != null ? h.temp : 0;
              const barH = ((t - minT) / range) * barMaxH + 6;
              const hDate = new Date(h.time);
              const hourStr = `${hDate.getHours().toString().padStart(2, '0')}:00`;
              const isCurrent = i === 0;
              const wmo = getWMO(h.code);
              return (
                <View key={i} style={[styles.hBarWrap, isCurrent && styles.hBarCurrent]}>
                  <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <View style={[styles.hBar, { height: barH, backgroundColor: isCurrent ? THEME.accentGold : THEME.accentBlue }]} />
                  </View>
                  {h.precip != null && h.precip > 0 && (
                    <View style={{ height: 18, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 8, color: '#67E8F9', textAlign: 'center' }}>{h.precip}%</Text>
                    </View>
                  )}
                  <Ionicons name={wmo.icon} size={14} color={THEME.textSub} style={{ marginVertical: 2 }} />
                  <Text style={[styles.hTemp, isCurrent && { color: THEME.accentGold, fontWeight: 'bold' }]}>{Math.round(t)}°</Text>
                  <Text style={styles.hTime}>{isCurrent ? 'Hiện' : hourStr.slice(0, 5)}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  // ─── 5-day Forecast ───
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
      const wmo = getWMO(daily.weather_code[i]);
      days.push(
        <Animated.View key={i} style={{ opacity: fadeAnims[i], transform: [{ translateY: slideAnims[i] }] }}>
          <TouchableOpacity style={[styles.fcCard, isSat && styles.fcSat, isSun && styles.fcSun]} onPress={() => handleDayPress(dateStr)} activeOpacity={0.8}>
            <LinearGradient colors={bgColors[i]} style={StyleSheet.absoluteFillObject} borderRadius={16} />
            {isSat && <LinearGradient colors={['rgba(39,174,96,0.15)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={16} />}
            {isSun && <LinearGradient colors={['rgba(231,76,60,0.12)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={16} />}
            {taskCount > 0 && <View style={styles.fcBadge}><Text style={styles.fcBadgeText}>{taskCount > 9 ? '9+' : taskCount}</Text></View>}
            <View style={[styles.fcDayDot, { backgroundColor: isSat ? THEME.satBorder : isSun ? THEME.sunBorder : THEME.accentBlue }]} />
            <Text style={[styles.fcDayName, (isSat || isSun) && { color: isSat ? THEME.satBorder : THEME.sunBorder }]}>{getDayName(dateStr)}</Text>
            <Text style={styles.fcSolarDate}>{shortDate}</Text>
            <Ionicons name={wmo.icon} size={20} color={THEME.accentBlue} style={{ marginVertical: 4 }} />
            <Text style={styles.fcTemp}>{Math.round(daily.temperature_2m_max[i])}°</Text>
            <Text style={styles.fcMinMax}>{Math.round(daily.temperature_2m_min[i])}°/{Math.round(daily.temperature_2m_max[i])}°</Text>
            {daily.precipitation_probability_max?.[i] > 0 && (
              <Text style={styles.fcPrecip}>{daily.precipitation_probability_max[i]}%</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    }
    return days;
  };

  // ─── Task Modal ───
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
      const sc = colors[t.status] || THEME.accentYellow;
      return (
        <View key={idx} style={[styles.modalTaskCard, { borderLeftColor: sc }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
            <Ionicons name="time-outline" size={12} color={THEME.textSub} />
            <Text style={{ fontSize: 12, color: THEME.textSub, fontWeight: '600' }}>{t.fromTime} - {t.toTime}</Text>
            <View style={{ backgroundColor: sc + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: sc }}>{t.status}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 15, color: THEME.textLight, fontWeight: '500', lineHeight: 22 }}>{t.job}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#121214', '#1A202C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.accentBlue} progressBackgroundColor={THEME.card} colors={[THEME.accentBlue]} />}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Alert banner */}
        {isAlert && (
          <Animated.View style={[styles.alertBanner, { opacity: alertPulse }]}>
            <Ionicons name="thunderstorm" size={18} color="#fff" />
            <Text style={styles.alertText}>Cảnh báo giông bão! Hạn chế ra ngoài.</Text>
          </Animated.View>
        )}

        {/* Main Card */}
        <LinearGradient colors={getWeatherGradient(current.weather_code)} style={styles.mainCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.mainCardContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="location" size={14} color={THEME.accentGreen} />
              <Text style={styles.location}>{city}</Text>
              <TouchableOpacity onPress={handleShare} style={{ padding: 4 }}>
                <Ionicons name="share-outline" size={16} color={THEME.textSub} />
              </TouchableOpacity>
            </View>
            <Text style={styles.currentTime}>{timeStr}</Text>
            <View style={styles.mainInfo}>
              <View style={styles.mainIconBox}>
                <LinearGradient colors={['rgba(241,196,15,0.2)', 'rgba(241,196,15,0.05)']} style={StyleSheet.absoluteFillObject} borderRadius={40} />
                <Ionicons name={getWMO(current.weather_code).icon} size={48} color="#F1C40F" />
              </View>
              <View style={{ marginLeft: 20 }}>
                <Text style={styles.temp}>{Math.round(current.temperature_2m)}°</Text>
                <Text style={styles.desc}>{getWMO(current.weather_code).desc}</Text>
                <Text style={styles.feels}>Cảm giác {Math.round(current.apparent_temperature)}°</Text>
              </View>
            </View>
            <View style={styles.dividerLight} />
            {renderDetails()}
          </View>
        </LinearGradient>

        {/* Wind Compass */}
        {renderWindCompass()}

        {/* Sun/Moon */}
        {daily.sunrise?.[0] && renderSunMoon()}

        {/* Hourly */}
        {renderHourly()}

        {/* 5-day Forecast */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={16} color={THEME.accentBlue} />
            <Text style={styles.sectionTitle}>DỰ BÁO 5 NGÀY TỚI</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>{renderForecast()}</View>
          </ScrollView>
        </View>

        {/* Refresh */}
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchWeather}>
          <BlurView intensity={40} tint="dark" style={styles.refreshBlur}>
            <Ionicons name="refresh" size={18} color={THEME.textLight} />
            <Text style={styles.refreshText}>Cập nhật</Text>
          </BlurView>
        </TouchableOpacity>
      </ScrollView>

      {/* Task Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <BlurView intensity={85} tint="dark" style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: detailAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }], opacity: detailAnim }]}>
            <LinearGradient colors={['rgba(52,152,219,0.06)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={20} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 15 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: THEME.textLight, letterSpacing: 1 }}>CÔNG VIỆC</Text>
                <Text style={{ fontSize: 14, color: THEME.accentBlue, fontWeight: '600', marginTop: 2 }}>{selectedDateStr}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: -5, marginRight: -5 }}>
                <BlurView intensity={40} tint="dark" style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' }}>
                  <Ionicons name="close" size={18} color={THEME.textLight} />
                </BlurView>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>{renderModalTasks()}</ScrollView>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // Prompt
  promptBox: { margin: 20, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  promptTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.textLight, marginTop: 15, marginBottom: 20 },
  fetchButton: { backgroundColor: THEME.accentBlue, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  fetchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  errorText: { color: '#E74C3C', marginTop: 15 },

  // Alert
  alertBanner: { margin: 15, marginBottom: 0, padding: 12, borderRadius: 14, backgroundColor: 'rgba(220,38,38,0.85)', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  alertText: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },

  // Main
  mainCard: { borderRadius: 24, margin: 15, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  mainCardContent: { padding: 20 },
  location: { fontSize: 18, fontWeight: 'bold', color: THEME.textLight, textAlign: 'center' },
  currentTime: { fontSize: 11, color: THEME.textSub, textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
  dividerLight: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 12 },
  mainInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  mainIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(241,196,15,0.2)' },
  temp: { fontSize: 52, fontWeight: '200', color: THEME.textLight, includeFontPadding: false, lineHeight: 60, letterSpacing: -2 },
  desc: { fontSize: 14, fontWeight: '600', color: THEME.accentBlue, marginTop: -2 },
  feels: { fontSize: 13, color: '#FDE68A', fontWeight: '500', marginTop: 2 },

  // Detail Grid
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  detailCard: { width: '23%', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 8, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  detailLabel: { fontSize: 9, color: THEME.textSub, textAlign: 'center' },
  detailVal: { fontSize: 14, fontWeight: 'bold', color: THEME.textLight, textAlign: 'center' },

  // Wind Compass
  compassCard: { marginHorizontal: 15, marginBottom: 12, backgroundColor: THEME.card, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: THEME.border },
  compassTitle: { fontSize: 12, fontWeight: '700', color: THEME.textSub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  compassBody: { flexDirection: 'row', alignItems: 'center' },
  compassCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: THEME.border },
  compassArrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  compassDir: { fontSize: 18, fontWeight: 'bold', color: THEME.textLight },
  compassDeg: { fontSize: 13, color: THEME.textSub },

  // Sun/Moon
  sunMoonCard: { marginHorizontal: 15, marginBottom: 12, backgroundColor: THEME.card, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: THEME.border },
  sunMoonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  sunMoonTime: { fontSize: 15, fontWeight: 'bold', color: THEME.textLight, marginTop: 4 },
  sunMoonLabel: { fontSize: 10, color: THEME.textSub, marginTop: 1 },
  sunArc: { flex: 1, height: 6, borderRadius: 4, marginHorizontal: 15, overflow: 'hidden' },

  // Section
  sectionCard: { marginHorizontal: 15, marginBottom: 12, backgroundColor: THEME.card, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: THEME.textLight, letterSpacing: 0.5 },

  // Hourly
  hBarWrap: { width: 38, alignItems: 'center', paddingTop: 6 },
  hBarCurrent: { backgroundColor: 'rgba(212,175,55,0.08)', borderRadius: 8, marginTop: -6, paddingTop: 6 },
  hBar: { width: 6, borderRadius: 3, minHeight: 4 },
  hTemp: { fontSize: 11, fontWeight: '600', color: THEME.textLight, marginTop: 1 },
  hTime: { fontSize: 9, color: THEME.textSub, marginTop: 1 },

  // Forecast
  fcCard: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1, borderColor: THEME.border, minWidth: 68, overflow: 'hidden' },
  fcSat: { borderColor: THEME.satBorder, borderWidth: 1.5 },
  fcSun: { borderColor: THEME.sunBorder, borderWidth: 1.5 },
  fcDayDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 4 },
  fcDayName: { fontSize: 11, fontWeight: 'bold', color: THEME.textLight, marginBottom: 1 },
  fcSolarDate: { fontSize: 9, color: THEME.textSub },
  fcTemp: { fontSize: 15, fontWeight: 'bold', color: THEME.accentBlue, marginBottom: 1 },
  fcMinMax: { fontSize: 8, color: THEME.textSub, fontWeight: '600' },
  fcPrecip: { fontSize: 9, color: '#67E8F9', fontWeight: 'bold', marginTop: 2 },
  fcBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: THEME.badgeRed, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: THEME.card, zIndex: 5 },
  fcBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  // Refresh
  refreshBtn: { marginHorizontal: 15, marginBottom: 30, borderRadius: 14, overflow: 'hidden' },
  refreshBlur: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(28,28,32,0.6)', borderWidth: 1, borderColor: THEME.border, gap: 8 },
  refreshText: { color: THEME.textLight, fontWeight: 'bold', fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,10,12,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: 'rgba(28,28,32,0.95)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 15, overflow: 'hidden' },
  modalTaskCard: { backgroundColor: 'rgba(20,20,24,0.6)', padding: 14, borderRadius: 12, marginBottom: 10, borderLeftWidth: 3, borderWidth: 1, borderColor: THEME.border },

  emptyTaskBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTaskText: { fontSize: 16, color: THEME.textLight, fontWeight: 'bold', marginTop: 15, textAlign: 'center' },
  emptyTaskSubText: { fontSize: 13, color: THEME.textSub, marginTop: 5, textAlign: 'center' }
});
