import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  I18nManager,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function SettingsScreen({ navigation }) {
  const { t } = useTranslation();
  
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

        <View style={{ height: 40 }} />
      </ScrollView>
      
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
