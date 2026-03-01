import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useAppStore } from '../store/AppStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
const {logoutUser} = useAppStore();
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            await logoutUser();
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={styles.bottomDrawerSection}>
        <DrawerItem
          label="Logout"
          onPress={handleLogout}
          icon={({ size }) => (
            <MaterialCommunityIcons
              name="logout"
              size={size}
              color="#d32f2f"
            />
          )}
          labelStyle={styles.logoutLabel}
        />

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomDrawerSection: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  logoutLabel: {
    color: "#d32f2f",
    fontSize: 15,
    fontWeight: "600",
  },


});

export default CustomDrawerContent;
