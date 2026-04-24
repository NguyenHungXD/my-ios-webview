import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, View, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

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

const LoadingIndicatorView = () => (
  <View style={styles.loadingContainer}>
    <Image 
      source={require('./assets/Logo.png')} 
      style={styles.logo}
      resizeMode="contain"
    />
    <ActivityIndicator color={THEME_COLOR} size="large" />
  </View>
);

const WebViewScreen = ({ route }) => {
  const { url } = route.params;
  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: url }} 
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={LoadingIndicatorView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
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
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  }
});
