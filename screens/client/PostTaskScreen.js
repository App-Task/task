import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function PostTaskScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");

  const handlePost = () => {
    if (!title || !description || !location || !budget) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    console.log({ title, description, location, budget });
    Alert.alert("Success", "Your task has been posted!");
    setTitle("");
    setDescription("");
    setLocation("");
    setBudget("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} style={{ flex: 1 }}>
        <Text style={styles.heading}>Post a Task</Text>

        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="Task Title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe your task"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
          />

          <TextInput
            style={styles.input}
            placeholder="Location"
            placeholderTextColor="#999"
            value={location}
            onChangeText={setLocation}
          />

          <TextInput
            style={styles.input}
            placeholder="Budget (SAR)"
            placeholderTextColor="#999"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.uploadBox}>
          <Text style={styles.uploadText}>+ Upload Image (Coming Soon)</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.button} onPress={handlePost}>
          <Text style={styles.buttonText}>Post Task</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    minHeight: height,
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 28,
    color: "#213729",
    marginBottom: 30,
  },
  formSection: {
    gap: 20, // if supported, otherwise manually use marginBottom
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginBottom: 20,
  },
  textarea: {
    textAlignVertical: "top",
    height: 120,
  },
  uploadBox: {
    backgroundColor: "#e8e8e8",
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  uploadText: {
    fontFamily: "Inter",
    color: "#666",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
  spacer: {
    height: 30,
  },
});
