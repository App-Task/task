import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { loginUser } from "../../services/auth";
import { storeToken } from "../../services/authStorage";
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get("window");

export default function LoginScreen({ navigation, route }) {
  const { t } = useTranslation();
  const role = route?.params?.role || "client";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("login.missingTitle"), t("login.missingFields"));
      return;
    }

    try {
      const response = await loginUser({ email, password });

      if (response?.token && response?.user) {
        console.log("✅ userId being saved:", response.user.id); // ✅ Use .id, not ._id

        // ✅ Save only if valid ObjectId
        if (response.user.id && String(response.user.id).length === 24) {
          await storeToken(response.token);
          
          console.log("🔥 JWT Token:", response.token);


          await SecureStore.setItemAsync("userId", String(response.user.id)); // ✅ Corrected
          await SecureStore.setItemAsync("userName", String(response.user.name));
        } else {
          console.warn("⚠️ Invalid userId format. Skipping SecureStore save.");
        }



        navigation.replace(role === "tasker" ? "TaskerHome" : "ClientHome");
      } else {
        throw new Error(t("login.failedGeneric"));
      }
    } catch (err) {
      console.log("❌ Login Error:", err.message);
      Alert.alert(t("login.failedTitle"), err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrapper}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#213729" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{t("login.welcomeBack")}</Text>

        <TextInput
          style={styles.input}
          placeholder={t("login.email")}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t("login.password")}
            placeholderTextColor="#999"
            secureTextEntry={secure}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.eyeWrapper}>
            <Ionicons name={secure ? "eye-off" : "eye"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <Text style={styles.forgot}>{t("login.forgotPassword")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>{t("login.loginBtn")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register", { role })}>
          <Text style={styles.register}>
            {t("login.noAccount")}{" "}
            <Text style={styles.registerLink}>{t("login.registerLink")}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  topBar: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  backBtn: {
    padding: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: "InterBold",
    color: "#213729",
    marginBottom: 40,
  },
  input: {
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginBottom: 18,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  eyeWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  forgot: {
    alignSelf: "flex-end",
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 14,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  register: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
  },
  registerLink: {
    color: "#213729",
    fontFamily: "InterBold",
  },
});
