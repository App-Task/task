import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resetPassword } from "../../services/auth";
import { useTranslation } from "react-i18next";

export default function ForgotPasswordReset({ navigation, route }) {
  const emailFromRoute = route?.params?.email || "";
  const roleFromRoute = route?.params?.role || "client";
  const [email, setEmail] = useState(emailFromRoute);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleReset = async () => {
    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return Alert.alert(t("common.missingInfo"), t("common.missingFields"));
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert(t("common.mismatch"), t("common.passwordsDoNotMatch"));
    }

    const strongPw = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPw.test(newPassword)) {
      return Alert.alert(
        "Weak Password",
        "Password must include at least 8 characters, one uppercase letter, and one number."
      );
    }

    setLoading(true);
    try {
      console.log(`🔍 Attempting password reset for email: ${email}, role: ${roleFromRoute}`);
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword, role: roleFromRoute });
      Alert.alert(t("common.success"), t("common.passwordResetSuccess"));
      navigation.replace("Login", { role: roleFromRoute });
    } catch (err) {
      console.error("❌ Reset Password Error:", err.message);
      console.error("❌ Error details:", err.response?.data);
      
      let errorMessage = t("common.resetFailed");
      if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert(t("common.errorTitle"), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#215432" />
      </TouchableOpacity>

      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to your email and create a new password.
      </Text>

      <Text style={styles.label}>Email address</Text>
      <TextInput
  style={[styles.input, styles.disabledInput]}
  value={email}
  editable={false}
  selectTextOnFocus={false}
/>


      <Text style={styles.label}>6-digit reset code</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 123456"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <Text style={styles.label}>New password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Must include capital letter & number"
          secureTextEntry={!showNewPassword}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity
          style={styles.eyeWrapper}
          onPress={() => setShowNewPassword(!showNewPassword)}
        >
          <Ionicons
            name={showNewPassword ? "eye" : "eye-off"}
            size={20}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Confirm new password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Repeat your new password"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          style={styles.eyeWrapper}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye" : "eye-off"}
            size={20}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Updating..." : "Reset Password"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "InterBold",
    color: "#215432",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Inter",
    marginBottom: 25,
  },
  label: {
    fontSize: 13,
    color: "#444",
    marginBottom: 6,
    fontFamily: "InterBold",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#333",
    marginBottom: 18,
    fontFamily: "Inter",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginBottom: 18,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#333",
    fontFamily: "Inter",
  },
  eyeWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: "#215432",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: "#e0e0e0",
    color: "#888",
  },
  
});
