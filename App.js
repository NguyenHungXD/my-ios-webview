import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Platform, View, ActivityIndicator, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

export default function App() {
  const LoadingIndicatorView = () => {
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('./assets/Logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator color="#007AFF" size="large" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView 
        source={{ uri: 'https://thanhhungqs.xyz/manager/index.php' }} 
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={LoadingIndicatorView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
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
