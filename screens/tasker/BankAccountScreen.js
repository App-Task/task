import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  I18nManager,
  Alert,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

export default function BankAccountScreen({ navigation }) {
  const { t } = useTranslation();

  const [bankName, setBankName] = useState("Al Rajhi Bank");
  const [accountNumber, setAccountNumber] = useState("1234567890");
  const [iban, setIban] = useState("SA1234567890123456789012");

  const handleSave = () => {
    Alert.alert(t("taskerBankAccount.savedTitle"), t("taskerBankAccount.savedMessage"));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#215433"
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t("taskerBankAccount.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Inputs */}
      <TextInput
        style={styles.input}
        placeholder={t("taskerBankAccount.bankName")}
        value={bankName}
        onChangeText={setBankName}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder={t("taskerBankAccount.accountNumber")}
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="number-pad"
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder={t("taskerBankAccount.iban")}
        value={iban}
        onChangeText={setIban}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>{t("taskerBankAccount.save")}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backBtn: {
    padding: 4,
  },
  headerText: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#215433",
    textAlign: "center",
    flex: 1,
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
    backgroundColor: "#215433",
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
