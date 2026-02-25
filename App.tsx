import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initDb } from './src/database';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppStore } from './src/store/AppStore';

const App = () => {
  const { loadStoredUser, isAppReady } = useAppStore();

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

  return <RootNavigator />;
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