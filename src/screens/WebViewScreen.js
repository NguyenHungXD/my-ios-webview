import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, StyleSheet, Linking, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Network from 'expo-network';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MenuContext } from '../../App';
import { useIsFocused } from '@react-navigation/native';

const THEME_COLOR = '#2E8B57';

const OfflineScreen = ({ onRetry }) => (
  <View style={styles.offlineContainer}>
    <Ionicons name="wifi-outline" size={80} color="#ccc" />
    <Text style={styles.offlineTitle}>Mất kết nối Internet</Text>
    <Text style={styles.offlineText}>Vui lòng kiểm tra lại kết nối mạng của bạn.</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Thử lại</Text>
    </TouchableOpacity>
  </View>
);

export default function WebViewScreen({ navigation }) {
  const { activeUrl } = useContext(MenuContext);
  const webviewRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const isFocused = useIsFocused();

  const checkNetwork = async () => {
    const networkState = await Network.getNetworkStateAsync();
    setIsOffline(!networkState.isConnected);
  };

  useEffect(() => { checkNetwork(); }, [activeUrl]);

  const onShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Linking.openURL(url).catch(err => console.log('Lỗi mở link:', err));
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
        source={{ uri: activeUrl }} 
        style={styles.webview}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true} 
        bounces={true} 
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        renderError={() => setIsOffline(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  progressBar: { height: 3, backgroundColor: '#FFD700', position: 'absolute', top: 0, left: 0, zIndex: 10 },
  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', padding: 20 },
  offlineTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
  offlineText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  retryButton: { backgroundColor: THEME_COLOR, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
