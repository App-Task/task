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
import i18n from "i18next";

export default function PrivacyPolicyScreen({ navigation }) {
  const { t } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Helper function to render bullet points
  const renderBulletPoints = (text, sectionNumber) => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      // Check if line is a bullet point (starts with • or number)
      if (trimmedLine.startsWith('•') || /^\d+\./.test(trimmedLine)) {
        const bulletChar = trimmedLine.charAt(0);
        const bulletText = trimmedLine.substring(1).trim();
        return (
          <View key={`${sectionNumber}-${index}`} style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>{bulletChar}</Text>
            <Text style={styles.bulletText}>{bulletText}</Text>
          </View>
        );
      }
      return (
        <Text key={`${sectionNumber}-${index}`} style={styles.section}>
          {trimmedLine}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name={"arrow-back"} size={24} color="#215433" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("privacyPolicy.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          style={[
            styles.section,
            { textAlign: I18nManager.isRTL ? "right" : "left" },
          ]}
        >
          <Text style={styles.bold}>{t("privacyPolicy.effectiveDate")}</Text>{" "}
          August 1, 2025
        </Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading1")}</Text>
        <Text
          style={[
            styles.section,
            { textAlign: I18nManager.isRTL ? "right" : "left" },
          ]}
        >
          {t("privacyPolicy.section1")}
        </Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading2")}</Text>
        {renderBulletPoints(t("privacyPolicy.section2"), 2)}

        <Text style={styles.heading}>{t("privacyPolicy.heading3")}</Text>
        {renderBulletPoints(t("privacyPolicy.section3"), 3)}

        <Text style={styles.heading}>{t("privacyPolicy.heading4")}</Text>
        {renderBulletPoints(t("privacyPolicy.section4"), 4)}

        <Text style={styles.heading}>{t("privacyPolicy.heading5")}</Text>
        <Text
          style={[
            styles.section,
            { textAlign: I18nManager.isRTL ? "right" : "left" },
          ]}
        >
          {t("privacyPolicy.section5")}
        </Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading6")}</Text>
        {renderBulletPoints(t("privacyPolicy.section6"), 6)}

        <Text style={styles.heading}>{t("privacyPolicy.heading7")}</Text>
        <Text
          style={[
            styles.section,
            { textAlign: I18nManager.isRTL ? "right" : "left" },
          ]}
        >
          {t("privacyPolicy.section7")}
        </Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading8")}</Text>
        <Text
          style={[
            styles.section,
            { textAlign: I18nManager.isRTL ? "right" : "left" },
          ]}
        >
          {t("privacyPolicy.section8")}
        </Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading9")}</Text>
        <Text
          style={[
            styles.section,
            { textAlign: I18nManager.isRTL ? "right" : "left" },
          ]}
        >
          {t("privacyPolicy.section9")}
        </Text>

        <Text style={styles.heading}>{t("privacyPolicy.heading10")}</Text>
        <Text
          style={[
            styles.section,
            { textAlign: I18nManager.isRTL ? "right" : "left" },
          ]}
        >
          {t("privacyPolicy.section10")}
        </Text>
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
    direction: "ltr",
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

  bulletContainer: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    marginBottom: 8,
    paddingHorizontal: I18nManager.isRTL ? 0 : 16,
    alignItems: "flex-start",
  },
  bulletPoint: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    marginRight: I18nManager.isRTL ? 0 : 8,
    marginLeft: I18nManager.isRTL ? 8 : 0,
    lineHeight: 24,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  bold: {
    fontFamily: "InterBold",
  },
});
