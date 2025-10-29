import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  I18nManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { forgotPassword } from "../../services/auth";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

export default function ForgotPasswordRequest({ navigation, route }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const role = route?.params?.role || "client";
  const { t } = useTranslation();
  
  const isRTL = i18n.language === "ar";

  // Debug logging
  console.log(`🔍 ForgotPasswordRequest mounted with role: ${role}`);
  console.log(`🔍 Route params:`, route?.params);

  const handleSendCode = async () => {
    if (!email.trim()) return Alert.alert(t("common.missingInfo"), t("common.missingFields"));

    setLoading(true);
    try {
      console.log(`🔍 Sending forgot password request for email: ${email.trim().toLowerCase()}, role: ${role}`);
      await forgotPassword(email.trim().toLowerCase(), role);
      Alert.alert(t("forgotPassword.requestReceived"), t("forgotPassword.resetCodeSent"));
      navigation.navigate("ForgotPasswordReset", { email: email.trim().toLowerCase(), role });
    } catch (err) {
      console.error("❌ Forgot Password Error:", err.message);
      Alert.alert(t("common.errorTitle"), t("common.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name={"arrow-back"} size={28} color="#215433" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("forgotPassword.resetPassword")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <TextInput
        style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
        placeholder={t("forgotPassword.enterEmail")}
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? t("forgotPassword.sending") : t("forgotPassword.sendResetCode")}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    direction: "ltr",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: "center",
    flex: 1,
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
