import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../store/AppStore";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import CreateLeadsPage from "../pages/CreateLeadsPage";
import MyTasksPage from "../pages/MyTaskScreen";
import ValuationPage from "../pages/ValuationPage";
const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAppReady, isAuthenticated } = useAppStore();

  // DB check ho raha hai — kuch mat dikhao
  if (!isAppReady) return null; // ✅ Jab tak DB check nahi hua, kuch mat dikhao

  return (
    <NavigationContainer>
      <Stack.Navigator 
      screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: "#1181B2",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    }}
      >
        {isAuthenticated ? (
          // Logged in → sirf ye screens dikhao
          <>
            <Stack.Screen name="Dashboard" component={DashboardPage} />
            <Stack.Screen name="CreateLeads" component={CreateLeadsPage} />
            <Stack.Screen name="MyTasks" component={MyTasksPage} />
            <Stack.Screen name="Valuate" component={ValuationPage} />
          </>
        ) : (
          // Logged out → sirf Login dikhao
          <Stack.Screen name="Login" component={LoginPage} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
