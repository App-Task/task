import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function TaskUpdatedSuccessScreen({ navigation }) {
  const handleDone = () => {
    // Navigate back to the task details or home screen
    navigation.navigate("ClientHome", {
      screen: "Tasks",
      params: { refreshTasks: true, targetTab: "Pending" }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <View style={styles.headerLine} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Success Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark" size={60} color="#215432" />
          </View>
        </View>

        {/* Success Text */}
        <View style={styles.textContainer}>
          <Text style={styles.successTitle}>Task Updated</Text>
          <Text style={styles.successMessage}>
            Your Task has been Updated, you'll be able to view its status in My Tasks
          </Text>
        </View>
      </View>

      {/* Done Button */}
      <View style={styles.buttonContainer}>
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
    backgroundColor: "rgba(248, 246, 247)",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "InterBold",
    color: "#333333",
    marginBottom: 10,
  },
  headerLine: {
    height: 1,
    backgroundColor: "#215432",
    width: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    marginBottom: 32,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#215432",
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  doneButton: {
    backgroundColor: "#215432",
    borderRadius: 25,
    paddingVertical: 16,
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
  doneButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "InterBold",
  },
});
