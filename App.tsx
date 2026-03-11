/**
 * App.tsx
 * Fix: SyncManager ke saath syncPendingLeads bhi trigger hota hai
 */

import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { initDb } from './src/database';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppStore } from './src/store/AppStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SyncManager } from './src/services/Syncmanager';
import { syncPendingLeads, resetStuckPendingLeads } from './src/services/syncService';
import { submitCreateLeadApi } from './src/services/CreateLead';
import NetInfo from '@react-native-community/netinfo';
import SplashScreen from './src/components/SplashScreen';
import 'react-native-reanimated';

const App = () => {
  const { loadStoredUser, isAppReady, user } = useAppStore();

  React.useEffect(() => {
    const bootstrap = async () => {
      try {
        await initDb();
        await loadStoredUser();
        // Pre-fetch dashboard so data is ready when Dashboard renders
        const { isAuthenticated: authed, fetchDashboard: fetch } = useAppStore.getState();
        if (authed) {
          await fetch();
        }
      } catch (error) {
        console.error('[App] Bootstrap failed:', error);
      } finally {
        // Splash hatao — sab load ho gaya
        useAppStore.setState({ isAppReady: true });
      }
    };
    bootstrap();
  }, []);

  // ✅ SyncManager — images upload
  React.useEffect(() => {
    if (user?.token) {
      SyncManager.init(user.token);
      console.log('[App] SyncManager initialized');
    }
    return () => { SyncManager.destroy(); };
  }, [user]);

  // ✅ FIX: Pending leads sync — online aane par
  React.useEffect(() => {
    if (!user?.token) return;

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      if (isOnline && user?.token) {
        console.log('[App] Online — syncing pending leads...');
        await resetStuckPendingLeads();
        await syncPendingLeads(user.token, (payload) =>
          submitCreateLeadApi(user.token!, payload)
        );
      }
    });

    // App open hone par bhi ek baar check karo
    NetInfo.fetch().then(async (state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      if (isOnline && user?.token) {
        await resetStuckPendingLeads();
        await syncPendingLeads(user.token, (payload) =>
          submitCreateLeadApi(user.token!, payload)
        );
      }
    });

    return () => { unsubscribe(); };
  }, [user?.token]);

  if (!isAppReady) {
    return <SplashScreen />;
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
  );
};

export default App;