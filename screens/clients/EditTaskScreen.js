import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getTaskById, updateTaskById } from "../../services/taskService";


export default function EditTaskScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { task } = route.params;
  const taskId = task._id;
  console.log("📦 getTaskById is:", getTaskById);


  

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTask = async () => {
      try {
        console.log("📦 Fetching task with ID:", taskId);
        const task = await getTaskById(taskId);
        console.log("✅ Task fetched:", task);
  
        setTitle(task.title || "");
        setDescription(task.description || "");
        setPrice(task.budget?.toString() || "");
      } catch (err) {
        console.error("❌ Error while loading task:", err);
        Alert.alert("Error", "Failed to load task");
      } finally {
        setLoading(false);
      }
    };
  
    loadTask();
  }, [taskId]);
  
  
  const handleUpdate = async () => {
    if (!title || !description || !price) {
      Alert.alert(t("clientEditTask.missingTitle"), t("clientEditTask.missingFields"));
      return;
    }
  
    try {
      await updateTaskById(taskId, {
        title,
        description,
        budget: price,
      });
      navigation.goBack();
    } catch (err) {
      console.error("❌ Failed to update task:", err);
      Alert.alert("Error", "Failed to update task");
    }
  };
  

  if (loading) return <Text style={{ marginTop: 100, textAlign: "center" }}>Loading...</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
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
            maxLength={30}
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
  safeArea: { flex: 1, backgroundColor: "#fff" },
  keyboardView: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    paddingTop: 40,
    backgroundColor: "#fff",
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
  textarea: { textAlignVertical: "top", height: 120 },
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
    color: "#fff",
  },
});
