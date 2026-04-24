import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <WebView 
        source={{ uri: 'https://thanhhungqs.xyz/manager/index.php' }} 
        style={styles.webview}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  webview: {
    flex: 1,
  },
});
