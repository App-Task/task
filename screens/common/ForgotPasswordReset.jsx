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
        "Password must include at least 8 characters, one uppercase letter, and one number."
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
        <Ionicons name="arrow-back" size={28} color="#215433" />
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
      <TextInput
        style={styles.input}
        placeholder="Must include capital letter & number"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <Text style={styles.label}>Confirm new password</Text>
      <TextInput
        style={styles.input}
        placeholder="Repeat your new password"
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
