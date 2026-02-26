import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppStore } from "../store/AppStore";
import { RootStackParamList } from "../types/navigation";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import CreateLeadsPage from "../pages/CreateLeadsPage";
import MyTasksPage from "../pages/MyTaskScreen";
import ValuationPage from "../pages/ValuationPage";
import ValuationListScreen from "../pages/ValuationListScreen";
import CameraScreen from "../components/CameraScreen";
const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
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
        options={{ title: 'Take Photo' }}
      />
    </Stack.Navigator>
  );
}

const AuthNavigator = () => {
  return (
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
      <Stack.Screen name="Login" component={LoginPage} />
    </Stack.Navigator>
  );
}
export const RootNavigator = () => {
  const { isAppReady, isAuthenticated } = useAppStore();

  // DB check ho raha hai — kuch mat dikhao
  if (!isAppReady) return null; // ✅ Jab tak DB check nahi hua, kuch mat dikhao

  return (
    <NavigationContainer>
        {isAuthenticated ? (
          // Logged in → sirf ye screens dikhao
          <AppNavigator/>
        ) : (
          // Logged out → sirf Login dikhao
          <AuthNavigator/>
        )}
    </NavigationContainer>
  );
};
