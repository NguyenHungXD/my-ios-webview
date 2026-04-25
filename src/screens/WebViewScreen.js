import React, { useState, useRef, useContext } from 'react';
import { View, StyleSheet, Linking, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { MenuContext } from '../../App';

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
  
  // Trạng thái điều hướng
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState(activeUrl);

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
    if (canGoBack && webviewRef.current) webviewRef.current.goBack();
  };

  const handleForward = () => {
    if (canGoForward && webviewRef.current) webviewRef.current.goForward();
  };

  const handleReload = () => {
    if (webviewRef.current) webviewRef.current.reload();
  };

  const handleHome = () => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`window.location.href = '${activeUrl}'; true;`);
    }
  };

  if (isOffline) {
    return <OfflineScreen onRetry={() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      checkNetwork();
    }} />;
  }

  return (
    <View style={styles.container}>
      {/* Top Address Bar */}
      <View style={styles.topBar}>
        <Ionicons name="lock-closed" size={14} color={THEME_COLOR} style={{marginRight: 5}}/>
        <Text style={styles.urlText} numberOfLines={1}>{currentDisplayUrl}</Text>
      </View>

      {/* Progress Bar */}
      {progress < 1 && progress > 0 && (
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      )}

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

      {/* Bottom Safari-like Toolbar */}
      <View style={styles.bottomToolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={handleBack} disabled={!canGoBack}>
          <Ionicons name="chevron-back" size={28} color={canGoBack ? '#333' : '#ccc'} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolBtn} onPress={handleForward} disabled={!canGoForward}>
          <Ionicons name="chevron-forward" size={28} color={canGoForward ? '#333' : '#ccc'} />
        </TouchableOpacity>
        
        <View style={{flex: 1}} />

        <TouchableOpacity style={styles.toolBtn} onPress={handleHome}>
          <Ionicons name="home-outline" size={24} color={'#333'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolBtn} onPress={handleReload}>
          <Ionicons name="refresh" size={24} color={'#333'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: {width:0, height: 2}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 3, zIndex: 5 },
  urlText: { fontSize: 13, color: '#333', fontWeight: '500' },
  
  progressBar: { height: 3, backgroundColor: '#FFD700', position: 'absolute', top: 35, left: 0, zIndex: 10 },
  
  webview: { flex: 1, backgroundColor: '#ffffff' },
  
  bottomToolbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 20, borderTopWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: {width:0, height: -3}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10 },
  toolBtn: { padding: 10, marginHorizontal: 5 },

  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', padding: 20 },
  offlineTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
  offlineText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  retryButton: { backgroundColor: THEME_COLOR, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
