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

export default function ForgotPasswordReset({ navigation, route }) {
  const emailFromRoute = route?.params?.email || "";
  const [email, setEmail] = useState(emailFromRoute);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email || !code || !newPassword || !confirmPassword) {
      return Alert.alert("Missing Info", "Please fill all fields.");
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("Mismatch", "Passwords do not match.");
    }

    const strongPw = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPw.test(newPassword)) {
      return Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters, contain an uppercase letter and a number."
      );
    }

    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      Alert.alert("Success", "Your password has been reset. Please log in.");
      navigation.replace("Login");
    } catch (err) {
      console.error("❌ Reset Password Error:", err.message);
      Alert.alert("Error", err.response?.data?.msg || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={28} color="#213729" />
      </TouchableOpacity>

      <Text style={styles.title}>Enter reset code & new password</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="6-digit code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TextInput
        style={styles.input}
        placeholder="New password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

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
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "InterBold",
    color: "#215432",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#333",
    marginBottom: 18,
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
});
