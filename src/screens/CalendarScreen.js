import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
const amlich = require('amlich');

const THEME = {
  bg: '#1A1A1D',
  card: '#2D2D34',
  header: '#121214',
  textLight: '#F5F5F5',
  textSub: '#A0A0A0',
  accentGold: '#D4AF37', 
  accentRed: '#C0392B',  
  accentGreen: '#27AE60',
  accentBlue: '#3498DB',
  border: '#3E3E42',
  weekendText: '#E74C3C',
  moonColor: '#F39C12',
  modalBg: 'rgba(18, 18, 20, 0.95)'
};

const CAN_ARRAY = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI_ARRAY = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

// Phong thủy Logic
const CAN_VALUE = { 'Giáp': 1, 'Ất': 1, 'Bính': 2, 'Đinh': 2, 'Mậu': 3, 'Kỷ': 3, 'Canh': 4, 'Tân': 4, 'Nhâm': 5, 'Quý': 5 };
const CHI_VALUE = { 'Tý': 0, 'Sửu': 0, 'Ngọ': 0, 'Mùi': 0, 'Dần': 1, 'Mão': 1, 'Thân': 1, 'Dậu': 1, 'Thìn': 2, 'Tỵ': 2, 'Tuất': 2, 'Hợi': 2 };
const MENH_MAP = { 1: 'Kim', 2: 'Thủy', 3: 'Hỏa', 4: 'Thổ', 5: 'Mộc' };

const calculateMenh = (can, chi) => {
  let val = (CAN_VALUE[can] + CHI_VALUE[chi]) % 5;
  if (val === 0) val = 5;
  return MENH_MAP[val];
};

