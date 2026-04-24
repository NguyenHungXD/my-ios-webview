import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Image, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Drawer = createDrawerNavigator();
const THEME_COLOR = '#2E8B57'; // Màu xanh lá cây chuyên nghiệp

const DEFAULT_MENU = [
  { id: '1', name: 'Trang Chủ', url: 'https://thanhhungqs.xyz/manager/index.php', icon: 'home-outline' },
  { id: '2', name: 'Công Cụ', url: 'https://google.com', icon: 'construct-outline' },
];

const MenuContext = createContext();

// --- 1. MÀN HÌNH KHỞI ĐỘNG (0-100%) ---
const SplashScreenView = ({ progress }) => (
  <View style={styles.splashContainer}>
    <StatusBar style="dark" />
    <Image 
      source={require('./assets/Logo.png')} 
      style={styles.splashLogo}
      resizeMode="contain"
    />
    <View style={styles.splashProgressBox}>
      <Text style={styles.splashProgressText}>Đang chuẩn bị dữ liệu... {progress}%</Text>
      <View style={styles.splashProgressBarBg}>
        <View style={[styles.splashProgressBarFill, { width: `${progress}%` }]} />
      </View>
    </View>
  </View>
);

// --- 2. MÀN HÌNH MẤT KẾT NỐI ---
const OfflineScreen = ({ onRetry }) => (
  <View style={styles.offlineContainer}>
    <Ionicons name="wifi-outline" size={80} color="#ccc" />
    <Text style={styles.offlineTitle}>Mất kết nối Internet</Text>
    <Text style={styles.offlineText}>Vui lòng kiểm tra lại mạng Wi-Fi hoặc 4G của bạn.</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Thử lại</Text>
    </TouchableOpacity>
  </View>
);

// --- 3. MÀN HÌNH WEBVIEW ---
const WebViewScreen = ({ route, navigation }) => {
  const { url } = route.params;
  const webviewRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
    return unsubscribe;
  }, [navigation]);

  const checkNetwork = async () => {
    const networkState = await Network.getNetworkStateAsync();
    setIsOffline(!networkState.isConnected);
  };

  useEffect(() => { checkNetwork(); }, [url]);

  const onShouldStartLoadWithRequest = (request) => {
    const { url: reqUrl } = request;
    if (!reqUrl.startsWith('http://') && !reqUrl.startsWith('https://')) {
      Linking.openURL(reqUrl).catch(err => console.log('Lỗi mở link ngoài:', err));
      return false;
    }
    return true;
  };

  if (isOffline) {
    return <OfflineScreen onRetry={() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      checkNetwork();
    }} />;
  }

  return (
    <View style={styles.container}>
      {progress < 1 && progress > 0 && (
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      )}
      <WebView 
        ref={webviewRef}
        source={{ uri: url }} 
        style={styles.webview}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        allowsBackForwardNavigationGestures={true} // Kéo mép để Lùi/Tiến trang (Chỉ hoạt động khi swipeEnabled=false ở Drawer)
        pullToRefreshEnabled={true} 
        bounces={true} 
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        renderError={() => setIsOffline(true)}
      />
    </View>
  );
};

// --- 4. MÀN HÌNH QUẢN LÝ TAB ĐỘNG ---
const ManagePagesScreen = () => {
  const { menuItems, setMenuItems } = useContext(MenuContext);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  // Mặc định cho icon web
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
    Alert.alert('Xác nhận', 'Bạn muốn xóa trang này khỏi Menu?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => {
        const newItems = menuItems.filter(i => i.id !== id);
        setMenuItems(newItems);
        saveToStorage(newItems);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }}
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.manageItem}>
      <View style={styles.manageItemInfo}>
        <Ionicons name={item.icon} size={24} color={THEME_COLOR} style={{marginRight: 10}} />
        <View style={{flex: 1}}>
          <Text style={styles.manageItemName}>{item.name}</Text>
          <Text style={styles.manageItemUrl} numberOfLines={1}>{item.url}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList 
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
      />
      <View style={styles.manageInputContainer}>
        <Text style={styles.manageInputTitle}>Thêm trang mới</Text>
        <TextInput style={styles.input} placeholder="Tên trang (VD: Báo mới)" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Đường link (VD: baomoi.com)" value={url} onChangeText={setUrl} keyboardType="url" autoCapitalize="none" />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Thêm Trang</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// --- 5. COMPONENT GỐC CỦA ỨNG DỤNG ---
export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [splashProgress, setSplashProgress] = useState(0);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    async function prepareApp() {
      // Tải danh sách trang từ bộ nhớ cục bộ
      try {
        const stored = await AsyncStorage.getItem('USER_MENU_ITEMS');
        if (stored !== null) {
          setMenuItems(JSON.parse(stored));
        } else {
          setMenuItems(DEFAULT_MENU);
        }
      } catch (e) {
        setMenuItems(DEFAULT_MENU);
      }

      // Giả lập tiến trình khởi động từ 0 - 100%
      let counter = 0;
      const interval = setInterval(() => {
        counter += Math.floor(Math.random() * 10) + 5; // Tăng ngẫu nhiên từ 5 đến 15
        if (counter >= 100) {
          counter = 100;
          setSplashProgress(counter);
          clearInterval(interval);
          setTimeout(() => setIsAppReady(true), 400); // Đợi 0.4s rồi tắt splash
        } else {
          setSplashProgress(counter);
        }
      }, 80);
    }
    prepareApp();
  }, []);

  // Nếu app chưa sẵn sàng -> Hiện màn hình Splash đếm số
  if (!isAppReady) {
    return <SplashScreenView progress={splashProgress} />;
  }

  // Nếu đã sẵn sàng -> Vào giao diện chính
  return (
    <MenuContext.Provider value={{ menuItems, setMenuItems }}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={THEME_COLOR} />
        <Drawer.Navigator
          initialRouteName={menuItems.length > 0 ? menuItems[0].name : "Quản lý Trang"}
          screenOptions={{
            swipeEnabled: false, // TẮT VUỐT MÉP Ở GIAO DIỆN DRAWER ĐỂ TRÁNH XUNG ĐỘT
            headerStyle: { backgroundColor: THEME_COLOR },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            drawerActiveTintColor: THEME_COLOR,
          }}
        >
          {menuItems.map((item) => (
            <Drawer.Screen 
              key={item.id} 
              name={item.name} 
              component={WebViewScreen} 
              initialParams={{ url: item.url }}
              options={{
                drawerIcon: ({ color }) => (
                  <Ionicons name={item.icon} size={22} color={color} />
                ),
              }}
            />
          ))}
          <Drawer.Screen 
            name="Quản lý Trang" 
            component={ManagePagesScreen} 
            options={{
              drawerIcon: ({ color }) => (
                <Ionicons name="settings-outline" size={22} color={color} />
              ),
            }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </MenuContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  progressBar: { height: 3, backgroundColor: '#FFD700', position: 'absolute', top: 0, left: 0, zIndex: 10 },
  
  // Offline
  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', padding: 20 },
  offlineTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
  offlineText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  retryButton: { backgroundColor: THEME_COLOR, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Splash Screen
  splashContainer: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  splashLogo: { width: 200, height: 200, marginBottom: 40 },
  splashProgressBox: { width: '70%', alignItems: 'center' },
  splashProgressText: { fontSize: 16, color: '#444', marginBottom: 15, fontWeight: '600' },
  splashProgressBarBg: { width: '100%', height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden' },
  splashProgressBarFill: { height: '100%', backgroundColor: THEME_COLOR, borderRadius: 5 },

  // Manage Pages
  manageItem: { flexDirection: 'row', backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee' },
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
