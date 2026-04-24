import React, { useState, useEffect, createContext, useContext } from 'react';
import { StyleSheet, View, Text, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Nhập các màn hình phụ
import CalendarScreen from './src/screens/CalendarScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import WebViewScreen from './src/screens/WebViewScreen';
import ManagePagesScreen from './src/screens/ManagePagesScreen';

// --- BỘ BẮT LỖI TOÀN CỤC (GLOBAL ERROR HANDLER) ---
if (!__DEV__) {
  const defaultErrorHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    Alert.alert(
      'Lỗi nghiêm trọng (JS Crash)',
      `Mã lỗi: ${error.message}\nBạn hãy chụp màn hình này gửi lại cho lập trình viên.`,
      [{ text: 'OK' }]
    );
  });
}

const Tab = createBottomTabNavigator();
const THEME_COLOR = '#2E8B57'; // Màu xanh lá cây chuyên nghiệp

const DEFAULT_MENU = [
  { id: '1', name: 'Trang Chủ', url: 'https://thanhhungqs.xyz/manager/index.php', icon: 'home-outline' },
];

export const MenuContext = createContext();

// --- MÀN HÌNH KHỞI ĐỘNG (0-100%) ---
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

// --- COMPONENT GỐC ---
export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [splashProgress, setSplashProgress] = useState(0);
  const [menuItems, setMenuItems] = useState([]);
  const [activeUrl, setActiveUrl] = useState(DEFAULT_MENU[0].url);

  useEffect(() => {
    async function prepareApp() {
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

      let counter = 0;
      const interval = setInterval(() => {
        counter += Math.floor(Math.random() * 10) + 5;
        if (counter >= 100) {
          counter = 100;
          setSplashProgress(counter);
          clearInterval(interval);
          setTimeout(() => setIsAppReady(true), 400);
        } else {
          setSplashProgress(counter);
        }
      }, 80);
    }
    prepareApp();
  }, []);

  if (!isAppReady) {
    return <SplashScreenView progress={splashProgress} />;
  }

  // SafeAreaProvider LÀ BẮT BUỘC ĐỂ KHÔNG BỊ CRASH TRÊN IOS (TAI THỎ)
  return (
    <SafeAreaProvider>
      <MenuContext.Provider value={{ menuItems, setMenuItems, activeUrl, setActiveUrl }}>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={THEME_COLOR} />
          <Tab.Navigator
            initialRouteName="Duyệt Web"
            screenOptions={{
              headerStyle: { backgroundColor: THEME_COLOR },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              tabBarActiveTintColor: THEME_COLOR,
              tabBarInactiveTintColor: '#888',
            }}
          >
            <Tab.Screen 
              name="Duyệt Web" 
              component={WebViewScreen} 
              options={{
                tabBarIcon: ({ color }) => <Ionicons name="globe-outline" size={24} color={color} />,
              }}
            />
            <Tab.Screen 
              name="Lịch Vạn Niên" 
              component={CalendarScreen} 
              options={{
                tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
              }}
            />
            <Tab.Screen 
              name="Thời Tiết" 
              component={WeatherScreen} 
              options={{
                tabBarIcon: ({ color }) => <Ionicons name="partly-sunny-outline" size={24} color={color} />,
              }}
            />
            <Tab.Screen 
              name="Cài Đặt" 
              component={ManagePagesScreen} 
              options={{
                title: 'Quản Lý Trang',
                tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </MenuContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  splashLogo: { width: 200, height: 200, marginBottom: 40 },
  splashProgressBox: { width: '70%', alignItems: 'center' },
  splashProgressText: { fontSize: 16, color: '#444', marginBottom: 15, fontWeight: '600' },
  splashProgressBarBg: { width: '100%', height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden' },
  splashProgressBarFill: { height: '100%', backgroundColor: THEME_COLOR, borderRadius: 5 },
});
