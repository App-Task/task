import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  I18nManager,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function AboutUsScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#215433"
          />
        </TouchableOpacity>
        <Text style={styles.header}>{t("aboutUs.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contentCard}>
          <Text style={styles.description}>
            {t("aboutUs.description")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 20,
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
    fontSize: 24,
    color: "#215433",
    textAlign: "center",
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  contentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
  },
  description: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
});