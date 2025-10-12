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

export default function TermsAndConditionsScreen({ navigation }) {
  const { t } = useTranslation();
  
  // Helper function to render section content with proper bullet formatting
  const renderSection = (sectionKey) => {
    const text = t(sectionKey);
    
    // Split by bullet point character
    const parts = text.split('•');
    
    if (parts.length === 1) {
      // No bullet points, render as normal text
      return <Text style={styles.section}>{text}</Text>;
    }
    
    // Has bullet points
    const bullets = [];
    const closingTexts = [];
    
    // Process bullet points
    parts.slice(1).forEach((part, index) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) return;
      
      // Check if this part contains paragraph breaks (text after bullets)
      const paragraphBreak = trimmedPart.indexOf('\n\n');
      
      if (paragraphBreak > -1) {
        // Split bullet text from closing text
        const bulletText = trimmedPart.substring(0, paragraphBreak).trim();
        const closingText = trimmedPart.substring(paragraphBreak).trim();
        
        if (bulletText) {
          bullets.push({ key: `bullet-${index}`, text: bulletText });
        }
        if (closingText) {
          closingTexts.push({ key: `closing-${index}`, text: closingText });
        }
      } else {
        bullets.push({ key: `bullet-${index}`, text: trimmedPart });
      }
    });
    
    return (
      <View>
        {/* Render intro text before bullets */}
        {parts[0].trim() && (
          <Text style={styles.section}>{parts[0].trim()}</Text>
        )}
        
        {/* Render bullet points */}
        {bullets.map((bullet) => (
          <View key={bullet.key} style={styles.bulletContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>{bullet.text}</Text>
          </View>
        ))}
        
        {/* Render closing text after bullets */}
        {closingTexts.map((closing) => (
          <Text key={closing.key} style={[styles.section, { marginTop: 8 }]}>
            {closing.text}
          </Text>
        ))}
      </View>
    );
  };
  
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
        <Text style={styles.title}>{t("termsAndConditions.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Terms Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>
          <Text style={styles.bold}>{t("termsAndConditions.effectiveDate")}</Text> August 1, 2025
        </Text>

        <Text style={styles.heading}>{t("termsAndConditions.heading1")}</Text>
        {renderSection("termsAndConditions.section1")}

        <Text style={styles.heading}>{t("termsAndConditions.heading2")}</Text>
        {renderSection("termsAndConditions.section2")}

        <Text style={styles.heading}>{t("termsAndConditions.heading3")}</Text>
        {renderSection("termsAndConditions.section3")}

        <Text style={styles.heading}>{t("termsAndConditions.heading4")}</Text>
        {renderSection("termsAndConditions.section4")}

        <Text style={styles.heading}>{t("termsAndConditions.heading5")}</Text>
        {renderSection("termsAndConditions.section5")}

        <Text style={styles.heading}>{t("termsAndConditions.heading6")}</Text>
        {renderSection("termsAndConditions.section6")}

        <Text style={styles.heading}>{t("termsAndConditions.heading7")}</Text>
        {renderSection("termsAndConditions.section7")}

        <Text style={styles.heading}>{t("termsAndConditions.heading8")}</Text>
        {renderSection("termsAndConditions.section8")}

        <Text style={styles.heading}>{t("termsAndConditions.heading9")}</Text>
        {renderSection("termsAndConditions.section9")}

        <Text style={styles.heading}>{t("termsAndConditions.heading10")}</Text>
        {renderSection("termsAndConditions.section10")}

        <Text style={styles.heading}>{t("termsAndConditions.heading11")}</Text>
        {renderSection("termsAndConditions.section11")}
      </ScrollView>
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
