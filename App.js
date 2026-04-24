import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';

const Drawer = createDrawerNavigator();

// === TÙY BIẾN DANH SÁCH TRANG WEB TẠI ĐÂY ===
// Bạn có thể thêm, sửa, xóa các dòng bên dưới. 
// Tham khảo icon tại: https://icons.expo.fyi/
const MENU_ITEMS = [
  { name: 'Trang Chủ', url: 'https://thanhhungqs.xyz/manager/index.php', icon: 'home-outline' },
  { name: 'Công Cụ', url: 'https://google.com', icon: 'construct-outline' },
  { name: 'Tin Tức', url: 'https://vnexpress.net', icon: 'newspaper-outline' },
];

const THEME_COLOR = '#2E8B57'; // Màu xanh lá cây (SeaGreen) chuyên nghiệp

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

const WebViewScreen = ({ route, navigation }) => {
  const { url } = route.params;
  const webviewRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  // Kích hoạt Rung Haptic khi bấm vào các Menu Tab
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
    return unsubscribe;
  }, [navigation]);

  // Hàm kiểm tra mạng
  const checkNetwork = async () => {
    const networkState = await Network.getNetworkStateAsync();
    setIsOffline(!networkState.isConnected);
  };

  useEffect(() => {
    checkNetwork();
  }, [url]);

  // Bắt các link mở ra ngoài app (Zalo, Điện thoại, SMS, Facebook, Youtube...)
  const onShouldStartLoadWithRequest = (request) => {
    const { url: reqUrl } = request;
    if (!reqUrl.startsWith('http://') && !reqUrl.startsWith('https://')) {
      Linking.openURL(reqUrl).catch(err => console.log('Lỗi mở link ngoài:', err));
      return false; // Ngăn chặn webview cố gắng tải link lỗi
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
      {/* Thanh Progress Bar chạy % siêu mượt chuẩn Safari */}
      {progress < 1 && progress > 0 && (
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      )}
      
      <WebView 
        ref={webviewRef}
        source={{ uri: url }} 
        style={styles.webview}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        allowsBackForwardNavigationGestures={true} // Kéo mép màn hình để Back/Forward
        pullToRefreshEnabled={true} // Kéo từ trên xuống để Tải lại trang (Pull to Refresh)
        bounces={true} // Độ nảy dội chuẩn iOS
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        renderError={() => setIsOffline(true)}
      />
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={THEME_COLOR} />
      <Drawer.Navigator
        initialRouteName={MENU_ITEMS[0].name}
        screenOptions={{
          headerStyle: {
            backgroundColor: THEME_COLOR,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          drawerActiveTintColor: THEME_COLOR,
        }}
      >
        {MENU_ITEMS.map((item, index) => (
          <Drawer.Screen 
            key={index} 
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
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#FFD700', // Màu Vàng/Cam nổi bật trên nền xanh
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  offlineTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  offlineText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
