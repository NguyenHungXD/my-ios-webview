import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'AIzaSyB4weed8y6JTiLcUG-8Adz2CJqC-SKMUjE';
const SPREADSHEET_ID = '1Od2c46Msy7FraALvf4YWyvRgfHxhfBHpGr0djUQdnq8';
const RANGE = 'Abc!A:B';

const THEME = {
  bg: '#2C333A',
  card: '#3B4453',
  header: '#1A202C',
  border: '#4A5568',
  textLight: '#E2E8F0',
  textSub: '#A0AEC0',
  accentBlue: '#3498DB',
  accentRed: '#E74C3C',
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

      for (let i = 1; i < lines.length; i++) { // Bỏ qua header
        if (!lines[i].trim()) continue;
        // Parse CSV đơn giản (tách dấu phẩy, bỏ dấu ngoặc kép)
        const row = lines[i].split('","').map(v => v.replace(/^"|"$/g, ''));
        
        const dateStr = row[0];
        const jobStr = row[1];
        if (!dateStr || !jobStr) continue;

        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          const taskDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
          
          if (taskDate >= today && taskDate <= limitDate) {
            parsedTasks.push({ id: `cloud_${i}`, date: taskDate, dateStr, job: jobStr });
          }
        }
      }

      // Nạp thêm task từ LocalStorage (để hỗ trợ thêm offline/không có OAuth)
      const localTasksStr = await AsyncStorage.getItem('LOCAL_TASKS');
      if (localTasksStr) {
        const localTasks = JSON.parse(localTasksStr);
        localTasks.forEach(t => {
          const tDate = new Date(t.timestamp);
          if (tDate >= today && tDate <= limitDate) {
            parsedTasks.push({ id: t.id, date: tDate, dateStr: t.dateStr, job: t.job, isLocal: true });
          }
        });
      }

      // Sắp xếp tăng dần theo ngày
      parsedTasks.sort((a, b) => a.date - b.date);

      // Nhóm theo ngày
      const grouped = [];
      parsedTasks.forEach(t => {
        let group = grouped.find(g => g.dateStr === t.dateStr);
        if (!group) {
          group = { dateStr: t.dateStr, dateObj: t.date, tasks: [] };
          grouped.push(group);
        }
        group.tasks.push(t);
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
      Alert.alert('Thành công', 'Do API Key của Sheet không hỗ trợ ghi, dữ liệu đã được lưu cục bộ trên máy của bạn!');
    } catch(e) {
      Alert.alert('Lỗi', 'Không thể lưu công việc.');
    }
  };

  const clearLocalTasks = async () => {
    await AsyncStorage.removeItem('LOCAL_TASKS');
    fetchTasks();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const renderItem = ({ item }) => {
    const isToday = item.dateObj.toDateString() === new Date().toDateString();
    
    return (
      <View style={[styles.taskGroup, isToday && {borderColor: THEME.todayBg, borderWidth: 1}]}>
        <View style={[styles.dateHeader, isToday && {backgroundColor: THEME.todayBg}]}>
          <Text style={[styles.dateText, isToday && {color: '#fff', fontWeight: 'bold'}]}>
            {isToday ? '🔥 HÔM NAY' : `📌 ${item.dateStr}`}
          </Text>
        </View>
        <View style={styles.taskList}>
          {item.tasks.map(t => (
            <View key={t.id} style={styles.taskItem}>
              <Ionicons name="ellipse" size={8} color={t.isLocal ? THEME.accentBlue : THEME.textSub} style={{marginRight: 10, marginTop: 5}}/>
              <Text style={styles.taskName}>{t.job}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.headerBox}>
        <Ionicons name="clipboard-outline" size={24} color={THEME.textLight} />
        <Text style={styles.headerTitle}> LỊCH TRÌNH 7 NGÀY TỚI</Text>
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
          <Text style={styles.addTitle}>Thêm công việc mới</Text>
          <TextInput style={styles.input} placeholder="Ngày (VD: 25-04-2026)" placeholderTextColor={THEME.border} value={newTaskDate} onChangeText={setNewTaskDate} />
          <TextInput style={styles.input} placeholder="Tên công việc" placeholderTextColor={THEME.border} value={newTaskName} onChangeText={setNewTaskName} />
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
          contentContainerStyle={{padding: 15}}
          ListEmptyComponent={<Text style={styles.emptyText}>✨ Không có công việc nào trong 7 ngày tới.</Text>}
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
  headerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.header, padding: 15, borderBottomWidth: 1, borderColor: THEME.border },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.textLight },
  iconBtn: { backgroundColor: THEME.card, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: THEME.border },
  
  taskGroup: { backgroundColor: THEME.card, borderRadius: 8, marginBottom: 15, overflow: 'hidden' },
  dateHeader: { backgroundColor: THEME.header, paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderColor: THEME.border },
  dateText: { fontSize: 14, fontWeight: '600', color: THEME.accentBlue },
  taskList: { padding: 15 },
  taskItem: { flexDirection: 'row', marginBottom: 10, paddingRight: 10 },
  taskName: { fontSize: 15, color: THEME.textLight, lineHeight: 22 },

  addBox: { backgroundColor: THEME.header, padding: 15, borderBottomWidth: 1, borderColor: THEME.border },
  addTitle: { color: THEME.textLight, fontWeight: 'bold', marginBottom: 10 },
  input: { backgroundColor: THEME.bg, color: THEME.textLight, padding: 12, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: THEME.border },
  submitBtn: { backgroundColor: THEME.accentBlue, padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: '#fff', fontWeight: 'bold' },

  errorText: { color: THEME.accentRed, padding: 15, textAlign: 'center' },
  emptyText: { color: THEME.textSub, textAlign: 'center', marginTop: 50, fontStyle: 'italic' },
  
  clearBtn: { position: 'absolute', bottom: 10, alignSelf: 'center', opacity: 0.5 }
});
