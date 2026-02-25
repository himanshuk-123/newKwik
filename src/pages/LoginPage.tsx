import {
  Linking,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ToastAndroid,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import React, { useState } from "react";
import { COLORS } from "../constants/Colors";
import { HeroImg } from "../assets";
import {useNavigation} from '@react-navigation/native';
import { useAppStore } from "../store/AppStore";
import { LoginRequest } from "../types/api";
type Props = {};

const LoginPage = (props: Props) => {
  const navigation = useNavigation<any>();
  const { loginUser, isLoading } = useAppStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const HandleNativeClick = (type: "tel" | "mail") => {
    switch (type) {
      case "tel":
        Linking.openURL("tel:0000000000");
        break;

      case "mail":
        Linking.openURL("mailto:support@kwikcheck.in");
        break;

      default:
        break;
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      ToastAndroid.show("Please enter username and password", ToastAndroid.SHORT);
      return;
    }

    try {
      const credentials: LoginRequest = {
        UserName: username,
        Pass: password,
        IMEI: 'unknown',
        Version: '6',
        IP: '',
        Location: null,
      };
      await loginUser(credentials);
      // Navigation is handled automatically by RootNavigator listening to auth state
      ToastAndroid.show("Login Successful", ToastAndroid.SHORT);
    } catch (error: any) {
      // Error handling is delegated to store's error state, but we show toast here for UX
      ToastAndroid.show(error.message || "Login failed", ToastAndroid.LONG);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.flexCenter}>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>
              <Text
                style={[
                  styles.titleLarge,
                  { color: COLORS.AppTheme.primary },
                ]}
              >
                K
              </Text>
              wik
              <Text
                style={[
                  styles.titleLarge,
                  { color: COLORS.AppTheme.primary },
                ]}
              >
                C
              </Text>
              heck
            </Text>
            <Text style={styles.subtitleText}>
              {`The raise and price of \t
your wheels`}
            </Text>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={HeroImg}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#6b7280" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Enter UserName"
                placeholderTextColor="#9ca3af"
                editable={!isLoading}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6b7280" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Enter Pass"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                editable={!isLoading}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#6b7280"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>
              Forgot Password ?
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>{isLoading ? "Logging in..." : "Login"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footerText}>
        <Text
          style={[
            styles.footerContactText,
            { color: COLORS.AppTheme.primary },
          ]}
        >
          For any issues contact{" "}
        </Text>

        <TouchableOpacity onPress={() => HandleNativeClick("tel")}>
          <Text
            style={[
              styles.footerContactText,
              { color: COLORS.textSecondary },
            ]}
          >
            0000000000
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => HandleNativeClick("mail")}>
          <Text
            style={[
              styles.footerContactText,
              { color: COLORS.textSecondary },
            ]}
          >
            support@kwikcheck.in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginPage;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flexCenter: {
    justifyContent: "center",
    alignItems: "center",
    height: "90%",
    position: "relative",
  },
  contentContainer: {
    width: "80%",
    gap: 24,
  },
  titleContainer: {
    alignItems: "center",
  },
  titleText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  titleLarge: {
    fontSize: 36,
  },
  subtitleText: {
    fontSize: 14,
    textTransform: "uppercase",
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  imageContainer: {
    paddingBottom: 32,
    height: 192,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    width: 300,
    height: 160,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#000",
  },
  loginButton: {
    backgroundColor: COLORS.AppTheme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footerText: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    paddingBottom: 20,
  },
  footerContactText: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
