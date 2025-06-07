import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  I18nManager,
  StyleSheet, 
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";


export default function SettingsScreen({ navigation }) {
  const { t } = useTranslation();

  const handlePress = (label) => {
    Alert.alert(t("settings.title"), `${t("settings.open")} "${label}"`);
  };

  return (
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
        <Text style={styles.header}>{t("settings.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Items */}
      <TouchableOpacity style={styles.item} onPress={() => handlePress(t("settings.about"))}>
        <Ionicons name="information-circle-outline" size={20} color="#215432" />
        <Text style={styles.text}>{t("settings.about")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => handlePress(t("settings.privacy"))}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#215432" />
        <Text style={styles.text}>{t("settings.privacy")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => handlePress(t("settings.terms"))}>
        <Ionicons name="document-text-outline" size={20} color="#215432" />
        <Text style={styles.text}>{t("settings.terms")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => handlePress(t("settings.faq"))}>
        <Ionicons name="help-circle-outline" size={20} color="#215432" />
        <Text style={styles.text}>{t("settings.faq")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => handlePress(t("settings.contact"))}>
        <Ionicons name="chatbubbles-outline" size={20} color="#215432" />
        <Text style={styles.text}>{t("settings.contact")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.item, styles.logout]}
        onPress={() => Alert.alert(t("settings.logoutMsg"))}
      >
        <Ionicons name="log-out-outline" size={20} color="#213729" />
        <Text style={[styles.text, styles.logoutText]}>{t("settings.logout")}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  },
  logout: {
    backgroundColor: "#c1ff72",
  },
  logoutText: {
    fontFamily: "InterBold",
    color: "#213729",
  },
});
