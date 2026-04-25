import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, StyleSheet, Linking, TouchableOpacity, Text, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Network from 'expo-network';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MenuContext } from '../../App';

const THEME_COLOR = '#1E293B'; // Dark Blue/Gray
const ACCENT_COLOR = '#FFD700'; // Gold

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

export default function WebViewScreen() {
  const { activeUrl } = useContext(MenuContext);
  const webviewRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  
  // Trạng thái điều hướng
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState(activeUrl);

  const checkNetwork = async () => {
    const networkState = await Network.getNetworkStateAsync();
    setIsOffline(!networkState.isConnected);
  };

  useEffect(() => { checkNetwork(); }, [activeUrl]);

  const onNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    try {
      const urlObj = new URL(navState.url);
      setCurrentDisplayUrl(urlObj.hostname);
    } catch(e) {
      setCurrentDisplayUrl(navState.url.substring(0, 30));
    }
  };

  const onShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Linking.openURL(url).catch(err => console.log('Lỗi mở link:', err));
      return false;
    }
    return true;
  };

  const handleBack = () => {
    if (canGoBack && webviewRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      webviewRef.current.goBack();
    }
  };

  const handleForward = () => {
    if (canGoForward && webviewRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      webviewRef.current.goForward();
    }
  };

  const handleReload = () => {
    if (webviewRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      webviewRef.current.reload();
    }
  };

  const handleHome = () => {
    if (webviewRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      webviewRef.current.injectJavaScript(`window.location.href = '${activeUrl}'; true;`);
    }
  };

  if (isOffline) {
    return <OfflineScreen onRetry={() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      checkNetwork();
    }} />;
  }

  const isLoading = progress < 1 && progress > 0;

  return (
    <View style={styles.container}>
      
      {/* Nền xám mờ nhẹ để thanh header nổi lên */}
      <View style={styles.headerArea}>
        <View style={styles.smartAddressBar}>
          <Ionicons name="lock-closed" size={12} color="#4ADE80" style={{marginRight: 6}}/>
          <Text style={styles.urlText} numberOfLines={1}>{currentDisplayUrl}</Text>
          
          <View style={{flex: 1}} />
          
          {isLoading ? (
            <ActivityIndicator size="small" color={THEME_COLOR} style={{marginRight: 5}} />
          ) : (
            <TouchableOpacity onPress={handleReload} style={styles.reloadBtn}>
              <Ionicons name="refresh" size={16} color={THEME_COLOR} />
            </TouchableOpacity>
          )}

          {/* Progress Bar chạy chìm dưới đáy Smart Address Bar */}
          {isLoading && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
          )}
        </View>
      </View>

      {/* Main WebView */}
      <WebView 
        ref={webviewRef}
        source={{ uri: activeUrl }} 
        style={styles.webview}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        onNavigationStateChange={onNavigationStateChange}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true} 
        bounces={true} 
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        renderError={() => setIsOffline(true)}
      />

      {/* Floating Capsule Toolbar (Safari Style) */}
      <View style={styles.floatingToolbarWrap}>
        <View style={styles.floatingToolbar}>
          <TouchableOpacity style={styles.toolBtn} onPress={handleBack} disabled={!canGoBack}>
            <Ionicons name="chevron-back" size={24} color={canGoBack ? '#fff' : '#64748B'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolBtn} onPress={handleForward} disabled={!canGoForward}>
            <Ionicons name="chevron-forward" size={24} color={canGoForward ? '#fff' : '#64748B'} />
          </TouchableOpacity>
          
          <View style={styles.toolbarDivider} />

          <TouchableOpacity style={styles.toolBtn} onPress={handleHome}>
            <Ionicons name="home" size={20} color={'#fff'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handleReload}>
            <Ionicons name="reload" size={20} color={'#fff'} />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  headerArea: { paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 15, paddingBottom: 10, backgroundColor: '#F8FAFC', zIndex: 10 },
  smartAddressBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, overflow: 'hidden' },
  urlText: { fontSize: 14, color: '#334155', fontWeight: '600', maxWidth: '70%' },
  reloadBtn: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 12 },
  
  progressTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'transparent' },
  progressBar: { height: '100%', backgroundColor: '#3B82F6', borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  
  webview: { flex: 1, backgroundColor: '#ffffff' },
  
  // Toolbar lơ lửng nằm ngay trên Tab Bar chính của ứng dụng
  floatingToolbarWrap: { position: 'absolute', bottom: 105, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  floatingToolbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.95)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 15 },
  toolBtn: { padding: 10, marginHorizontal: 5 },
  toolbarDivider: { width: 1, height: 20, backgroundColor: '#475569', marginHorizontal: 10 },

  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', padding: 20 },
  offlineTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
  offlineText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  retryButton: { backgroundColor: THEME_COLOR, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
