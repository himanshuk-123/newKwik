import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet ,Platform,StatusBar} from 'react-native';
import { initDb } from './src/database';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppStore } from './src/store/AppStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context'
import { SyncManager } from './src/services/Syncmanager';
import 'react-native-reanimated';

const App = () => {
  const { loadStoredUser, isAppReady, user } = useAppStore();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initDb();        // DB initialize + tables create karo
        await loadStoredUser(); // User check karo — sets isAppReady = true
      } catch (error) {
        console.error('[App] Bootstrap failed:', error);
        // loadStoredUser catch block sets isAppReady = true even on error
        // so app won't hang on spinner
      }
    };
    bootstrap();
  }, []);

  // ✅ SyncManager init karo jab user load ho jaaye
  useEffect(() => {
    if (user?.token) {
      SyncManager.init(user.token);
      console.log('[App] SyncManager initialized with user token');
    }
    return () => {
      // Cleanup on unmount
      SyncManager.destroy();
    };
  }, [user]);

  // ✅ FIX: Don't render navigator until DB is ready + user check is done
  // Without this: navigator renders with isAuthenticated = false even for logged-in users
  // causing a flash of login screen or wrong initial route
  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {Platform.OS === 'android' && (
        <View style={{ height: StatusBar.currentHeight, backgroundColor: '#1181B2' }} />
      )}
      <SafeAreaView style={{ flex: 1 }}>
        <RootNavigator />
      </SafeAreaView>
    </GestureHandlerRootView>
  )
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default App;