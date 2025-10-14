import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";

export default function BidSentSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { task, bidData } = route.params || {};
  const [saving, setSaving] = useState(false);

  const handleDone = async () => {
    if (!bidData) {
      // If no bid data, just navigate back
      navigation.navigate("TaskerHome");
      return;
    }

    try {
      setSaving(true);
      
      // Save the bid when Done is pressed
      await axios.post("https://task-kq94.onrender.com/api/bids", bidData);
      
      setSaving(false);
      
      // Navigate back to the task details or task list
      navigation.navigate("TaskerHome");
      
    } catch (error) {
      setSaving(false);
      console.error("❌ Error saving bid:", error);
      
      if (error.response?.status === 409) {
        Alert.alert("Bid Already Exists", "You have already submitted a bid for this task.");
      } else {
        Alert.alert("Error", "Failed to save bid. Please try again.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Send a bid</Text>
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
        <Text style={styles.successTitle}>Bid Sent</Text>
        <Text style={styles.successMessage}>
          Your bid has been sent, you'll be able to view its status in My Tasks
        </Text>

        {/* Done Button */}
        <TouchableOpacity 
          style={[styles.doneButton, saving && styles.doneButtonDisabled]} 
          onPress={handleDone}
          disabled={saving}
        >
          <Text style={styles.doneButtonText}>
            {saving ? "Saving..." : "Done"}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
