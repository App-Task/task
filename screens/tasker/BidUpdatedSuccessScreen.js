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

export default function BidUpdatedSuccessScreen() {
  const navigation = useNavigation();

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
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Bid</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
          <View style={styles.progressRemaining} />
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
        <Text style={styles.successTitle}>Bid Updated</Text>
        <Text style={styles.successMessage}>
          Your bid has been updated, you'll be able to view its status in My Tasks
        </Text>

        {/* Done Button */}
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
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
  doneButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#fff",
  },
});