const checkNguHanh = (myMenh, dayMenh) => {
  if (myMenh === dayMenh) return { type: 'Bình Hòa', color: THEME.accentBlue, desc: 'Ngày tương hòa bản mệnh, mọi sự bình ổn.' };
  
  const tuongSinh = { 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim', 'Kim': 'Thủy', 'Thủy': 'Mộc' };
  const tuongKhac = { 'Mộc': 'Thổ', 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim', 'Kim': 'Mộc' };

  if (tuongSinh[dayMenh] === myMenh) return { type: 'Tương Sinh (Đại Cát)', color: THEME.accentGreen, desc: 'Ngày sinh Bản mệnh của bạn. Làm việc gì cũng hanh thông, gặp may mắn lớn.' };
  if (tuongSinh[myMenh] === dayMenh) return { type: 'Sinh Xuất (Hơi Hao)', color: THEME.accentGold, desc: 'Bản mệnh sinh xuất cho ngày. Ngày này làm việc dễ bị mệt mỏi, hao tổn tâm trí.' };
  
  if (tuongKhac[dayMenh] === myMenh) return { type: 'Tương Khắc (Xấu)', color: THEME.accentRed, desc: 'Ngày khắc Bản mệnh của bạn. Hãy cẩn trọng lời ăn tiếng nói, hạn chế việc lớn.' };
  if (tuongKhac[myMenh] === dayMenh) return { type: 'Khắc Xuất (Bình)', color: THEME.accentGold, desc: 'Bạn khắc chế được ngày. Công việc tuy có cản trở nhưng bản thân có thể giải quyết được.' };

  return { type: 'Bình Hòa', color: THEME.textSub, desc: 'Ngày bình thường.' };
};

const checkDiaChi = (myChi, dayChi) => {
  const LUC_XUNG = { 'Tý':'Ngọ', 'Ngọ':'Tý', 'Sửu':'Mùi', 'Mùi':'Sửu', 'Dần':'Thân', 'Thân':'Dần', 'Mão':'Dậu', 'Dậu':'Mão', 'Thìn':'Tuất', 'Tuất':'Thìn', 'Tỵ':'Hợi', 'Hợi':'Tỵ' };
  const LUC_HOP = { 'Tý':'Sửu', 'Sửu':'Tý', 'Dần':'Hợi', 'Hợi':'Dần', 'Mão':'Tuất', 'Tuất':'Mão', 'Thìn':'Dậu', 'Dậu':'Thìn', 'Tỵ':'Thân', 'Thân':'Tỵ', 'Ngọ':'Mùi', 'Mùi':'Ngọ' };
  const TAM_HOP = [ ['Thân','Tý','Thìn'], ['Dần','Ngọ','Tuất'], ['Tỵ','Dậu','Sửu'], ['Hợi','Mão','Mùi'] ];

  if (LUC_XUNG[myChi] === dayChi) return { type: 'Lục Xung (Đại Hung)', color: THEME.accentRed, desc: `Ngày ${dayChi} xung chiếu cực mạnh với tuổi ${myChi} của bạn. Tránh đi xa, cẩn thận tai nạn.` };
  if (LUC_HOP[myChi] === dayChi) return { type: 'Lục Hợp (Đại Cát)', color: THEME.accentGreen, desc: `Tuổi ${myChi} và Ngày ${dayChi} rất hợp nhau. Ngày có quý nhân phù trợ, gia đạo vui vẻ.` };
  
  for(let group of TAM_HOP) {
    if (group.includes(myChi) && group.includes(dayChi) && myChi !== dayChi) {
      return { type: 'Tam Hợp (Tốt)', color: THEME.accentGreen, desc: `Tuổi ${myChi} nằm trong Tam Hợp với ngày ${dayChi}. Công danh sự nghiệp có bước tiến.` };
    }
  }

  return { type: 'Bình Thường', color: THEME.textSub, desc: `Ngày ${dayChi} không xung không khắc với tuổi ${myChi}.` };
};

const HOANG_DAO_HOURS = {
  'Tý': 'Tý (23-1), Sửu (1-3), Mão (5-7), Ngọ (11-13), Thân (15-17), Dậu (17-19)',
  'Ngọ': 'Tý (23-1), Sửu (1-3), Mão (5-7), Ngọ (11-13), Thân (15-17), Dậu (17-19)',
  'Sửu': 'Dần (3-5), Mão (5-7), Tỵ (9-11), Thân (15-17), Tuất (19-21), Hợi (21-23)',
  'Mùi': 'Dần (3-5), Mão (5-7), Tỵ (9-11), Thân (15-17), Tuất (19-21), Hợi (21-23)',
  'Dần': 'Tý (23-1), Sửu (1-3), Thìn (7-9), Tỵ (9-11), Mùi (13-15), Tuất (19-21)',
  'Thân': 'Tý (23-1), Sửu (1-3), Thìn (7-9), Tỵ (9-11), Mùi (13-15), Tuất (19-21)',
  'Mão': 'Tý (23-1), Dần (3-5), Mão (5-7), Ngọ (11-13), Mùi (13-15), Dậu (17-19)',
  'Dậu': 'Tý (23-1), Dần (3-5), Mão (5-7), Ngọ (11-13), Mùi (13-15), Dậu (17-19)',
  'Thìn': 'Dần (3-5), Thìn (7-9), Tỵ (9-11), Thân (15-17), Dậu (17-19), Hợi (21-23)',
  'Tuất': 'Dần (3-5), Thìn (7-9), Tỵ (9-11), Thân (15-17), Dậu (17-19), Hợi (21-23)',
  'Tỵ': 'Sửu (1-3), Thìn (7-9), Ngọ (11-13), Mùi (13-15), Tuất (19-21), Hợi (21-23)',
  'Hợi': 'Sửu (1-3), Thìn (7-9), Ngọ (11-13), Mùi (13-15), Tuất (19-21), Hợi (21-23)',
};

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarGrid, setCalendarGrid] = useState([]);
  const [detailInfo, setDetailInfo] = useState(null);

  // Profile State
  const [profile, setProfile] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [inpName, setInpName] = useState('');
  const [inpDOB, setInpDOB] = useState(''); // DD-MM-YYYY

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    generateCalendar(currentDate);
  }, [currentDate]);

  useEffect(() => {
    updateDetailInfo(selectedDate, profile);
  }, [selectedDate, profile]);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('USER_ASTRO_PROFILE');
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch(e){}
  };

  const saveProfile = async () => {
    if(!inpName || !inpDOB) return Alert.alert('Lỗi', 'Vui lòng nhập tên và ngày sinh');
    const parts = inpDOB.split(/[-/]/);
    if(parts.length !== 3) return Alert.alert('Lỗi', 'Ngày sinh phải có dạng DD-MM-YYYY');
    
    const d = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const y = parseInt(parts[2]);
    
    try {
      const lunar = amlich.convertSolar2Lunar(d, m, y, 7);
      const yearCan = CAN_ARRAY[(lunar[2] + 6) % 10];
      const yearChi = CHI_ARRAY[(lunar[2] + 8) % 12];
      const menh = calculateMenh(yearCan, yearChi);

      const userProfile = {
        name: inpName,
        dob: `${d}/${m}/${y}`,
        yearCan, yearChi,
        menh
      };

      await AsyncStorage.setItem('USER_ASTRO_PROFILE', JSON.stringify(userProfile));
      setProfile(userProfile);
      setProfileModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Thành công', `Đã lưu hồ sơ Tử Vi!\nTuổi: ${yearCan} ${yearChi}\nMệnh: ${menh}`);
    } catch(e) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tính toán.');
    }
  };

  const clearProfile = async () => {
    await AsyncStorage.removeItem('USER_ASTRO_PROFILE');
    setProfile(null);
    setProfileModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const generateCalendar = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    let startingDayOfWeek = firstDay.getDay(); 
    let grid = [];
    let currentWeek = [];

    for (let i = 0; i < startingDayOfWeek; i++) { currentWeek.push(null); }
    for (let day = 1; day <= totalDays; day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) { grid.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) { currentWeek.push(null); }
      grid.push(currentWeek);
    }
    setCalendarGrid(grid);
  };

  const updateDetailInfo = (date, userProfile) => {
    try {
      const d = date.getDate(), m = date.getMonth() + 1, y = date.getFullYear();
      const lunar = amlich.convertSolar2Lunar(d, m, y, 7);
      const lD = lunar[0], lM = lunar[1], lY = lunar[2];

      const yearCan = CAN_ARRAY[(lY + 6) % 10];
      const yearChi = CHI_ARRAY[(lY + 8) % 12];
      const namCanChi = `${yearCan} ${yearChi}`;

      const jd = amlich.jdFromDate(d, m, y);
      const dayCan = CAN_ARRAY[(jd + 9) % 10];
      const dayChi = CHI_ARRAY[(jd + 1) % 12];
      const ngayCanChi = `${dayCan} ${dayChi}`;
      
      const dayMenh = calculateMenh(dayCan, dayChi);
      const hoangDao = HOANG_DAO_HOURS[dayChi] || '';

      let astrologyReading = null;
      if (userProfile) {
        astrologyReading = {
          nguHanh: checkNguHanh(userProfile.menh, dayMenh),
          diaChi: checkDiaChi(userProfile.yearChi, dayChi)
        };
      }

      setDetailInfo({
        lunarStr: `Mùng ${lD} tháng ${lM} năm ${lY}`,
        namCanChi, ngayCanChi, hoangDao, dayMenh,
        isRằm: lD === 15, isMung1: lD === 1,
        astrologyReading
      });
    } catch(e) { setDetailInfo(null); }
  };

  const handlePrevMonth = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); };
  const handleNextMonth = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); };
  
  const handleGoToday = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const today = new Date();
    setCurrentDate(today); setSelectedDate(today);
  };

  const handleDayPress = (date) => {
    if (!date) return;
    Haptics.selectionAsync();
    setSelectedDate(date);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!date) return false;
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{padding: 15, paddingBottom: 100}} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            setInpName(profile?.name || '');
            setInpDOB(profile?.dob ? profile.dob.replace(/\//g,'-') : '');
            setProfileModal(true);
          }} style={styles.profileBtn}>
            <Ionicons name="person-circle-outline" size={28} color={profile ? THEME.accentGold : THEME.textSub} />
            {profile && <View style={styles.profileActiveDot}/>}
          </TouchableOpacity>

          <View style={styles.monthNavWrap}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}><Ionicons name="chevron-back" size={20} color={THEME.accentGold} /></TouchableOpacity>
            <Text style={styles.headerText}>Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}><Ionicons name="chevron-forward" size={20} color={THEME.accentGold} /></TouchableOpacity>
          </View>
        </View>

        {/* Grid Lịch */}
        <View style={styles.calendarBox}>
          <View style={styles.weekRow}>
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
              <Text key={idx} style={[styles.weekDayText, (idx === 0 || idx === 6) && {color: THEME.weekendText}]}>{day}</Text>
            ))}
          </View>

          {calendarGrid.map((week, wIdx) => (
            <View key={wIdx} style={styles.daysRow}>
              {week.map((dateObj, dIdx) => {
                if (!dateObj) return <View key={dIdx} style={styles.dayCell} />;
                const isSel = isSelected(dateObj);
                const isTod = isToday(dateObj);
                const isWeekend = dIdx === 0 || dIdx === 6;
                let lunar = [1,1,1];
                try { lunar = amlich.convertSolar2Lunar(dateObj.getDate(), dateObj.getMonth()+1, dateObj.getFullYear(), 7); } catch(e) {}
                const isRằm = lunar[0] === 15, isMung1 = lunar[0] === 1;

                return (
                  <TouchableOpacity 
                    key={dIdx} 
                    style={[styles.dayCell, isTod && styles.todayCell, isSel && styles.selectedCell]}
                    onPress={() => handleDayPress(dateObj)}
                    activeOpacity={0.7}
                  >
                    {isRằm && <View style={styles.moonDot} />}
                    <Text style={[styles.solarText, isWeekend && {color: THEME.weekendText}, isSel && {color: '#fff', fontWeight: 'bold'}]}>
                      {dateObj.getDate()}
                    </Text>
                    <Text style={[styles.lunarText, isMung1 && {color: THEME.accentGold, fontWeight: 'bold'}, isSel && {color: '#eee'}]}>
                      {lunar[0] === 1 ? `${lunar[0]}/${lunar[1]}` : lunar[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Khung Chi Tiết & Bát Tự */}
        {detailInfo && (
          <View style={styles.detailBox}>
            <View style={styles.detailRibbon}>
              <Text style={styles.detailRibbonText}>
                {detailInfo.isRằm ? '🌕 NGÀY RẰM' : (detailInfo.isMung1 ? '🌑 MÙNG MỘT' : 'THÔNG TIN BÁT TỰ')}
              </Text>
            </View>
            
            <Text style={styles.detailDateMain}>{selectedDate.getDate()} / {selectedDate.getMonth()+1} / {selectedDate.getFullYear()}</Text>
            <Text style={styles.detailLunarMain}>{detailInfo.lunarStr}</Text>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="leaf-outline" size={16} color={THEME.accentGold} />
              <Text style={styles.infoLabel}> Năm:</Text>
              <Text style={styles.infoValue}>{detailInfo.namCanChi}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="sunny-outline" size={16} color={THEME.accentGold} />
              <Text style={styles.infoLabel}> Ngày:</Text>
              <Text style={styles.infoValue}>{detailInfo.ngayCanChi} (Mệnh {detailInfo.dayMenh})</Text>
            </View>
            <View style={[styles.infoRow, {alignItems: 'flex-start', marginTop: 10}]}>
              <Ionicons name="time-outline" size={16} color={THEME.accentGold} style={{marginTop: 2}}/>
              <View style={{marginLeft: 5, flex: 1}}>
                <Text style={[styles.infoLabel, {color: THEME.accentGold}]}>Giờ Hoàng Đạo:</Text>
                <Text style={styles.hoangDaoText}>{detailInfo.hoangDao}</Text>
              </View>
            </View>

            {/* LUẬN GIẢI CÁ NHÂN */}
            {profile && detailInfo.astrologyReading && (
              <View style={styles.astroBox}>
                <View style={styles.astroHeader}>
                  <Ionicons name="compass" size={18} color="#fff" />
                  <Text style={styles.astroTitle}>LUẬN GIẢI CHO {profile.name.toUpperCase()}</Text>
                </View>
                <View style={styles.astroContent}>
                  <Text style={styles.astroMyInfo}>Tuổi: {profile.yearCan} {profile.yearChi}  -  Mệnh: {profile.menh}</Text>
                  
                  <View style={styles.astroItem}>
                    <Text style={styles.astroItemTitle}>✧ Ngũ Hành ({detailInfo.astrologyReading.nguHanh.type}):</Text>
                    <Text style={[styles.astroItemDesc, {color: detailInfo.astrologyReading.nguHanh.color}]}>
                      {detailInfo.astrologyReading.nguHanh.desc}
                    </Text>
                  </View>

                  <View style={styles.astroItem}>
                    <Text style={styles.astroItemTitle}>✧ Địa Chi ({detailInfo.astrologyReading.diaChi.type}):</Text>
                    <Text style={[styles.astroItemDesc, {color: detailInfo.astrologyReading.diaChi.color}]}>
                      {detailInfo.astrologyReading.diaChi.desc}
                    </Text>
                  </View>
                </View>
              </View>
            )}

          </View>
        )}

        <TouchableOpacity style={styles.todayBtn} onPress={handleGoToday}>
          <Ionicons name="calendar" size={18} color="#fff" />
          <Text style={styles.todayBtnText}>Về Hôm Nay</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal Profile Tử Vi */}
      <Modal visible={profileModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>HỒ SƠ TỬ VI</Text>
            <Text style={styles.modalSub}>Để xem Luận giải cá nhân hằng ngày, vui lòng thiết lập Tứ Trụ Bát Tự của bạn.</Text>
            
            <TextInput style={styles.input} placeholder="Họ và Tên (VD: Nguyễn Văn A)" placeholderTextColor={THEME.textSub} value={inpName} onChangeText={setInpName} />
            <TextInput style={styles.input} placeholder="Ngày Sinh Dương Lịch (DD-MM-YYYY)" placeholderTextColor={THEME.textSub} value={inpDOB} onChangeText={setInpDOB} keyboardType="numeric" />

            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>LƯU HỒ SƠ</Text>
            </TouchableOpacity>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
              {profile && (
                <TouchableOpacity onPress={clearProfile}>
                  <Text style={{color: THEME.accentRed, fontWeight: 'bold'}}>Xóa Hồ Sơ</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setProfileModal(false)}>
                <Text style={{color: THEME.textSub, fontWeight: 'bold'}}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: Platform.OS==='ios'?50:20, paddingHorizontal: 20 },
  headerText: { fontSize: 18, fontWeight: 'bold', color: THEME.accentGold, letterSpacing: 1, marginHorizontal: 15 },
  navBtn: { padding: 8, backgroundColor: THEME.card, borderRadius: 12, borderWidth: 1, borderColor: THEME.border },
  monthNavWrap: { flexDirection: 'row', alignItems: 'center' },
  
  profileBtn: { position: 'relative' },
  profileActiveDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: THEME.accentGreen, borderWidth: 2, borderColor: THEME.bg },

  calendarBox: { backgroundColor: THEME.card, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, marginHorizontal: 15 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 15 },
  weekDayText: { fontSize: 13, fontWeight: 'bold', color: THEME.textSub, width: 40, textAlign: 'center' },
  
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  dayCell: { width: 42, height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  todayCell: { borderWidth: 1, borderColor: THEME.accentGold, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  selectedCell: { backgroundColor: THEME.accentRed, shadowColor: THEME.accentRed, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  
  moonDot: { position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.moonColor },
  solarText: { fontSize: 16, color: THEME.textLight, fontWeight: '500' },
  lunarText: { fontSize: 9, color: THEME.textSub, marginTop: 2 },

  detailBox: { backgroundColor: THEME.header, marginTop: 25, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: THEME.border, marginHorizontal: 15, overflow: 'hidden' },
  detailRibbon: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: THEME.accentRed, paddingVertical: 5, alignItems: 'center' },
  detailRibbonText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  detailDateMain: { fontSize: 26, fontWeight: 'bold', color: THEME.textLight, textAlign: 'center', marginTop: 15 },
  detailLunarMain: { fontSize: 16, color: THEME.accentGold, fontStyle: 'italic', textAlign: 'center', marginTop: 5 },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 15 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: THEME.textSub, fontWeight: 'bold', marginLeft: 5 },
  infoValue: { fontSize: 14, color: THEME.textLight, marginLeft: 10, fontWeight: '500' },
  hoangDaoText: { fontSize: 13, color: THEME.textLight, lineHeight: 20, marginTop: 5, fontStyle: 'italic' },

  astroBox: { marginTop: 20, backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: THEME.accentGold, overflow: 'hidden' },
  astroHeader: { flexDirection: 'row', backgroundColor: THEME.accentGold, padding: 10, alignItems: 'center', justifyContent: 'center' },
  astroTitle: { color: THEME.header, fontWeight: 'bold', marginLeft: 5, fontSize: 13, letterSpacing: 1 },
  astroContent: { padding: 15 },
  astroMyInfo: { color: THEME.textLight, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, fontSize: 15 },
  astroItem: { marginBottom: 10 },
  astroItemTitle: { color: THEME.accentGold, fontWeight: '600', fontSize: 13, marginBottom: 3 },
  astroItemDesc: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  todayBtn: { flexDirection: 'row', backgroundColor: THEME.card, alignSelf: 'center', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, marginTop: 25, borderWidth: 1, borderColor: THEME.accentGold, alignItems: 'center' },
  todayBtnText: { color: THEME.accentGold, fontWeight: 'bold', marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: THEME.modalBg, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: THEME.header, padding: 25, borderRadius: 20, borderWidth: 1, borderColor: THEME.border },
  modalTitle: { color: THEME.accentGold, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  modalSub: { color: THEME.textSub, textAlign: 'center', marginBottom: 25, fontSize: 13, lineHeight: 20 },
  input: { backgroundColor: THEME.card, color: THEME.textLight, padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: THEME.border },
  saveBtn: { backgroundColor: THEME.accentGold, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: THEME.header, fontWeight: 'bold', fontSize: 16 }
});
