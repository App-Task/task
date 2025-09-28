import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth";

export default function SendBidScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { task } = route.params || {};

  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitBid = async () => {
    if (!task || !task._id) {
      Alert.alert("Error", "Task information is missing. Please try again.");
      return;
    }

    if (!bidAmount.trim()) {
      Alert.alert("Error", "Please enter your bid amount.");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message.");
      return;
    }

    if (Number(bidAmount) < 0.1) {
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
        Alert.alert("Access Denied", "You need to be verified to submit bids.");
        return;
      }

      await axios.post("https://task-kq94.onrender.com/api/bids", {
        taskId: task._id,
        taskerId: user._id,
        amount: Number(bidAmount),
        message: message.trim(),
      });

      setSubmitting(false);
      
      // Navigate to success screen
      navigation.replace("BidSentSuccess", { task });
      
    } catch (err) {
      setSubmitting(false);
      console.error("❌ Bid submission error:", err.message);
      Alert.alert("Error", "Failed to submit bid. Please try again.");
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
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send a bid</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
            <View style={styles.progressRemaining} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Bid Offer Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bid offer</Text>
              <Text style={styles.characterLimit}>Maximum 100 Characters</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="How much can you do it for (BHD)"
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
              <Text style={styles.sectionTitle}>Message</Text>
              <Text style={styles.characterLimit}>Maximum 350 Characters</Text>
            </View>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Send a message along with the bid to the client..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
              maxLength={350}
            />
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitBid}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? "Submitting..." : "Submit bid"}
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
    backgroundColor: "#fff",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#215433",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#333",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    flexDirection: "row",
  },
  progressFill: {
    flex: 1,
    backgroundColor: "#215433",
    borderRadius: 2,
  },
  progressRemaining: {
    flex: 1,
    backgroundColor: "#e8f4ec",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  submitButton: {
    backgroundColor: "#215433",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
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
