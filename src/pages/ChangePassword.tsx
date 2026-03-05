import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ToastAndroid,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../constants/Colors";
import { apiCall } from "../services/ApiClient";
import { useAppStore } from "../store/AppStore";

interface ChangePassResponse {
  Error: string;
  MESSAGE: string;
}

export default function ChangePassword() {
  const { user } = useAppStore();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
      setErrorText("Passwords do not match");
    } else {
      setErrorText("");
    }
  }, [newPassword, confirmPassword]);

  const handleChangePassword = async () => {
    try {
      if (!oldPassword || !newPassword || !confirmPassword) {
        setErrorText("All fields are required");
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorText("Passwords do not match");
        return;
      }

      if (!user?.token) {
        setErrorText("Session expired. Please login again.");
        return;
      }

      setIsLoading(true);
      setErrorText("");

      const response = await apiCall<ChangePassResponse>(
        "ChangePass",
        user.token,
        {
          Password: newPassword,
          oldPassword: oldPassword,
        }
      );

      if (
        response?.Error !== "0" &&
        !response?.MESSAGE?.toLowerCase().includes("success")
      ) {
        setErrorText(response?.MESSAGE || "Failed to change password");
        ToastAndroid.show(
          response?.MESSAGE || "Failed to change password",
          ToastAndroid.LONG
        );
        setIsLoading(false);
        return;
      }

      ToastAndroid.show("Password changed successfully", ToastAndroid.LONG);
      navigation.goBack();
    } catch (error: any) {
      console.error("[ChangePassword] Error:", error);
      setErrorText(error?.message || "Something went wrong");
      ToastAndroid.show("Something went wrong", ToastAndroid.LONG);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          value={oldPassword}
          secureTextEntry
          placeholder="Old Password*"
          placeholderTextColor="#9ca3af"
          onChangeText={setOldPassword}
        />
        <TextInput
          style={styles.input}
          value={newPassword}
          placeholder="New Password*"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          secureTextEntry
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          value={confirmPassword}
          placeholder="Confirm Password*"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          autoCapitalize="none"
          onChangeText={setConfirmPassword}
        />
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled
        keyboardVerticalOffset={Platform.select({ ios: 80, android: 50 })}
      >
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            onPress={handleChangePassword}
            style={styles.btnContainer}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.btnText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    backgroundColor: "white",
  },
  formContainer: {
    flex: 1,
  },
  input: {
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    marginVertical: 7,
    fontSize: 16,
  },
  buttonWrapper: {
    height: 50,
    marginBottom: 20,
  },
  btnContainer: {
    backgroundColor: COLORS.AppTheme.primary,
    justifyContent: "center",
    alignItems: "center",
    height: 48,
    borderRadius: 8,
  },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    marginTop: 5,
    marginLeft: 5,
  },
});
