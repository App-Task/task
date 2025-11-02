import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

// Helper function to convert Arabic numerals to Western numerals
const convertToWesternNumerals = (str) => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = arabicNumerals.indexOf(char);
    result += index !== -1 ? westernNumerals[index] : char;
  }
  return result;
};

export default function EditBidScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { task, existingBid } = route.params || {};
  const { t } = useTranslation();

  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (existingBid) {
      setBidAmount(String(existingBid.amount || ""));
      setMessage(existingBid.message || "");
    }
  }, [existingBid]);

  const handleUpdateBid = async () => {
    if (!bidAmount.trim()) {
      Alert.alert("Error", "Please enter your bid amount.");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message.");
      return;
    }

    // Convert Arabic numerals to Western numerals before validation
    const westernBidAmount = convertToWesternNumerals(bidAmount);
    
    if (Number(westernBidAmount) < 0.1) {
      Alert.alert("Invalid Bid", "Please enter a valid bid amount.");
      return;
    }

    if (message.length > 350) {
      Alert.alert("Error", "Message must be 350 characters or less.");
      return;
    }

    try {
      setSubmitting(true);
      const user = await fetchCurrentUser();
      
      if (!user.isVerified) {
        Alert.alert("Access Denied", "You need to be verified to update bids.");
        return;
      }

      await axios.patch(
        `https://task-kq94.onrender.com/api/bids/${existingBid._id}`,
        {
          amount: Number(westernBidAmount),
          message: message.trim(),
        }
      );

      setSubmitting(false);
      
      // Navigate to success screen
      navigation.replace("BidUpdatedSuccess", { task });
      
    } catch (err) {
      setSubmitting(false);
      console.error("❌ Bid update error:", err.message);
      Alert.alert("Error", "Failed to update bid. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name={"arrow-back"} size={24} color="#215432" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("taskerEditBid.headerTitle")}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, styles.progressBarActive]} />
          <View style={[styles.progressBar, styles.progressBarInactive]} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Bid Offer Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("taskerEditBid.bidOffer")}</Text>
              <Text style={styles.characterLimit}>{t("taskerMyTasks.maxCharacters100")}</Text>
            </View>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              placeholder={t("taskerEditBid.amountPlaceholder", { currency: "BHD" })}
              placeholderTextColor="#999"
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
              maxLength={100}
            />
          </View>

          {/* Message Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("taskerEditBid.messageTitle")}</Text>
              <Text style={styles.characterLimit}>{t("taskerMyTasks.maxCharacters350")}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.messageInput, { textAlign: isRTL ? "right" : "left" }]}
              placeholder={t("taskerEditBid.messagePlaceholder")}
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
              maxLength={350}
            />
          </View>

        </ScrollView>

        {/* Floating Submit Button */}
        <View style={styles.floatingFooter}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleUpdateBid}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? t("taskerEditBid.updating") : t("taskerEditBid.update")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
  },
  characterLimit: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#999",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  messageInput: {
    height: 120,
    textAlignVertical: "top",
  },
  floatingFooter: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    paddingVertical: 16,
  },
  submitButton: {
    backgroundColor: "#215433",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#fff",
  },
});
