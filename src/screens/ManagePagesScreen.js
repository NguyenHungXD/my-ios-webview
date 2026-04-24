import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { MenuContext } from '../../App';

const THEME_COLOR = '#2E8B57';

export default function ManagePagesScreen({ navigation }) {
  const { menuItems, setMenuItems, activeUrl, setActiveUrl } = useContext(MenuContext);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const icon = 'globe-outline';

  const saveToStorage = async (newItems) => {
    try {
      await AsyncStorage.setItem('USER_MENU_ITEMS', JSON.stringify(newItems));
    } catch (e) {
      console.log('Loi luu', e);
    }
  };

  const handleAdd = () => {
    if (!name || !url) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên trang và đường link!');
      return;
    }
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }
    const newItem = { id: Date.now().toString(), name, url: validUrl, icon };
    const newItems = [...menuItems, newItem];
    setMenuItems(newItems);
    saveToStorage(newItems);
    setName(''); setUrl('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Bạn muốn xóa trang này khỏi danh sách?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => {
        const newItems = menuItems.filter(i => i.id !== id);
        setMenuItems(newItems);
        saveToStorage(newItems);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }}
    ]);
  };

  const handleSelectPage = (itemUrl) => {
    setActiveUrl(itemUrl);
    Haptics.selectionAsync();
    navigation.navigate('Duyệt Web'); // Nhảy sang Tab Duyệt Web
  };

  const renderItem = ({ item }) => {
    const isActive = item.url === activeUrl;
    return (
      <TouchableOpacity style={[styles.manageItem, isActive && styles.activeItem]} onPress={() => handleSelectPage(item.url)}>
        <View style={styles.manageItemInfo}>
          <Ionicons name={item.icon} size={24} color={isActive ? '#fff' : THEME_COLOR} style={{marginRight: 10}} />
          <View style={{flex: 1}}>
            <Text style={[styles.manageItemName, isActive && {color: '#fff'}]}>{item.name}</Text>
            <Text style={[styles.manageItemUrl, isActive && {color: '#eee'}]} numberOfLines={1}>{item.url}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color={isActive ? '#fff' : "#FF3B30"} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.headerBox}>
        <Text style={styles.headerSubtitle}>Bấm vào một trang để mở lên ở tab Lướt Web</Text>
      </View>
      <FlatList 
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      />
      <View style={styles.manageInputContainer}>
        <Text style={styles.manageInputTitle}>Thêm trang web mới</Text>
        <TextInput style={styles.input} placeholder="Tên trang (VD: Google)" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Đường link (VD: google.com)" value={url} onChangeText={setUrl} keyboardType="url" autoCapitalize="none" />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Lưu Trang</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerBox: { padding: 20, paddingBottom: 10 },
  headerSubtitle: { color: '#666', fontSize: 14, fontStyle: 'italic' },
  manageItem: { flexDirection: 'row', backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee' },
  activeItem: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
  manageItemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  manageItemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  manageItemUrl: { fontSize: 13, color: '#888', marginTop: 4 },
  deleteBtn: { padding: 10 },
  manageInputContainer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 10 },
  manageInputTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: THEME_COLOR },
  input: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  addButton: { backgroundColor: THEME_COLOR, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
