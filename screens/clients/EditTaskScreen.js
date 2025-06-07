import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  I18nManager,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

export default function EditTaskScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { task } = route.params;

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [price, setPrice] = useState(task?.price?.toString() || "");

  const handleUpdate = () => {
    if (!title || !description || !price) {
      Alert.alert(t("clientEditTask.missingTitle"), t("clientEditTask.missingFields"));
      return;
    }

    const updatedTask = {
      ...task,
      title,
      description,
      price: parseFloat(price),
    };

    Alert.alert(t("clientEditTask.updatedTitle"), t("clientEditTask.updatedMessage"));
    navigation.navigate("TaskDetails", { task: updatedTask });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Back Button Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#213729" />
            </TouchableOpacity>
            <Text style={styles.heading}>{t("clientEditTask.heading")}</Text>
            <View style={styles.backBtn} />
          </View>

          <TextInput
            style={styles.input}
            placeholder={t("clientEditTask.titlePlaceholder")}
            value={title}
            onChangeText={setTitle}
            maxLength={15}
          />

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t("clientEditTask.descriptionPlaceholder")}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={150}
          />

          <TextInput
            style={styles.input}
            placeholder={t("clientEditTask.pricePlaceholder")}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>{t("clientEditTask.save")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    paddingTop: 40,
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#213729",
    textAlign: "center",
    flex: 1,
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
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
});
