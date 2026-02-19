/**
 * KwikCheck - Offline/Online Lead Management App
 * 
 * FLOW:
 * 1. Initialize database (SQLite) ✅
 * 2. Check if user is logged in (AsyncStorage + Database) ✅
 * 3. Show Login screen if not logged in ✅
 * 4. Show Dashboard if logged in ✅
 * 5. All data works OFFLINE (cached in database) ✅
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase, getDatabaseStatus } from './src/database';
import { useAuthStore } from './src/features/auth/auth.store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { COLORS } from './src/constants/Colors';

/**
 * Main App Component
 */
export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Check if user is logged in (from AsyncStorage)
  const { checkLogin } = useAuthStore();

  /**
   * Step 1: Initialize database
   * This must happen BEFORE rendering any screens
   */
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('[APP] 🚀 Starting app initialization...');

        // Initialize database (creates tables, runs migrations)
        await initializeDatabase();
        console.log('[APP] ✅ Database initialized');

        // Verify database status
        const status = await getDatabaseStatus();
        console.log('[APP] Database status:', status);

        // Check if user was previously logged in
        await checkLogin();
        console.log('[APP] ✅ User session checked');

        setDbReady(true);
      } catch (error) {
        console.error('[APP] ❌ Initialization failed:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setDbError(errorMsg);
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, [checkLogin]);

  // ========== LOADING STATE ==========
  if (isInitializing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontSize: 14 }}>
              Initializing app...
            </Text>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // ========== ERROR STATE ==========
  if (dbError) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16 }}>
            <Text style={{ color: COLORS.error, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
              Failed to initialize app
            </Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 12, textAlign: 'center', fontSize: 14 }}>
              {dbError}
            </Text>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // ========== READY STATE ==========
  if (!dbReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


