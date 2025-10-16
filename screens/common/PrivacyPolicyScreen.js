import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicyScreen({ navigation }) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#215433"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t("privacyPolicy.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>
          <Text style={styles.bold}>{t("privacyPolicy.effectiveDate")}</Text> August 1, 2025
        </Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading1")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section1")}</Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading2")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section2")}</Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading3")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section3")}</Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading4")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section4")}</Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading5")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section5")}</Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading6")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section6")}</Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading7")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section7")}</Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading8")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section8")}</Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading9")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section9")}</Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading10")}</Text>
        <Text style={styles.section}>{t("privacyPolicy.section10")}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
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
    color: "#215433",
    textAlign: "center",
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#215432",
    marginBottom: 8,
    marginTop: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  section: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  bullet: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    paddingLeft: 12,
    marginBottom: 6,
  },
  bold: {
    fontFamily: "InterBold",
  },
});
