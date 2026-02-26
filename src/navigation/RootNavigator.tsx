/**
 * RootNavigator — FIXED
 * Fix: VideoCamera screen stub added (ValuationPage navigate karta hai)
 */

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../store/AppStore";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import CreateLeadsPage from "../pages/CreateLeadsPage";
import MyTasksPage from "../pages/MyTaskScreen";
import ValuationPage from "../pages/ValuationPage";
import ValuationListScreen from "../pages/ValuationListScreen";
import CameraScreen from "../components/CameraScreen";

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: "#1181B2" },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "bold" as const },
};

const AppNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="Dashboard" component={DashboardPage} />
    <Stack.Screen name="CreateLeads" component={CreateLeadsPage} />
    <Stack.Screen name="MyTasks" component={MyTasksPage} />
    <Stack.Screen
      name="ValuationList"
      component={ValuationListScreen}
      options={{ title: 'Valuations' }}
    />
    <Stack.Screen name="Valuate" component={ValuationPage} />
    <Stack.Screen
      name="Camera"
      component={CameraScreen}
      options={{ title: 'Take Photo', headerShown: false }}
    />
    {/* ✅ FIX: VideoCamera → CameraScreen se handle (ValuationPage navigate karta hai) */}
    <Stack.Screen
      name="VideoCamera"
      component={CameraScreen}
      options={{ title: 'Record Video', headerShown: false }}
    />
  </Stack.Navigator>
);

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="Login" component={LoginPage} />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const { isAppReady, isAuthenticated } = useAppStore();
  if (!isAppReady) return null;

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};