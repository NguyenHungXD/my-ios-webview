import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, StyleSheet, Linking, TouchableOpacity, Text, Platform, ActivityIndicator, Animated, Share, Dimensions, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MenuContext } from '../../App';
import { THEME } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

const TAB_BAR_BOTTOM = 25;
const TAB_BAR_HEIGHT = 70;
const TOOLBAR_BOTTOM = TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + 12;

const SCROLL_SCRIPT = `
(function() {
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', function() {
    let currentY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          _type: 'scroll',
          scrollY: currentY,
          direction: currentY > lastY ? 'down' : 'up'
        }));
        lastY = currentY;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
`;

const OfflineScreen = ({ onRetry }) => (
  <View style={styles.offlineContainer}>
    <LinearGradient colors={['#0D0D0F', '#121214']} style={StyleSheet.absoluteFill} />
    <BlurView intensity={80} tint="dark" style={styles.offlineBlurBox}>
      <View style={styles.offlineIconRing}>
        <Ionicons name="wifi-outline" size={56} color={THEME.accentGold} />
      </View>
      <Text style={styles.offlineTitle}>Mất kết nối</Text>
      <Text style={styles.offlineText}>Vui lòng kiểm tra lại mạng Wi-Fi hoặc dữ liệu di động.</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
        <LinearGradient colors={['#D4AF37', '#B8960C']} style={StyleSheet.absoluteFillObject} borderRadius={22} />
        <Ionicons name="refresh" size={18} color={THEME.bg} style={{ marginRight: 6 }} />
        <Text style={styles.retryButtonText}>THỬ LẠI</Text>
      </TouchableOpacity>
    </BlurView>
  </View>
);

