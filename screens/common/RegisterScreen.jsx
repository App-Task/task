import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { registerUser } from "../../services/auth";

const { width } = Dimensions.get("window");

export default function RegisterScreen({ navigation, route }) {
  const { t } = useTranslation();
  const role = route?.params?.role || "client";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert(t("register.missingFields"), t("register.fillAllFields"));
      return;
    }

    if (password !== confirm) {
      Alert.alert(t("register.mismatchTitle"), t("register.passwordMismatch"));
      return;
    }

    try {
      await registerUser({ name, email, password });
      navigation.replace("Login", { role });
    } catch (err) {
      Alert.alert(t("register.errorTitle"), err.message || "Something went wrong");
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

        <Image
          source={require("../../assets/images/1.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>{t("register.title")}</Text>

        <TextInput
          style={styles.input}
          placeholder={t("register.fullName")}
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          maxLength={55} // 👈 Add this line

        />

        <TextInput
          style={styles.input}
          placeholder={t("register.email")}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t("register.password")}
            placeholderTextColor="#999"
            secureTextEntry={secure1}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setSecure1(!secure1)}
            style={styles.eyeWrapper}
          >
            <Ionicons name={secure1 ? "eye-off" : "eye"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t("register.confirmPassword")}
            placeholderTextColor="#999"
            secureTextEntry={secure2}
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity
            onPress={() => setSecure2(!secure2)}
            style={styles.eyeWrapper}
          >
            <Ionicons name={secure2 ? "eye-off" : "eye"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>{t("register.registerBtn")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login", { role })}>
          <Text style={styles.loginRedirect}>
            {t("register.alreadyHave")} <Text style={styles.loginLink}>{t("register.loginLink")}</Text>
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
    marginBottom: 10,
  },
  backBtn: {
    padding: 10,
  },
  logo: {
    width: width * 0.3,
    height: width * 0.3,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontFamily: "InterBold",
    color: "#213729",
    marginBottom: 30,
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
    marginBottom: 18,
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
  loginRedirect: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    color: "#213729",
    fontFamily: "InterBold",
  },
});
