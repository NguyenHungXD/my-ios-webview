import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPREADSHEET_ID = '1Od2c46Msy7FraALvf4YWyvRgfHxhfBHpGr0djUQdnq8';

const THEME = {
  bg: '#1A1A1D',
  card: '#2D2D34',
  header: '#121214',
  border: '#3E3E42',
  textLight: '#F5F5F5',
  textSub: '#A0A0A0',
  accentBlue: '#3498DB',
  accentRed: '#E74C3C',
  accentGreen: '#2ECC71',
  accentYellow: '#F1C40F',
  pulseColor: '#00FF00',
  todayBg: '#FF5722'
};

const AnimatedTaskItem = ({ t, index, isLast }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100, // Staggered delay
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    // Check Live status
    const checkLive = () => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentVal = currentH * 60 + currentM;

      const [fH, fM] = t.fromTime.split(':').map(Number);
      const [tH, tM] = t.toTime.split(':').map(Number);
      const startVal = fH * 60 + fM;
      const endVal = tH * 60 + tM;

      // Check if task is today
      const isToday = t.date.toDateString() === now.toDateString();

      if (isToday && currentVal >= startVal && currentVal <= endVal) {
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [t]);

  useEffect(() => {
    if (isLive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLive]);

  const getStatusColor = (status) => {
    if (status === 'MISSED') return THEME.accentRed;
    if (status === 'DONE') return THEME.accentGreen;
    if (status === 'LOCAL') return THEME.accentBlue;
    return THEME.accentYellow; // WAIT
  };

  const getStatusIcon = (status) => {
    if (status === 'MISSED') return 'close-circle';
    if (status === 'DONE') return 'checkmark-circle';
    if (status === 'LOCAL') return 'phone-portrait';
    return 'time';
  };

  const statusColor = getStatusColor(t.status);

  return (
    <Animated.View style={[styles.timelineRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Trục dọc */}
      <View style={styles.timelineAxis}>
        {isLive ? (
          <View style={styles.livePulseContainer}>
            <Animated.View style={[styles.livePulseGlow, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.livePulseCore} />
          </View>
        ) : (
          <View style={[styles.timelineDot, {backgroundColor: statusColor}]} />
        )}
        {!isLast && <View style={[styles.timelineLine, {backgroundColor: THEME.border}]} />}
      </View>

      {/* Thẻ Công Việc */}
      <View style={[styles.taskCard, { borderLeftColor: isLive ? THEME.pulseColor : statusColor }, isLive && styles.liveCard]}>
        <View style={styles.taskCardHeader}>
          <View style={styles.timeWrap}>
            <Ionicons name="alarm-outline" size={14} color={THEME.textSub} style={{marginRight: 4}}/>
            <Text style={[styles.timeText, isLive && {color: THEME.pulseColor, fontWeight: 'bold'}]}>
              {t.fromTime} - {t.toTime}
            </Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusColor + '20'}]}>
            <Ionicons name={getStatusIcon(t.status)} size={12} color={statusColor} style={{marginRight: 4}}/>
            <Text style={[styles.statusText, {color: statusColor}]}>{t.status}</Text>
          </View>
        </View>
        <Text style={styles.taskName}>{t.job}</Text>
      </View>
    </Animated.View>
  );
};


