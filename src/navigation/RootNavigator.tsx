import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../features/auth/auth.store";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import CreateLeadsPage from "../pages/CreateLeadsPage";

const Stack = createNativeStackNavigator();

/**
 * Root Navigation
 * 
 * LOGIC:
 * - If user is logged in → show Dashboard + CreateLeads
 * - If user is NOT logged in → show Login
 * - Auth state is persisted in AsyncStorage + Database
 */

export const RootNavigator = () => {
  const { user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        {!user ? (
          // Auth Stack (Login)
          <Stack.Screen name="Login" component={LoginPage} />
        ) : (
          // App Stack (Dashboard, CreateLeads)
          <>
            <Stack.Screen name="Dashboard" component={DashboardPage} />
            <Stack.Screen
              name="CreateLeads"
              component={CreateLeadsPage}
              options={{
                animationEnabled: true,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
