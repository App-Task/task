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
  Dimensions, // ✅ add this
} from "react-native";

import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getTaskById, updateTaskById } from "../../services/taskService";

export default function EditTaskScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { task } = route.params;
  const taskId = task._id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({
    title: false,
    description: false,
    location: false,
    price: false,
  });
  

  useEffect(() => {
    const loadTask = async () => {
      try {
        const task = await getTaskById(taskId);
        setTitle(task.title || "");
        setDescription(task.description || "");
        setLocation(task.location || "");
        setPrice(task.budget?.toString() || "");
      } catch (err) {
        Alert.alert(t("common.errorTitle"), t("clientEditTask.loadError"));
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [taskId]);

  const handleUpdate = async () => {
    const newErrors = {
      title: !title.trim(),
      description: !description.trim(),
      location: !location.trim(),
      price: !price.trim(),
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(Boolean)) {
      Alert.alert(t("clientEditTask.missingTitle"), t("clientEditTask.missingFields"));
      return;
    }
    

    try {
      await updateTaskById(taskId, {
        title,
        description,
        location,
        budget: price,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert(t("common.errorTitle"), t("clientEditTask.updateError"));
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
        {/* ✅ Header moved OUTSIDE the ScrollView */}
{/* ✅ Arrow and Title are now separate */}
<View style={styles.headerRow}>
  <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={30} color="#ffffff" />
  </TouchableOpacity>
</View>

<Text style={styles.heading}>{t("clientEditTask.heading")}</Text>


<ScrollView contentContainerStyle={styles.container}>


          <TextInput
  style={[styles.input, errors.title && styles.errorInput]}
  placeholder="Task name"
  value={title}
  onChangeText={(text) => {
    setTitle(text);
    if (errors.title && text.trim()) {
      setErrors((prev) => ({ ...prev, title: false }));
    }
  }}
  maxLength={30}
  placeholderTextColor="#999"
/>

<TextInput
  style={[styles.input, styles.textarea, errors.description && styles.errorInput]}
  placeholder="Description"
  value={description}
  onChangeText={(text) => {
    setDescription(text);
    if (errors.description && text.trim()) {
      setErrors((prev) => ({ ...prev, description: false }));
    }
  }}
  multiline
  maxLength={150}
  placeholderTextColor="#999"
/>

<TextInput
  style={[styles.input, errors.location && styles.errorInput]}
  placeholder="Address"
  value={location}
  onChangeText={(text) => {
    setLocation(text);
    if (errors.location && text.trim()) {
      setErrors((prev) => ({ ...prev, location: false }));
    }
  }}
  maxLength={100}
  placeholderTextColor="#999"
/>

<TextInput
  style={[styles.input, errors.price && styles.errorInput]}
  placeholder="Price (BHD)"
  value={price}
  onChangeText={(text) => {
    setPrice(text);
    if (errors.price && text.trim()) {
      setErrors((prev) => ({ ...prev, price: false }));
    }
  }}
  keyboardType="numeric"
  placeholderTextColor="#999"
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
  keyboardView: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#215432" }, // ✅ same green background
  container: {
    paddingTop: 20,  // ✅ slightly less because header is now separate
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: "#215432",
    minHeight: Dimensions.get("window").height,
  },
  
  
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 10, // ✅ space below arrow
  },
  
  backBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 32,
    color: "#ffffff",
    marginBottom: 30,
    marginTop: 60, // ✅ space above heading
    textAlign: "left",
    paddingHorizontal: 24, // ✅ aligns with arrow
  },
  
  input: {
    backgroundColor: "#ffffff", // ✅ white box
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginBottom: 20,
  },
  
  textarea: { textAlignVertical: "top", height: 120 },
  button: {
    backgroundColor: "#ffffff", // ✅ white background like PostTask
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
    marginTop: 30,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432", // ✅ green text
  },
  
  errorInput: {
    borderWidth: 1,
    borderColor: "#ff4d4d",
  },
  
});