export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskName, setNewTaskName] = useState('');

  useEffect(() => {
    fetchTasks();
    const now = new Date();
    setNewTaskDate(`${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`);
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Abc`;
      const response = await fetch(url);
      const text = await response.text();

      const lines = text.split('\n');
      const parsedTasks = [];
      const today = new Date();
      today.setHours(0,0,0,0);
      const limitDate = new Date();
      limitDate.setDate(today.getDate() + 7);

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
        const timeVal = parseInt(fromH) * 60 + parseInt(fromM);
        const parts = dateStr.split(/[-/]/);

        if (parts.length === 3) {
          const taskDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
          if (taskDate >= today && taskDate <= limitDate) {
            parsedTasks.push({ 
              id: `cloud_${i}`, date: taskDate, dateStr, job: jobStr,
              fromTime: `${fromH}:${fromM}`, toTime: `${toH}:${toM}`, timeVal, status
            });
          }
        }
      }

      const localTasksStr = await AsyncStorage.getItem('LOCAL_TASKS');
      if (localTasksStr) {
        const localTasks = JSON.parse(localTasksStr);
        localTasks.forEach(t => {
          const tDate = new Date(t.timestamp);
          if (tDate >= today && tDate <= limitDate) {
            parsedTasks.push({ 
              id: t.id, date: tDate, dateStr: t.dateStr, job: t.job, 
              fromTime: '00:00', toTime: '23:59', timeVal: 0, status: 'LOCAL', isLocal: true 
            });
          }
        });
      }

      parsedTasks.sort((a, b) => a.date - b.date);

      const grouped = [];
      parsedTasks.forEach(t => {
        let group = grouped.find(g => g.dateStr === t.dateStr);
        if (!group) {
          group = { dateStr: t.dateStr, dateObj: t.date, tasks: [] };
          grouped.push(group);
        }
        group.tasks.push(t);
      });

      grouped.forEach(g => g.tasks.sort((a, b) => a.timeVal - b.timeVal));
      setTasks(grouped);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch(err) {
      setErrorMsg('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocal = async () => {
    if (!newTaskDate || !newTaskName) return Alert.alert('Lỗi', 'Vui lòng nhập ngày và tên công việc.');
    const parts = newTaskDate.split(/[-/]/);
    if (parts.length !== 3) return Alert.alert('Lỗi', 'Ngày phải có định dạng DD-MM-YYYY');
    
    const taskDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
    const newTask = { id: `local_${Date.now()}`, timestamp: taskDate.getTime(), dateStr: newTaskDate, job: newTaskName };

    try {
      const existingStr = await AsyncStorage.getItem('LOCAL_TASKS');
      let existing = existingStr ? JSON.parse(existingStr) : [];
      existing.push(newTask);
      await AsyncStorage.setItem('LOCAL_TASKS', JSON.stringify(existing));
      setNewTaskName('');
      setShowAddForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchTasks();
    } catch(e) { Alert.alert('Lỗi', 'Không thể lưu công việc.'); }
  };

  const clearLocalTasks = async () => {
    await AsyncStorage.removeItem('LOCAL_TASKS');
    fetchTasks();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const renderItem = ({ item }) => {
    const isToday = item.dateObj.toDateString() === new Date().toDateString();
    return (
      <View style={styles.groupContainer}>
        <View style={styles.dateHeaderWrap}>
          <View style={[styles.dateBadge, isToday && {backgroundColor: THEME.todayBg, borderColor: THEME.todayBg}]}>
            <Text style={[styles.dateBadgeText, isToday && {color: '#fff'}]}>{isToday ? 'HÔM NAY' : item.dateStr}</Text>
          </View>
          <View style={styles.headerLine} />
        </View>
        <View style={styles.timelineContainer}>
          {item.tasks.map((t, index) => (
            <AnimatedTaskItem key={t.id} t={t} index={index} isLast={index === item.tasks.length - 1} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      
      {/* Super Header */}
      <View style={styles.superHeader}>
        <View style={styles.headerTitleWrap}>
          <Ionicons name="layers" size={28} color={THEME.accentBlue} style={{marginRight: 10}} />
          <View>
            <Text style={styles.headerTitleMain}>NHIỆM VỤ</Text>
            <Text style={styles.headerTitleSub}>Lịch trình 7 ngày tới</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAddForm(!showAddForm)}>
            <Ionicons name={showAddForm ? "close" : "add"} size={22} color={THEME.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {marginLeft: 10}]} onPress={fetchTasks}>
            <Ionicons name="sync" size={22} color={THEME.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {showAddForm && (
        <View style={styles.addBox}>
          <Text style={styles.addTitle}>Thêm công việc Local</Text>
          <TextInput style={styles.input} placeholder="Ngày (VD: 25-04-2026)" placeholderTextColor={THEME.textSub} value={newTaskDate} onChangeText={setNewTaskDate} />
          <TextInput style={styles.input} placeholder="Tên công việc" placeholderTextColor={THEME.textSub} value={newTaskName} onChangeText={setNewTaskName} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAddLocal}>
            <Text style={styles.submitBtnText}>THÊM LÊN LỊCH</Text>
          </TouchableOpacity>
        </View>
      )}

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      {isLoading ? (
        <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" color={THEME.accentBlue}/></View>
      ) : (
        <FlatList 
          data={tasks}
          renderItem={renderItem}
          keyExtractor={i => i.dateStr}
          contentContainerStyle={{padding: 20, paddingBottom: 100}}
          ListEmptyComponent={<Text style={styles.emptyText}>✨ Bạn không có công việc nào trong 7 ngày tới.</Text>}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.clearBtn} onPress={clearLocalTasks}>
        <Text style={{color: THEME.textSub, fontSize: 10}}>Xóa dữ liệu Cục bộ</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  
  superHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: THEME.header, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 20, borderBottomWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 15, zIndex: 10 },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  headerTitleMain: { fontSize: 22, fontWeight: '900', color: THEME.textLight, letterSpacing: 1 },
  headerTitleSub: { fontSize: 12, color: THEME.textSub, marginTop: 2 },
  headerIcons: { flexDirection: 'row' },
  iconBtn: { backgroundColor: THEME.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: THEME.border },
  
  groupContainer: { marginBottom: 30 },
  dateHeaderWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dateBadge: { backgroundColor: THEME.card, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 25, borderWidth: 1, borderColor: THEME.border, zIndex: 2, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  dateBadgeText: { fontSize: 13, fontWeight: 'bold', color: THEME.textSub },
  headerLine: { flex: 1, height: 2, backgroundColor: THEME.border, marginLeft: -10, zIndex: 1, borderRadius: 1 },

  timelineContainer: { paddingLeft: 10 },
  timelineRow: { flexDirection: 'row' },
  timelineAxis: { width: 30, alignItems: 'center', marginRight: 15 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 20, borderWidth: 3, borderColor: THEME.bg, zIndex: 2 },
  timelineLine: { width: 2, flex: 1, marginTop: -5, marginBottom: -25, backgroundColor: THEME.border, zIndex: 1 }, 

  livePulseContainer: { width: 18, height: 18, marginTop: 18, justifyContent: 'center', alignItems: 'center', zIndex: 3 },
  livePulseGlow: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: THEME.pulseColor, opacity: 0.4 },
  livePulseCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: THEME.pulseColor },

  taskCard: { flex: 1, backgroundColor: THEME.card, borderRadius: 15, padding: 18, marginBottom: 20, borderLeftWidth: 5, shadowColor: '#000', shadowOffset: {width:0, height:5}, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  liveCard: { backgroundColor: 'rgba(0, 255, 0, 0.05)', borderColor: THEME.pulseColor, borderWidth: 1 },
  
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timeWrap: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 13, color: THEME.textSub, fontWeight: '600' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  taskName: { fontSize: 17, color: THEME.textLight, lineHeight: 24, fontWeight: '500' },

  addBox: { backgroundColor: THEME.header, padding: 20, borderBottomWidth: 1, borderColor: THEME.border },
  addTitle: { color: THEME.textLight, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: THEME.bg, color: THEME.textLight, padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: THEME.border },
  submitBtn: { backgroundColor: THEME.accentBlue, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  errorText: { color: THEME.accentRed, padding: 15, textAlign: 'center' },
  emptyText: { color: THEME.textSub, textAlign: 'center', marginTop: 80, fontStyle: 'italic' },
  clearBtn: { position: 'absolute', bottom: 110, alignSelf: 'center', opacity: 0.5 }
});
