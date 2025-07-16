import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  I18nManager,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import axios from "axios";
import { getToken } from "../../services/authStorage";
import { Alert } from "react-native";


const { width } = Dimensions.get("window");

export default function ChangePasswordScreen({ navigation }) {
  const { t } = useTranslation();

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [secure3, setSecure3] = useState(true);

  const handleSubmit = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
  
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
if (!strongPasswordRegex.test(newPass)) {
  Alert.alert(
    "Weak Password",
    "New password must contain at least one capital letter and one number."
  );
  return;
}

    if (newPass !== confirmPass) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }
  
    try {
      const token = await getToken();
  
      const res = await axios.put(
        "https://task-kq94.onrender.com/api/auth/change-password",
        {
          oldPassword: oldPass,
          newPassword: newPass,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      Alert.alert("Success", res.data.msg || "Password changed successfully.");
      navigation.goBack();
    } catch (err) {
      const msg =
        err?.response?.data?.msg || "Something went wrong. Try again later.";
      Alert.alert("Error", msg);
    }
  };
  

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#213729"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t("clientChangePassword.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Inputs */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t("clientChangePassword.old")}
          placeholderTextColor="#999"
          secureTextEntry={secure1}
          value={oldPass}
          onChangeText={setOldPass}
          textAlign={I18nManager.isRTL ? "right" : "left"}
        />
        <TouchableOpacity
          style={styles.eye}
          onPress={() => setSecure1(!secure1)}
        >
          <Ionicons name={secure1 ? "eye-off" : "eye"} size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t("clientChangePassword.new")}
          placeholderTextColor="#999"
          secureTextEntry={secure2}
          value={newPass}
          onChangeText={setNewPass}
          textAlign={I18nManager.isRTL ? "right" : "left"}
        />
        <TouchableOpacity
          style={styles.eye}
          onPress={() => setSecure2(!secure2)}
        >
          <Ionicons name={secure2 ? "eye-off" : "eye"} size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t("clientChangePassword.confirm")}
          placeholderTextColor="#999"
          secureTextEntry={secure3}
          value={confirmPass}
          onChangeText={setConfirmPass}
          textAlign={I18nManager.isRTL ? "right" : "left"}
        />
        <TouchableOpacity
          style={styles.eye}
          onPress={() => setSecure3(!secure3)}
        >
          <Ionicons name={secure3 ? "eye-off" : "eye"} size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{t("clientChangePassword.submit")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#213729",
    textAlign: "center",
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  eye: {
    paddingLeft: 10,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
});
