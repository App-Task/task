import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  I18nManager,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";

export default function BankAccountScreen() {
  const { t } = useTranslation();

  const [bankName, setBankName] = useState("Al Rajhi Bank");
  const [accountNumber, setAccountNumber] = useState("1234567890");
  const [iban, setIban] = useState("SA1234567890123456789012");

  const handleSave = () => {
    // Placeholder: later submit to backend
    Alert.alert(t("bank.savedTitle"), t("bank.savedMessage"));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t("bank.title")}</Text>

      <TextInput
        style={styles.input}
        placeholder={t("bank.bankName")}
        value={bankName}
        onChangeText={setBankName}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder={t("bank.accountNumber")}
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="number-pad"
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder={t("bank.iban")}
        value={iban}
        onChangeText={setIban}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>{t("bank.save")}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 30,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
});
