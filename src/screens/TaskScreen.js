import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPREADSHEET_ID = '1Od2c46Msy7FraALvf4YWyvRgfHxhfBHpGr0djUQdnq8';

const THEME = {
  bg: '#2C333A',
  card: '#3B4453',
  header: '#1A202C',
  border: '#4A5568',
  textLight: '#E2E8F0',
  textSub: '#A0AEC0',
  accentBlue: '#3498DB',
  accentRed: '#E74C3C',
  accentGreen: '#2ECC71',
  accentYellow: '#F1C40F',
  todayBg: '#FF5722'
};

export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form thêm
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
      // Dùng endpoint tải CSV trực tiếp để bỏ qua giới hạn API Key/CORS
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
              id: `cloud_${i}`, 
              date: taskDate, 
              dateStr, 
              job: jobStr,
              fromTime: `${fromH}:${fromM}`,
              toTime: `${toH}:${toM}`,
              timeVal,
              status
            });
          }
        }
      }

      // Nạp thêm task từ LocalStorage
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

      // Sắp xếp tăng dần theo ngày
      parsedTasks.sort((a, b) => a.date - b.date);

      // Nhóm theo ngày và sắp xếp thời gian bên trong
      const grouped = [];
      parsedTasks.forEach(t => {
        let group = grouped.find(g => g.dateStr === t.dateStr);
        if (!group) {
          group = { dateStr: t.dateStr, dateObj: t.date, tasks: [] };
          grouped.push(group);
        }
        group.tasks.push(t);
      });

      grouped.forEach(g => {
        g.tasks.sort((a, b) => a.timeVal - b.timeVal);
      });

      setTasks(grouped);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch(err) {
      setErrorMsg('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocal = async () => {
    if (!newTaskDate || !newTaskName) {
      Alert.alert('Lỗi', 'Vui lòng nhập ngày và tên công việc.');
      return;
    }

    const parts = newTaskDate.split(/[-/]/);
    if (parts.length !== 3) {
      Alert.alert('Lỗi', 'Ngày phải có định dạng DD-MM-YYYY');
      return;
    }

    const taskDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
    
    const newTask = {
      id: `local_${Date.now()}`,
      timestamp: taskDate.getTime(),
      dateStr: newTaskDate,
      job: newTaskName
    };

    try {
      const existingStr = await AsyncStorage.getItem('LOCAL_TASKS');
      let existing = existingStr ? JSON.parse(existingStr) : [];
      existing.push(newTask);
      await AsyncStorage.setItem('LOCAL_TASKS', JSON.stringify(existing));
      
      setNewTaskName('');
      setShowAddForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchTasks();
    } catch(e) {
      Alert.alert('Lỗi', 'Không thể lưu công việc.');
    }
  };

  const clearLocalTasks = async () => {
    await AsyncStorage.removeItem('LOCAL_TASKS');
    fetchTasks();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

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

  const renderItem = ({ item }) => {
    const isToday = item.dateObj.toDateString() === new Date().toDateString();
    
    return (
      <View style={styles.groupContainer}>
        {/* Header Ngày */}
        <View style={styles.dateHeaderWrap}>
          <View style={[styles.dateBadge, isToday && {backgroundColor: THEME.todayBg, borderColor: THEME.todayBg}]}>
            <Text style={[styles.dateBadgeText, isToday && {color: '#fff'}]}>
              {isToday ? 'HÔM NAY' : item.dateStr}
            </Text>
          </View>
          <View style={styles.headerLine} />
        </View>

        {/* Danh sách Timeline */}
        <View style={styles.timelineContainer}>
          {item.tasks.map((t, index) => {
            const statusColor = getStatusColor(t.status);
            const isLast = index === item.tasks.length - 1;

            return (
              <View key={t.id} style={styles.timelineRow}>
                {/* Trục dọc */}
                <View style={styles.timelineAxis}>
                  <View style={[styles.timelineDot, {backgroundColor: statusColor}]} />
                  {!isLast && <View style={[styles.timelineLine, {backgroundColor: THEME.border}]} />}
                </View>

                {/* Thẻ Công Việc */}
                <View style={[styles.taskCard, { borderLeftColor: statusColor }]}>
                  <View style={styles.taskCardHeader}>
                    <View style={styles.timeWrap}>
                      <Ionicons name="alarm-outline" size={14} color={THEME.textSub} style={{marginRight: 4}}/>
                      <Text style={styles.timeText}>{t.fromTime} - {t.toTime}</Text>
                    </View>
                    <View style={[styles.statusBadge, {backgroundColor: statusColor + '20'}]}>
                      <Ionicons name={getStatusIcon(t.status)} size={12} color={statusColor} style={{marginRight: 4}}/>
                      <Text style={[styles.statusText, {color: statusColor}]}>{t.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.taskName}>{t.job}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.headerBox}>
        <Ionicons name="clipboard-outline" size={24} color={THEME.textLight} />
        <Text style={styles.headerTitle}> LỊCH TRÌNH 7 NGÀY</Text>
        <View style={{flex: 1}}/>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAddForm(!showAddForm)}>
          <Ionicons name={showAddForm ? "close" : "add"} size={22} color={THEME.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, {marginLeft: 10}]} onPress={fetchTasks}>
          <Ionicons name="sync" size={22} color={THEME.textLight} />
        </TouchableOpacity>
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
          contentContainerStyle={{padding: 20, paddingBottom: 60}}
          ListEmptyComponent={<Text style={styles.emptyText}>✨ Không có công việc nào trong 7 ngày tới.</Text>}
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
  headerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.header, padding: 15, borderBottomWidth: 1, borderColor: THEME.border, zIndex: 10 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.textLight },
  iconBtn: { backgroundColor: THEME.card, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: THEME.border },
  
  groupContainer: { marginBottom: 25 },
  
  dateHeaderWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dateBadge: { backgroundColor: THEME.header, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: THEME.border, zIndex: 2 },
  dateBadgeText: { fontSize: 13, fontWeight: 'bold', color: THEME.textSub },
  headerLine: { flex: 1, height: 1, backgroundColor: THEME.border, marginLeft: -10, zIndex: 1 },

  timelineContainer: { paddingLeft: 10 },
  timelineRow: { flexDirection: 'row' },
  timelineAxis: { width: 30, alignItems: 'center', marginRight: 10 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 15, borderWidth: 2, borderColor: THEME.bg },
  timelineLine: { width: 2, flex: 1, marginTop: 5, marginBottom: -10 }, // Kéo dài qua thẻ tiếp theo

  taskCard: { flex: 1, backgroundColor: THEME.card, borderRadius: 10, padding: 15, marginBottom: 15, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  
  timeWrap: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 13, color: THEME.textSub, fontWeight: '600' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  taskName: { fontSize: 16, color: THEME.textLight, lineHeight: 22, fontWeight: '500' },

  addBox: { backgroundColor: THEME.header, padding: 20, borderBottomWidth: 1, borderColor: THEME.border },
  addTitle: { color: THEME.textLight, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: THEME.bg, color: THEME.textLight, padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: THEME.border },
  submitBtn: { backgroundColor: THEME.accentBlue, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  errorText: { color: THEME.accentRed, padding: 15, textAlign: 'center' },
  emptyText: { color: THEME.textSub, textAlign: 'center', marginTop: 80, fontStyle: 'italic' },
  
  clearBtn: { position: 'absolute', bottom: 10, alignSelf: 'center', opacity: 0.5 }
});
