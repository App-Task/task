import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function BidSentSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { task, bidData } = route.params || {};
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const handleDone = async () => {
    if (!bidData) {
      navigation.navigate("TaskerHome");
      return;
    }

    try {
      setSaving(true);
      await axios.post("https://task-kq94.onrender.com/api/bids", bidData);
      setSaving(false);
      navigation.navigate("TaskerHome");
    } catch (error) {
      setSaving(false);
      console.error("❌ Error saving bid:", error);
      if (error.response?.status === 409) {
        Alert.alert(t("common.error"), t("taskerMyTasks.bidExists"));
      } else {
        Alert.alert(t("common.error"), t("taskerMyTasks.saveBidError"));
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("taskerSendBid.headerTitle")}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name={"arrow-back"} size={24} color="#215432" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, styles.progressBarActive]} />
        <View style={[styles.progressBar, styles.progressBarActive]} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={60} color="#215433" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>{t("taskerBidSent.successTitle")}</Text>
        <Text style={styles.successMessage}>
          {t("taskerBidSent.successMessage")}
        </Text>

        {/* Done Button */}
        <TouchableOpacity 
          style={[styles.doneButton, saving && styles.doneButtonDisabled]} 
          onPress={handleDone}
          disabled={saving}
        >
          <Text style={styles.doneButtonText}>
            {saving ? t("taskerBidSent.saving") : t("taskerBidSent.done")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#333",
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: "#215432",
  },
  progressBarInactive: {
    backgroundColor: "#e0e0e0",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#215433",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#215433",
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  doneButton: {
    backgroundColor: "#215433",
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  doneButtonDisabled: {
    backgroundColor: "#ccc",
  },
  doneButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#fff",
  },
});
