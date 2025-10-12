import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

export default function PostTaskPage3() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { title, description, category, images = [], coords, address } = route.params || {};

  const [budget, setBudget] = useState("");
  const [budgetError, setBudgetError] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSuccessDone = () => {
    navigation.navigate("ClientHome", { screen: "Tasks" });
  };

  const handlePostTask = async () => {
    if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      setBudgetError(true);
      Alert.alert(
        t("clientPostTask.missingTitle"),
        t("clientPostTask.pleaseEnterValidBudget")
      );
      return;
    }

    setBudgetError(false);

    try {
      setPosting(true);

      const userId = await SecureStore.getItemAsync("userId");

      if (!userId) {
        setPosting(false);
        Alert.alert(t("clientPostTask.errorTitle"), t("clientPostTask.userNotLoggedIn"));
        return;
      }

      const taskData = {
        title,
        description,
        location: address || "Address not specified",
        budget: parseFloat(budget),
        category: category?.id || "other",
        images,
        userId,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        locationGeo: coords
          ? { type: "Point", coordinates: [coords.longitude, coords.latitude] }
          : null
      };

      const response = await fetch("https://task-kq94.onrender.com/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.log("❌ Backend error:", result);
        throw new Error(result.error || "Failed to save task.");
      }

      console.log("✅ Task posted:", result);

      setShowSuccess(true);
    } catch (err) {
      console.error("❌ Post error:", err.message);
      Alert.alert(t("clientPostTask.errorTitle"), t("clientPostTask.postError"));
    } finally {
      setPosting(false);
    }
  };

  // Show success screen
  if (showSuccess) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark" size={60} color="#215432" />
          </View>
          <Text style={styles.successTitle}>Task Posted</Text>
          <Text style={styles.successDescription}>
            Your Task has been successfully posted
          </Text>
          <TouchableOpacity style={styles.successButton} onPress={handleSuccessDone}>
            <Text style={styles.successButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons
              name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color="#215432"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("clientPostTask.page3.title")}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, styles.progressBarActive]} />
          <View style={[styles.progressBar, styles.progressBarActive]} />
          <View style={[styles.progressBar, styles.progressBarActive]} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.pageTitle}>{t("clientPostTask.page3.budgetQuestion")}</Text>
          <Text style={styles.pageDescription}>
            {t("clientPostTask.page3.budgetDescription")}
          </Text>

          <View style={styles.budgetInputContainer}>
            <TextInput
              style={[
                styles.budgetInput,
                budgetError && styles.budgetInputError
              ]}
              placeholder={t("clientPostTask.page3.budgetPlaceholder")}
              placeholderTextColor="#999999"
              value={budget}
              onChangeText={(text) => {
                setBudget(text);
                setBudgetError(false);
              }}
              keyboardType="numeric"
              textAlign={I18nManager.isRTL ? "right" : "left"}
            />
            <Text style={styles.currencyLabel}>{t("clientPostTask.page3.currency")}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("clientPostTask.page3.finalPaymentNote")}</Text>
        </View>

        {/* Floating Post Button */}
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity 
            style={styles.postButton} 
            onPress={handlePostTask}
            disabled={posting}
          >
            <Text style={styles.postButtonText}>
              {posting ? t("clientPostTask.page3.posting") : t("clientPostTask.page3.postTask")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {posting && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>{t("clientPostTask.page3.postingTask")}</Text>
            </View>
          </View>
        )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "InterBold",
    color: "#000000",
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#000000",
    marginBottom: 24,
    marginTop: 8,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  pageDescription: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666666",
    lineHeight: 20,
    marginBottom: 32,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  budgetInputContainer: {
    position: "relative",
    alignItems: "center",
  },
  budgetInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 20,
    paddingHorizontal: 24,
    fontSize: 18,
    fontFamily: "Inter",
    color: "#333333",
    width: "100%",
    textAlign: "center",
  },
  budgetInputError: {
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  currencyLabel: {
    position: "absolute",
    right: I18nManager.isRTL ? undefined : 24,
    left: I18nManager.isRTL ? 24 : undefined,
    top: "50%",
    transform: [{ translateY: -10 }],
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#333333",
  },
  footer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20, // Reduced space for floating button
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#999999",
    textAlign: "center",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  postButton: {
    backgroundColor: "#215432",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#ffffff",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  successContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#215432",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: "center",
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 48,
  },
  successButton: {
    backgroundColor: "#215432",
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successButtonText: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#ffffff",
    textAlign: "center",
  },
});
