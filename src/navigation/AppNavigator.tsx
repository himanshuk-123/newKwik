import React, { useEffect } from 'react';
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { requestAllPermissions } from '../services/PermissionService';
import CustomDrawerContent from '../components/CustomDrawerContent';
import DashboardPage from "../pages/DashboardPage";
import CreateLeadsPage from "../pages/CreateLeadsPage";
import MyTasksPage from "../pages/MyTaskScreen";
import ValuationPage from "../pages/ValuationPage";
import ValuationListScreen from "../pages/ValuationListScreen";
import CameraScreen from "../components/CameraScreen";
import VideoRecorderScreen from '../components/VideoRecorderScreen';
import VehicleDetails from '../pages/VehicleDetails';
import LeadsInProgress from '../pages/LeadsInProgress';
import CompletedLeads from '../pages/CompletedLeads';
import QCCompletedLeads from '../pages/QcCompletedLeads';
import QCHoldLeads from '../pages/QCHoldLeads';
import QCLeads from '../pages/QcLeads';
import ValuationCompletedLeadsPage from '../pages/ValuationCompletedLeadsPage';
import Account from '../pages/Account';
import ChangePassword from '../pages/ChangePassword';
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

/* -------------------- DRAWER -------------------- */

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
      <Drawer.Screen name="Dashboard" component={DashboardPage} />
      <Drawer.Screen name="CompletedLeads" component={CompletedLeads} />
      <Drawer.Screen name="Account" component={Account} />
    </Drawer.Navigator>
  )};
/* -------------------- APP STACK -------------------- */
const AppNavigator = () => {
  // ✅ Permissions yahan request karo — Activity guaranteed attached hai
  useEffect(() => {
    requestAllPermissions().catch(e =>
      console.warn('[AppNavigator] Permission request failed:', e)
    );
  }, []);

  return (
  <Stack.Navigator screenOptions={{ 
    headerShown: true,
    headerStyle: { backgroundColor: "#1181B2" },
    headerTintColor: "#fff",
    headerTitleStyle: { fontWeight: "bold" as const },
  }}>
    <Stack.Screen name="MainApp" component={DrawerNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="CreateLeads" component={CreateLeadsPage} />
    <Stack.Screen name="MyTasks" component={MyTasksPage} />
    <Stack.Screen name="LeadsInProgress" component={LeadsInProgress} />
    <Stack.Screen name="QCLeads" component={QCLeads} />
    <Stack.Screen name="QCHoldLeads" component={QCHoldLeads} />
    <Stack.Screen name="QCCompletedLeads" component={QCCompletedLeads} />
    <Stack.Screen name="ValuationCompletedLeads" component={ValuationCompletedLeadsPage} />
    <Stack.Screen
      name="ValuationList"
      component={ValuationListScreen}
      options={{ title: 'Valuations' }}
    />
    <Stack.Screen name="Valuate" component={ValuationPage} />
    <Stack.Screen
      name="VehicleDetails"
      component={VehicleDetails}
      options={{ title: 'Vehicle Details', headerShown: false }}
    />
    <Stack.Screen
      name="Camera"
      component={CameraScreen}
      options={{ title: 'Take Photo', headerShown: false }}
    />  
    {/* ✅ VIDEO: Dedicated VideoRecorderScreen — 60s mandatory, landscape, auto-stop */}
    <Stack.Screen
      name="VideoRecorder"
      component={VideoRecorderScreen}
      options={{ title: 'Record Video', headerShown: false }}
    />
    <Stack.Screen
      name="ChangePassword"
      component={ChangePassword}
      options={{ title: 'Change Password' }}
    />
  </Stack.Navigator>
  );
};

export default AppNavigator;