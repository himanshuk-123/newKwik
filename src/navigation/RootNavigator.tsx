/**
 * RootNavigator — FIXED
 * Fix: VideoCamera screen stub added (ValuationPage navigate karta hai)
 */

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../store/AppStore";
import LoginPage from "../pages/LoginPage";
import AppNavigator from "./AppNavigator";
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: "#1181B2" },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "bold" as const },
};


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

export default RootNavigator;