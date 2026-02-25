import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../store/AppStore";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import CreateLeadsPage from "../pages/CreateLeadsPage";

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAppReady, isAuthenticated } = useAppStore();

  // DB check ho raha hai — kuch mat dikhao
  if (!isAppReady) return null; // ✅ Jab tak DB check nahi hua, kuch mat dikhao

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Logged in → sirf ye screens dikhao
          <>
            <Stack.Screen name="Dashboard" component={DashboardPage} />
            <Stack.Screen name="CreateLeads" component={CreateLeadsPage} />
          </>
        ) : (
          // Logged out → sirf Login dikhao
          <Stack.Screen name="Login" component={LoginPage} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
