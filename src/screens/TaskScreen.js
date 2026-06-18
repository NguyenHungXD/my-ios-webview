import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Animated, LayoutAnimation, UIManager, TouchableWithoutFeedback, Modal, RefreshControl, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME as BASE_THEME } from '../theme';

const SPREADSHEET_ID = '1Od2c46Msy7FraALvf4YWyvRgfHxhfBHpGr0djUQdnq8';

const THEME = {
  ...BASE_THEME,
  pulseColor: '#00FF00',
  todayBg: '#FF5722'
};

const STATUS_CONFIG = {
  'WAIT':  { icon: 'time',        color: THEME.accentYellow, label: 'Chờ' },
  'DONE':  { icon: 'checkmark-circle', color: THEME.accentGreen,  label: 'Xong' },
  'MISSED':{ icon: 'close-circle', color: THEME.accentRed,   label: 'Trễ' },
  'LOCAL': { icon: 'phone-portrait', color: THEME.accentBlue,  label: 'Local' },
};

const AnimatedTaskItem = ({ t, index, isLast, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isLive, setIsLive] = useState(false);

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 80, useNativeDriver: true })
    ]).start();
  }, []);

  useEffect(() => {
    const checkLive = () => {
      const now = new Date();
      const cv = now.getHours() * 60 + now.getMinutes();
      const [fH, fM] = (t.fromTime || '00:00').split(':').map(Number);
      const [tH, tM] = (t.toTime || '23:59').split(':').map(Number);
      const isToday = t.date instanceof Date && t.date.toDateString() === now.toDateString();
      setIsLive(isToday && cv >= fH*60+fM && cv <= tH*60+tM);
    };
    checkLive();
    const interval = setInterval(checkLive, 60000);
    return () => clearInterval(interval);
  }, [t]);

  useEffect(() => {
    if (isLive) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])).start();
    } else pulseAnim.setValue(1);
  }, [isLive]);

  const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.WAIT;
  const isOverdue = t.status === 'WAIT' && t.date < new Date(new Date().toDateString());
  const borderColor = isLive ? THEME.pulseColor : cfg.color;

  return (
    <Animated.View style={[styles.timelineRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.timelineAxis}>
        {isLive ? (
          <View style={styles.livePulseContainer}>
            <Animated.View style={[styles.livePulseGlow, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.livePulseCore} />
          </View>
        ) : (
          <View style={[styles.timelineDot, { backgroundColor: borderColor }]} />
        )}
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: THEME.border }]} />}
      </View>

      <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        <Animated.View style={[styles.taskCard, { borderLeftColor: borderColor, transform: [{ scale: scaleAnim }] }, isLive && styles.liveCard]}>
          <LinearGradient colors={['rgba(255,255,255,0.04)', 'rgba(0,0,0,0.15)']} style={StyleSheet.absoluteFillObject} borderRadius={15} />
          <View style={styles.taskCardHeader}>
            <View style={styles.timeWrap}>
              <Ionicons name="alarm-outline" size={12} color={THEME.textSub} style={{ marginRight: 4 }} />
              <Text style={[styles.timeText, isLive && { color: THEME.pulseColor, fontWeight: 'bold' }]}>
                {t.fromTime || '--:--'} - {t.toTime || '--:--'}
              </Text>
              {isOverdue && <View style={styles.overdueDot} />}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
              <Ionicons name={cfg.icon} size={11} color={cfg.color} style={{ marginRight: 3 }} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={styles.taskName}>{t.job}</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fabAnim = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);

  const openTaskAction = (task) => { Haptics.selectionAsync(); setSelectedTask(task); setActionModalVisible(true); };

  useEffect(() => {
    fetchTasks();
    const now = new Date();
    setNewTaskDate(`${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`);
    Animated.spring(fabAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true, delay: 500 }).start();
  }, []);

  const fetchTasks = useCallback(async () => {
    setErrorMsg(null);
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Abc`;
      const response = await fetch(url);
      const text = await response.text();
      const lines = text.split('\n');
      const parsedTasks = [];
      const today = new Date(); today.setHours(0,0,0,0);
      const limitDate = new Date(); limitDate.setDate(today.getDate() + 7);

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
          const taskDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
          if (taskDate >= today && taskDate <= limitDate) {
            parsedTasks.push({ id: `cloud_${i}`, date: taskDate, dateStr, job: jobStr, fromTime: `${fromH}:${fromM}`, toTime: `${toH}:${toM}`, timeVal: parseInt(fromH)*60+parseInt(fromM), status });
          }
        }
      }

      const localTasksStr = await AsyncStorage.getItem('LOCAL_TASKS');
      if (localTasksStr) {
        JSON.parse(localTasksStr).forEach(t => {
          const tDate = new Date(t.timestamp);
          if (tDate >= today && tDate <= limitDate) {
            parsedTasks.push({ id: t.id, date: tDate, dateStr: t.dateStr, job: t.job, fromTime: '00:00', toTime: '23:59', timeVal: 0, status: t.status || 'LOCAL', isLocal: true });
          }
        });
      }

      parsedTasks.sort((a, b) => a.date - b.date);
      const grouped = [];
      parsedTasks.forEach(t => {
        let group = grouped.find(g => g.dateStr === t.dateStr);
        if (!group) { group = { dateStr: t.dateStr, dateObj: t.date, tasks: [] }; grouped.push(group); }
        group.tasks.push(t);
      });
      grouped.forEach(g => g.tasks.sort((a, b) => a.timeVal - b.timeVal));
      setTasks(grouped);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setErrorMsg('Lỗi tải dữ liệu: ' + err.message);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, [fetchTasks]);

  const handleAddLocal = async () => {
    if (!newTaskDate || !newTaskName) return Alert.alert('Lỗi', 'Vui lòng nhập ngày và tên công việc.');
    const parts = newTaskDate.split(/[-/]/);
    if (parts.length !== 3) return Alert.alert('Lỗi', 'Ngày phải có định dạng DD-MM-YYYY');
    const taskDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
    const newTask = { id: `local_${Date.now()}`, timestamp: taskDate.getTime(), dateStr: newTaskDate, job: newTaskName, status: 'WAIT' };
    try {
      const existingStr = await AsyncStorage.getItem('LOCAL_TASKS');
      let existing = existingStr ? JSON.parse(existingStr) : [];
      existing.push(newTask);
      await AsyncStorage.setItem('LOCAL_TASKS', JSON.stringify(existing));
      setNewTaskName(''); setShowAddForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchTasks();
    } catch (e) { Alert.alert('Lỗi', 'Không thể lưu công việc.'); }
  };

  const handleDeleteLocal = async (task) => {
    Alert.alert('Xác nhận', `Xóa công việc "${task.job}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          const str = await AsyncStorage.getItem('LOCAL_TASKS');
          let list = str ? JSON.parse(str) : [];
          list = list.filter(t => t.id !== task.id);
          await AsyncStorage.setItem('LOCAL_TASKS', JSON.stringify(list));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setActionModalVisible(false);
          fetchTasks();
        } catch {}
      }}
    ]);
  };

  const handleMarkDone = async (task) => {
    try {
      const str = await AsyncStorage.getItem('LOCAL_TASKS');
      let list = str ? JSON.parse(str) : [];
      const idx = list.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        list[idx].status = list[idx].status === 'DONE' ? 'WAIT' : 'DONE';
        await AsyncStorage.setItem('LOCAL_TASKS', JSON.stringify(list));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setActionModalVisible(false);
        fetchTasks();
      }
    } catch {}
  };

  const handleShareTask = async (task) => {
    try {
      await Share.share({ message: `📋 ${task.job}\n📅 ${task.dateStr}\n⏰ ${task.fromTime || '--:--'} - ${task.toTime || '--:--'}\n📊 ${STATUS_CONFIG[task.status]?.label || task.status}` });
    } catch {}
  };

  const clearLocalTasks = async () => {
    Alert.alert('Xóa toàn bộ', 'Xóa tất cả công việc cục bộ?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('LOCAL_TASKS');
        fetchTasks();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }}
    ]);
  };

  const allTasks = tasks.flatMap(g => g.tasks);
  const totalCount = allTasks.length;
  const doneCount = allTasks.filter(t => t.status === 'DONE').length;
  const waitCount = allTasks.filter(t => t.status === 'WAIT' || t.status === 'LOCAL').length;
  const missedCount = allTasks.filter(t => t.status === 'MISSED').length;
  const progressPct = totalCount > 0 ? (doneCount / totalCount * 100) : 0;

  const renderItem = ({ item }) => {
    const isToday = item.dateObj instanceof Date && item.dateObj.toDateString() === new Date().toDateString();
    return (
      <View style={styles.groupContainer}>
        <View style={styles.dateHeaderWrap}>
          <LinearGradient colors={isToday ? ['#FF5722', '#E64A19'] : [THEME.card, THEME.card]} style={[styles.dateBadge, isToday && { borderRadius: 25 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={[styles.dateBadgeText, isToday && { color: '#fff' }]}>
              {isToday ? `HÔM NAY • ${item.dateStr}` : item.dateStr}
            </Text>
          </LinearGradient>
          <View style={styles.headerLine} />
        </View>
        <View style={styles.timelineContainer}>
          {item.tasks.map((t, index) => (
            <AnimatedTaskItem key={t.id} t={t} index={index} isLast={index === item.tasks.length - 1} onPress={() => openTaskAction(t)} />
          ))}
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      {/* Super Header */}
      <LinearGradient colors={['#0D0D0F', '#121214']} style={styles.superHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerIconBox}>
              <Ionicons name="layers" size={24} color={THEME.accentBlue} />
            </View>
            <View>
              <Text style={styles.headerTitleMain}>NHIỆM VỤ</Text>
              <Text style={styles.headerTitleSub}>Lịch trình 7 ngày tới</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddForm(true); }}>
              <Ionicons name="add" size={20} color={THEME.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={fetchTasks}>
              <Ionicons name="sync" size={20} color={THEME.textLight} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Dashboard */}
      <View style={styles.dashboardWrap}>
        <BlurView intensity={50} tint="dark" style={styles.dashboardBox}>
          <View style={styles.dashItem}>
            <Text style={styles.dashValue}>{totalCount}</Text>
            <Text style={styles.dashLabel}>Tổng</Text>
          </View>
          <View style={styles.dashDivider} />
          <View style={styles.dashItem}>
            <Text style={[styles.dashValue, { color: THEME.accentGreen }]}>{doneCount}</Text>
            <Text style={[styles.dashLabel, { color: THEME.accentGreen }]}>Xong</Text>
          </View>
          <View style={styles.dashDivider} />
          <View style={styles.dashItem}>
            <Text style={[styles.dashValue, { color: THEME.accentYellow }]}>{waitCount}</Text>
            <Text style={[styles.dashLabel, { color: THEME.accentYellow }]}>Chờ</Text>
          </View>
          <View style={styles.dashDivider} />
          <View style={styles.dashItem}>
            <Text style={[styles.dashValue, { color: missedCount > 0 ? THEME.accentRed : THEME.textSub }]}>{missedCount}</Text>
            <Text style={[styles.dashLabel, { color: missedCount > 0 ? THEME.accentRed : THEME.textSub }]}>Trễ</Text>
          </View>
        </BlurView>
        {/* Progress bar */}
        {totalCount > 0 && (
          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
        )}
      </View>

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconRing}>
        <Ionicons name="calendar-outline" size={48} color={THEME.accentBlue} />
      </View>
      <Text style={styles.emptyTitle}>Không có công việc</Text>
      <Text style={styles.emptySub}>Bạn không có công việc nào trong 7 ngày tới.</Text>
      <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAddForm(true)}>
        <Ionicons name="add-circle" size={18} color={THEME.bg} style={{ marginRight: 6 }} />
        <Text style={styles.emptyAddBtnText}>Tạo công việc mới</Text>
      </TouchableOpacity>
    </View>
  );

  const actionSheetAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(actionSheetAnim, { toValue: actionModalVisible ? 1 : 0, friction: 8, tension: 65, useNativeDriver: true }).start();
  }, [actionModalVisible]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {isLoading && tasks.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={THEME.accentBlue} />
          <Text style={{ color: THEME.textSub, marginTop: 15, fontStyle: 'italic' }}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={tasks}
          renderItem={renderItem}
          keyExtractor={i => i.dateStr}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.accentBlue} progressBackgroundColor={THEME.card} colors={[THEME.accentBlue]} />}
        />
      )}

      {/* Floating Add Button */}
      <Animated.View style={[styles.fabWrap, { opacity: fabAnim, transform: [{ scale: fabAnim }] }]}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddForm(true); }} activeOpacity={0.8}>
          <LinearGradient colors={['#D4AF37', '#B8960C']} style={styles.fab}>
            <Ionicons name="add" size={26} color={THEME.bg} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Add Task Modal */}
      <Modal visible={showAddForm} transparent animationType="slide" onRequestClose={() => setShowAddForm(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowAddForm(false)} />
        <BlurView intensity={95} tint="dark" style={styles.addSheet}>
          <View style={styles.bSheetHandleWrap}><View style={styles.bSheetHandle} /></View>
          <Text style={styles.sheetTitle}>Thêm Công Việc Mới</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="calendar-outline" size={16} color={THEME.textSub} style={{ marginRight: 8 }} />
            <TextInput style={styles.input} placeholder="Ngày (VD: 25-04-2026)" placeholderTextColor={THEME.textSub} value={newTaskDate} onChangeText={setNewTaskDate} />
          </View>
          <View style={styles.inputGroup}>
            <Ionicons name="document-text-outline" size={16} color={THEME.textSub} style={{ marginRight: 8 }} />
            <TextInput style={styles.input} placeholder="Tên công việc" placeholderTextColor={THEME.textSub} value={newTaskName} onChangeText={setNewTaskName} />
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={handleAddLocal}>
            <LinearGradient colors={['#3498DB', '#2980B9']} style={StyleSheet.absoluteFillObject} borderRadius={14} />
            <Text style={styles.submitBtnText}>LƯU VÀO LỊCH TRÌNH</Text>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {/* Action Modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade" onRequestClose={() => setActionModalVisible(false)}>
        <TouchableOpacity style={styles.actionOverlay} activeOpacity={1} onPress={() => setActionModalVisible(false)}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          <Animated.View style={[styles.actionSheet, { transform: [{ scale: actionSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }], opacity: actionSheetAnim }]}>
            <LinearGradient colors={['rgba(212,175,55,0.06)', 'transparent']} style={StyleSheet.absoluteFillObject} borderRadius={25} />
            <View style={styles.actionHeader}>
              <Text style={styles.actionTitle} numberOfLines={2}>{selectedTask?.job}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Ionicons name="calendar-outline" size={12} color={THEME.accentGold} />
                <Text style={styles.actionSub}>{selectedTask?.dateStr}</Text>
                <Ionicons name="time-outline" size={12} color={THEME.accentGold} style={{ marginLeft: 4 }} />
                <Text style={styles.actionSub}>{selectedTask?.fromTime || '--:--'} - {selectedTask?.toTime || '--:--'}</Text>
              </View>
            </View>

            <View style={styles.actionBtnRow}>
              {selectedTask?.isLocal ? (
                <>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(46,204,113,0.1)' }]} onPress={() => handleMarkDone(selectedTask)}>
                    <Ionicons name={selectedTask?.status === 'DONE' ? 'undo' : 'checkmark-circle'} size={22} color={THEME.accentGreen} />
                    <Text style={[styles.actionBtnText, { color: THEME.accentGreen }]}>{selectedTask?.status === 'DONE' ? 'Hoàn tác' : 'Hoàn thành'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(231,76,60,0.1)' }]} onPress={() => handleDeleteLocal(selectedTask)}>
                    <Ionicons name="trash-outline" size={22} color={THEME.accentRed} />
                    <Text style={[styles.actionBtnText, { color: THEME.accentRed }]}>Xóa</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.actionNote}>
                  <Ionicons name="cloud-done" size={24} color={THEME.accentBlue} />
                  <Text style={styles.actionNoteText}>Công việc đồng bộ từ Cloud.</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.actionBtnShare} onPress={() => handleShareTask(selectedTask)}>
              <Ionicons name="share-outline" size={18} color={THEME.textSub} />
              <Text style={styles.actionBtnShareText}>Chia sẻ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnClose} onPress={() => setActionModalVisible(false)}>
              <Text style={styles.actionBtnCloseText}>ĐÓNG</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // ─── Header ───
  superHeader: { paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: THEME.border },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(52,152,219,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(52,152,219,0.2)' },
  headerTitleMain: { fontSize: 20, fontWeight: '900', color: THEME.textLight, letterSpacing: 1 },
  headerTitleSub: { fontSize: 11, color: THEME.textSub, marginTop: 1 },
  headerIcons: { flexDirection: 'row' },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: THEME.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.border },

  // ─── Dashboard ───
  dashboardWrap: { paddingHorizontal: 15, marginTop: -8, zIndex: 9 },
  dashboardBox: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(28,28,32,0.7)', borderRadius: 18, paddingVertical: 14, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  dashItem: { alignItems: 'center', flex: 1 },
  dashValue: { fontSize: 22, fontWeight: 'bold', color: THEME.textLight },
  dashLabel: { fontSize: 10, color: THEME.textSub, marginTop: 3, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  dashDivider: { width: 1, backgroundColor: THEME.border, alignSelf: 'stretch', marginVertical: -14 },

  progressBarOuter: { height: 3, backgroundColor: THEME.border, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: THEME.accentGreen, borderRadius: 2 },

  // ─── Group ───
  groupContainer: { marginBottom: 28, marginTop: 8 },
  dateHeaderWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, paddingHorizontal: 20 },
  dateBadge: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 25, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
  dateBadgeText: { fontSize: 12, fontWeight: 'bold', color: THEME.textSub },
  headerLine: { flex: 1, height: 1.5, backgroundColor: THEME.border, marginLeft: -10, borderRadius: 1 },

  // ─── Timeline ───
  timelineContainer: { paddingLeft: 10 },
  timelineRow: { flexDirection: 'row' },
  timelineAxis: { width: 28, alignItems: 'center', marginRight: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 20, borderWidth: 2.5, borderColor: THEME.bg, zIndex: 2 },
  timelineLine: { width: 2, flex: 1, marginTop: -4, marginBottom: -22, zIndex: 1 },

  livePulseContainer: { width: 22, height: 22, marginTop: 15, justifyContent: 'center', alignItems: 'center', zIndex: 3 },
  livePulseGlow: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: THEME.pulseColor, opacity: 0.4 },
  livePulseCore: { width: 9, height: 9, borderRadius: 5, backgroundColor: THEME.pulseColor },

  taskCard: { flex: 1, backgroundColor: THEME.card, borderRadius: 15, padding: 16, marginBottom: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4, overflow: 'hidden' },
  liveCard: { backgroundColor: 'rgba(0,255,0,0.04)', borderColor: THEME.pulseColor, borderWidth: 1, shadowColor: THEME.pulseColor, shadowRadius: 12, shadowOpacity: 0.15 },

  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timeWrap: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 12, color: THEME.textSub, fontWeight: '600' },
  overdueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.accentRed, marginLeft: 6 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  taskName: { fontSize: 16, color: THEME.textLight, lineHeight: 22, fontWeight: '500' },

  // ─── FAB ───
  fabWrap: { position: 'absolute', bottom: 155, right: 20, zIndex: 50 },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: THEME.accentGold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },

  // ─── Empty ───
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIconRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(52,152,219,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(52,152,219,0.15)', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.textLight, marginBottom: 6 },
  emptySub: { fontSize: 14, color: THEME.textSub, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.accentBlue, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyAddBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // ─── Add Sheet ───
  addSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingTop: 10, backgroundColor: 'rgba(20,20,24,0.92)', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: THEME.border },
  bSheetHandleWrap: { alignItems: 'center', marginBottom: 12 },
  bSheetHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3 },
  sheetTitle: { color: THEME.textLight, fontWeight: 'bold', fontSize: 18, marginBottom: 20, textAlign: 'center', letterSpacing: 0.5 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.bg, borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: THEME.border },
  input: { flex: 1, color: THEME.textLight, paddingVertical: 14, fontSize: 14 },
  submitBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4, overflow: 'hidden' },
  submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },

  // ─── Action Modal ───
  actionOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  actionSheet: { width: '100%', backgroundColor: 'rgba(28,28,32,0.95)', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 20, overflow: 'hidden' },
  actionHeader: { borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 14, marginBottom: 14 },
  actionTitle: { fontSize: 17, fontWeight: 'bold', color: THEME.textLight },
  actionSub: { fontSize: 13, color: THEME.accentGold, fontWeight: '500' },
  actionBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, gap: 8 },
  actionBtnText: { fontSize: 14, fontWeight: 'bold' },
  actionNote: { alignItems: 'center', padding: 16, flex: 1 },
  actionNoteText: { color: THEME.textSub, textAlign: 'center', marginTop: 8, fontSize: 13, fontStyle: 'italic' },
  actionBtnShare: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6 },
  actionBtnShareText: { color: THEME.textSub, fontSize: 13, fontWeight: '600' },
  actionBtnClose: { marginTop: 8, padding: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12 },
  actionBtnCloseText: { color: THEME.textSub, fontWeight: 'bold', fontSize: 13 },

  // ─── Misc ───
  errorText: { color: THEME.accentRed, padding: 12, textAlign: 'center', fontSize: 13 },
});
