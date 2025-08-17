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
import { forgotPassword } from "../../services/auth";

export default function ForgotPasswordRequest({ navigation, route }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const role = route?.params?.role || "client";

  const handleSendCode = async () => {
    if (!email.trim()) return Alert.alert("Missing", "Please enter your email.");

    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase(), role);
      Alert.alert("Request Received", "A password reset code has been sent to your email.");
      navigation.navigate("ForgotPasswordReset", { email: email.trim().toLowerCase(), role });
    } catch (err) {
      console.error("❌ Forgot Password Error:", err.message);
      Alert.alert("Error", "Something went wrong. Please try again.");
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

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Send Reset Code"}
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
