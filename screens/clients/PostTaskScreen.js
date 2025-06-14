import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Image,
  I18nManager,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");
const rawCategories = ["Cleaning", "Moving", "Delivery", "Repairs", "Other"];

export default function PostTaskScreen({ navigation }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const handlePost = async () => {
    if (!title || !description || !location || !budget || !selectedCategory) {
      Alert.alert(t("clientPostTask.missingTitle"), t("clientPostTask.fillAllFields"));
      return;
    }
  
    try {
      const userId = await SecureStore.getItemAsync("userId");
  
      if (!userId) {
        Alert.alert("Error", "User not logged in. Please sign in again.");
        return;
      }
  
      const taskData = {
        title,
        description,
        location,
        budget: parseFloat(budget),
        category: selectedCategory,
        images,
        userId,
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
  
      // ✅ Log current nav state
      console.log("🧭 Navigation state:", navigation.getState());
  
      Alert.alert(
        t("clientPostTask.successTitle"),
        t("clientPostTask.successMessage"),
        [
          {
            text: "OK",
            onPress: () => {
              setTimeout(() => {
                navigation.navigate("Home"); // ✅ NOT getParent(), just direct
              }, 100);
            },
          },
        ]
      );
      
      
      
  
      // ✅ Clear form after submission
      setTitle("");
      setDescription("");
      setLocation("");
      setBudget("");
      setImages([]);
      setSelectedCategory(null);
    } catch (err) {
      console.error("❌ Post error:", err.message);
      Alert.alert("Error", "Could not post task. Try again.");
    }
  };
  
  const pickImages = async () => {
    if (images.length >= 3) {
      Alert.alert(t("clientPostTask.limitTitle"), t("clientPostTask.limitMsg"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        setSelectedCategory(item);
        setCategoryModalVisible(false);
      }}
    >
      <Text style={styles.categoryText}>
        {t(`clientPostTask.categories.${item.toLowerCase()}`)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>{t("clientPostTask.title")}</Text>

        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder={t("clientPostTask.taskTitlePlaceholder")}
            maxLength={15}
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            textAlign={I18nManager.isRTL ? "right" : "left"}
          />

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t("clientPostTask.taskDescPlaceholder")}
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            maxLength={150}
            multiline
            textAlignVertical="top"
            textAlign={I18nManager.isRTL ? "right" : "left"}
          />

          <TouchableOpacity
            style={styles.categoryPicker}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text style={styles.uploadText}>
              {selectedCategory
                ? t(`clientPostTask.categories.${selectedCategory.toLowerCase()}`)
                : t("clientPostTask.selectCategory")}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={t("clientPostTask.enterAddress")}
            placeholderTextColor="#999"
            value={location}
            onChangeText={setLocation}
            textAlign={I18nManager.isRTL ? "right" : "left"}
          />

          <TextInput
            style={styles.input}
            placeholder={t("clientPostTask.budget")}
            placeholderTextColor="#999"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            textAlign={I18nManager.isRTL ? "right" : "left"}
          />
        </View>

        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
            <Text style={styles.uploadText}>
              + {t("clientPostTask.uploadImage")} ({images.length}/3)
            </Text>
          </TouchableOpacity>

          <ScrollView horizontal>
            {images.map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.preview} />
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.button} onPress={handlePost}>
          <Text style={styles.buttonText}>{t("clientPostTask.postBtn")}</Text>
        </TouchableOpacity>

        <Modal visible={categoryModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <FlatList
                data={rawCategories}
                keyExtractor={(item) => item}
                renderItem={renderCategoryItem}
              />
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>{t("clientPostTask.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  formSection: {
    gap: 20,
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
    height: 120,
  },
  categoryPicker: {
    backgroundColor: "#e8e8e8",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 20,
  },
  uploadBox: {
    backgroundColor: "#e8e8e8",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  uploadText: {
    fontFamily: "Inter",
    color: "#666",
    fontSize: 14,
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  imageSection: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  categoryItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
  },
  modalCancel: {
    marginTop: 10,
    alignItems: "center",
  },
  modalCancelText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#999",
  },
});