export default function WebViewScreen() {
  const insets = useSafeAreaInsets();
  const { activeUrl } = useContext(MenuContext);
  const webviewRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [currentUrl, setCurrentUrl] = useState(activeUrl);
  const [showUrlSheet, setShowUrlSheet] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const isBarVisible = useRef(true);
  const scrollTimer = useRef(null);

  // Animations
  const topBarAnim = useRef(new Animated.Value(0)).current;
  const bottomBarAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;

  const showBars = useCallback((immediate) => {
    if (isBarVisible.current && !immediate) return;
    isBarVisible.current = true;
    Animated.parallel([
      Animated.timing(topBarAnim, { toValue: 0, duration: immediate ? 0 : 200, useNativeDriver: true }),
      Animated.timing(bottomBarAnim, { toValue: 0, duration: immediate ? 0 : 200, useNativeDriver: true })
    ]).start();
  }, [topBarAnim, bottomBarAnim]);

  const hideBars = useCallback(() => {
    if (!isBarVisible.current) return;
    isBarVisible.current = false;
    Animated.parallel([
      Animated.timing(topBarAnim, { toValue: -90, duration: 250, useNativeDriver: true }),
      Animated.timing(bottomBarAnim, { toValue: 130, duration: 250, useNativeDriver: true })
    ]).start();
  }, [topBarAnim, bottomBarAnim]);

  useEffect(() => {
    checkNetwork();
  }, [activeUrl]);

  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected);
    } catch { setIsOffline(false); }
  };

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data._type === 'scroll') {
        if (isFullScreen) return;
        if (data.direction === 'down' && data.scrollY > 50) hideBars();
        else if (data.direction === 'up') showBars();
        if (data.scrollY < 10) showBars(true);
      }
    } catch {}
  };

  const onNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    if (navState.title) setPageTitle(navState.title);
    try {
      const urlObj = new URL(navState.url);
      setCurrentDisplayUrl(urlObj.hostname);
    } catch {
      setCurrentDisplayUrl(navState.url.substring(0, 30));
    }
  };
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState('');

  const onLoadEnd = () => {
    webviewRef.current?.injectJavaScript(SCROLL_SCRIPT);
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(progressOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const onLoadStart = () => {
    progressOpacity.setValue(1);
    progressAnim.setValue(0);
  };

  const onLoadProgress = ({ nativeEvent }) => {
    const p = nativeEvent.progress;
    setProgress(p);
    Animated.timing(progressAnim, { toValue: p, duration: 100, useNativeDriver: false }).start();
  };

  const handleBack = () => { if (canGoBack && webviewRef.current) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); webviewRef.current.goBack(); }};
  const handleForward = () => { if (canGoForward && webviewRef.current) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); webviewRef.current.goForward(); }};
  const handleReload = () => { if (webviewRef.current) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); webviewRef.current.reload(); }};
  const handleStop = () => { if (webviewRef.current) { webviewRef.current.stopLoading(); }};
  const handleHome = () => { if (webviewRef.current) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); webviewRef.current.injectJavaScript(`window.location.href='${activeUrl}';true;`); }};

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await Share.share({ message: currentUrl }); } catch {}
  };

  const handleOpenExternal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(currentUrl).catch(() => {});
    setShowUrlSheet(false);
  };

  const handleCopy = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowUrlSheet(false);
    Share.share({ message: currentUrl });
  };

  const toggleFullScreen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFullScreen(!isFullScreen);
    if (!isFullScreen) hideBars(); else showBars(true);
    setShowUrlSheet(false);
  };

  const isLoading = progress < 1 && progress > 0;
  const displayTitle = pageTitle || currentDisplayUrl || 'Trang web';
  const isSecure = currentUrl.startsWith('https://');

  const renderPill = () => (
    <Animated.View style={[
      styles.pillWrapper,
      { transform: [{ translateY: topBarAnim }] }
    ]}>
      <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setShowUrlSheet(true); }} activeOpacity={0.9}>
        <BlurView intensity={85} tint="dark" style={styles.addressPill}>
          <LinearGradient colors={['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.1)']} style={StyleSheet.absoluteFillObject} borderRadius={22} />
          <View style={[styles.lockBadge, { backgroundColor: isSecure ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)' }]}>
            <Ionicons name="lock-closed" size={10} color={isSecure ? '#4ADE80' : THEME.textSub} />
          </View>
          <Text style={styles.pillTitle} numberOfLines={1}>{displayTitle}</Text>
          <Ionicons name="chevron-down" size={14} color={THEME.textSub} style={{ marginLeft: 4 }} />
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderProgress = () => (
    <Animated.View style={[styles.progressTrack, { opacity: progressOpacity }]}>
      <Animated.View style={[styles.progressBar, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}>
        <LinearGradient colors={['#D4AF37', '#FFAA00', '#D4AF37']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </Animated.View>
  );

  const renderToolbar = () => (
    <Animated.View style={[styles.toolbarWrap, { transform: [{ translateY: bottomBarAnim }] }]}>
      <BlurView intensity={90} tint="dark" style={styles.toolbar}>
        <TouchableOpacity style={[styles.toolBtn, !canGoBack && styles.toolBtnDisabled]} onPress={handleBack} disabled={!canGoBack}>
          <Ionicons name="chevron-back" size={22} color={canGoBack ? THEME.textLight : '#374151'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolBtn, !canGoForward && styles.toolBtnDisabled]} onPress={handleForward} disabled={!canGoForward}>
          <Ionicons name="chevron-forward" size={22} color={canGoForward ? THEME.textLight : '#374151'} />
        </TouchableOpacity>

        <View style={styles.toolDivider} />

        <TouchableOpacity style={styles.toolBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={THEME.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={handleOpenExternal}>
          <Ionicons name="open-outline" size={20} color={THEME.textLight} />
        </TouchableOpacity>

        <View style={styles.toolDivider} />

        {isLoading ? (
          <TouchableOpacity style={styles.toolBtn} onPress={handleStop}>
            <Ionicons name="close-circle" size={22} color={THEME.accentRed} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.toolBtn} onPress={handleReload}>
            <Ionicons name="refresh" size={20} color={THEME.textLight} />
          </TouchableOpacity>
        )}
      </BlurView>
    </Animated.View>
  );

  const renderUrlSheet = () => (
    <Animated.View style={[StyleSheet.absoluteFill, { display: showUrlSheet ? 'flex' : 'none' }]}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowUrlSheet(false)}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View style={styles.sheetContent}>
        <BlurView intensity={90} tint="dark" style={styles.sheetCard}>
          <View style={styles.sheetHeader}>
            <Ionicons name="globe-outline" size={20} color={THEME.accentGold} />
            <Text style={styles.sheetTitle} numberOfLines={2}>{displayTitle}</Text>
          </View>
          <Text style={styles.sheetUrl} numberOfLines={2}>{currentUrl}</Text>
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.sheetAction} onPress={handleCopy}>
              <View style={[styles.sheetActionIcon, { backgroundColor: 'rgba(52,152,219,0.15)' }]}>
                <Ionicons name="copy-outline" size={22} color={THEME.accentBlue} />
              </View>
              <Text style={styles.sheetActionLabel}>Sao chép</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetAction} onPress={handleOpenExternal}>
              <View style={[styles.sheetActionIcon, { backgroundColor: 'rgba(46,204,113,0.15)' }]}>
                <Ionicons name="open-outline" size={22} color={THEME.accentGreen} />
              </View>
              <Text style={styles.sheetActionLabel}>Trình duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetAction} onPress={() => { setShowUrlSheet(false); handleReload(); }}>
              <View style={[styles.sheetActionIcon, { backgroundColor: 'rgba(212,175,55,0.15)' }]}>
                <Ionicons name="refresh" size={22} color={THEME.accentGold} />
              </View>
              <Text style={styles.sheetActionLabel}>Tải lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetAction} onPress={toggleFullScreen}>
              <View style={[styles.sheetActionIcon, { backgroundColor: 'rgba(155,89,182,0.15)' }]}>
                <Ionicons name={isFullScreen ? "contract-outline" : "expand-outline"} size={22} color="#9B59B6" />
              </View>
              <Text style={styles.sheetActionLabel}>{isFullScreen ? 'Thoát' : 'Toàn màn'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sheetClose} onPress={() => setShowUrlSheet(false)}>
            <Text style={styles.sheetCloseText}>Đóng</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Animated.View>
  );

  if (isOffline) {
    return <OfflineScreen onRetry={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); checkNetwork(); }} />;
  }

  return (
    <View style={styles.container}>
      {renderProgress()}
      {renderPill()}

      <WebView
        ref={webviewRef}
        source={{ uri: activeUrl }}
        style={styles.webview}
        onLoadProgress={onLoadProgress}
        onNavigationStateChange={onNavigationStateChange}
        onMessage={onMessage}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}
        bounces={true}
        onShouldStartLoadWithRequest={(req) => {
          if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) { Linking.openURL(req.url).catch(() => {}); return false; }
          return true;
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        renderError={() => { setIsOffline(true); return null; }}
        injectedJavaScript={SCROLL_SCRIPT}
      />

      {renderToolbar()}
      {renderUrlSheet()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // ─── Progress ───
  progressTrack: { position: 'absolute', top: Platform.OS === 'ios' ? 47 : 0, left: 0, right: 0, height: 2.5, zIndex: 999 },
  progressBar: { height: '100%', overflow: 'hidden' },

  // ─── Address Pill ───
  pillWrapper: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 8, alignSelf: 'center', zIndex: 100 },
  addressPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,20,24,0.85)', borderRadius: 22, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, overflow: 'hidden', minWidth: SCREEN_W * 0.55, maxWidth: SCREEN_W * 0.8 },
  lockBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  pillTitle: { fontSize: 13, fontWeight: '600', color: THEME.textLight, flex: 1, textAlign: 'center' },

  // ─── Toolbar ───
  toolbarWrap: { position: 'absolute', bottom: TOOLBAR_BOTTOM, alignSelf: 'center', zIndex: 50 },
  toolbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,20,24,0.88)', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 28, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 12, overflow: 'hidden' },
  toolBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  toolBtnDisabled: { opacity: 0.3 },
  toolDivider: { width: 1, height: 18, backgroundColor: THEME.border, marginHorizontal: 4 },

  // ─── WebView ───
  webview: { flex: 1, backgroundColor: THEME.bg, marginTop: 0 },

  // ─── Offline ───
  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.bg, padding: 24 },
  offlineBlurBox: { padding: 32, borderRadius: 28, alignItems: 'center', borderWidth: 1, borderColor: THEME.border, overflow: 'hidden', width: '100%', maxWidth: 320 },
  offlineIconRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', marginBottom: 16 },
  offlineTitle: { fontSize: 20, fontWeight: '900', color: THEME.textLight, marginBottom: 8, letterSpacing: 1 },
  offlineText: { fontSize: 14, color: THEME.textSub, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  retryButton: { height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, overflow: 'hidden' },
  retryButtonText: { color: THEME.bg, fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  // ─── URL Sheet ───
  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 },
  sheetContent: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 201, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  sheetCard: { backgroundColor: 'rgba(28,28,32,0.95)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.5, shadowRadius: 25, elevation: 20, overflow: 'hidden' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: THEME.textLight, flex: 1 },
  sheetUrl: { fontSize: 12, color: THEME.textSub, marginBottom: 20, lineHeight: 18 },
  sheetActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  sheetAction: { alignItems: 'center' },
  sheetActionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  sheetActionLabel: { fontSize: 11, color: THEME.textSub, fontWeight: '600' },
  sheetClose: { alignItems: 'center', paddingVertical: 8 },
  sheetCloseText: { fontSize: 14, fontWeight: '700', color: THEME.textSub },
});
