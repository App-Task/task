import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";

export default function BidUpdatedSuccessScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleDone = () => {
    // Navigate back to the task details or task list
    navigation.navigate("TaskerHome");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name={"arrow-back"} size={24} color="#215432" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("taskerBidUpdate.headerTitle")}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={styles.progressFillComplete} />
        </View>
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
        <Text style={styles.successTitle}>{t("taskerBidUpdate.successTitle")}</Text>
        <Text style={styles.successMessage}>
          {t("taskerBidUpdate.successMessage")}
        </Text>

        {/* Done Button */}
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>{t("taskerBidUpdate.done")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    direction: "ltr",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#333",
    marginLeft: 8,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(248, 246, 247)",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    flex: 1,
    backgroundColor: "#215432",
    borderRadius: 3,
  },
  progressFillComplete: {
    width: "100%",
    height: "100%",
    backgroundColor: "#215432",
    borderRadius: 3,
  },
  progressRemaining: {
    flex: 1,
    backgroundColor: "#e8f4ec",
    borderRadius: 3,
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
    paddingHorizontal: 100,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    alignSelf: "center",
  },
  doneButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#fff",
  },
});
