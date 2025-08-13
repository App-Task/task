import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  I18nManager,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import * as Updates from "expo-updates";
import { updateNotificationLanguage } from "../../services/notificationService";

export default function SettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const [switchingLanguage, setSwitchingLanguage] = useState(false);

  const toggleLanguage = async () => {
    setSwitchingLanguage(true);
    
    try {
      const newLang = i18n.language === "en" ? "ar" : "en";
      const isRTL = newLang === "ar";

      // Update existing notifications to new language
      await updateNotificationLanguage(newLang);

      await SecureStore.setItemAsync("appLanguage", newLang);
      await SecureStore.setItemAsync("appRTL", JSON.stringify(isRTL));
      await i18n.changeLanguage(newLang);

      Toast.show({
        type: "success",
        text1: newLang === "en" ? t("language.changedEn") : t("language.changedAr"),
        position: "bottom",
        visibilityTime: 2000,
      });

      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
        await Updates.reloadAsync();
      }
    } finally {
      setSwitchingLanguage(false);
    }
  };
  
  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons
              name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color="#213729"
            />
          </TouchableOpacity>
          <Text style={styles.header}>{t("taskerSettings.title")}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Items */}
        <TouchableOpacity 
          style={styles.item}
          onPress={() => navigation.navigate("AboutUs")}
        >
          <Ionicons name="information-circle-outline" size={20} color="#215432" />
          <Text style={styles.text}>{t("taskerSettings.about")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
    style={styles.item}
    onPress={() => navigation.navigate("PrivacyPolicy")}
  >
    <Ionicons name="shield-checkmark-outline" size={20} color="#215432" />
    <Text style={styles.text}>{t("taskerSettings.privacy")}</Text>
  </TouchableOpacity>


        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("TermsAndConditions")}
        >
          <Ionicons name="document-text-outline" size={20} color="#215432" />
          <Text style={styles.text}>{t("taskerSettings.terms")}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.item}
          onPress={() => {
            const mailto = "mailto:Task.team.bh@gmail.com";
            Linking.openURL(mailto).catch((err) => {
              console.error("❌ Failed to open email:", err.message);
              Alert.alert("Error", "Could not open your email app.");
            });
          }}
        >
          <Ionicons name="chatbubbles-outline" size={20} color="#215432" />
          <Text style={styles.text}>{t("taskerSettings.contact")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={toggleLanguage}>
          <Ionicons name="language" size={20} color="#215432" />
          <Text style={styles.text}>{t("taskerSettings.language")}</Text>
          <View style={styles.languageIndicator}>
            <Text style={styles.languageText}>
              {i18n.language === "en" ? "English" : "العربية"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      
      {/* Language switching loading popup */}
      {switchingLanguage && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#213729" />
            <Text style={styles.loadingText}>{t("language.switching")}</Text>
          </View>
        </View>
      )}
      
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
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
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    textAlign: "center",
    flex: 1,
  },
  item: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: 12,
  },
  text: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
    flex: 1,
  },
  logout: {
    backgroundColor: "#c1ff72",
  },
  logoutText: {
    fontFamily: "InterBold",
    color: "#213729",
  },
  languageIndicator: {
    marginLeft: "auto",
  },
  languageText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#999",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
  },
  loadingText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
    marginTop: 15,
    textAlign: "center",
  },
});
