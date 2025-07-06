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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import useUnreadNotifications from "../../hooks/useUnreadNotifications";





const { width, height } = Dimensions.get("window");
const rawCategories = ["Cleaning", "Moving", "Delivery", "Repairs", "Other"];

export default function PostTaskScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const unreadCount = useUnreadNotifications();
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
  const deleteImage = (indexToDelete) => {
    const updatedImages = images.filter((_, index) => index !== indexToDelete);
    setImages(updatedImages);
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
          {/* 🔔 Notifications button */}
          <View style={styles.notificationsIcon}>
  <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
    <Ionicons name="notifications-outline" size={24} color="#213729" />
    {unreadCount > 0 && (
      <View style={styles.notificationDot}>
        <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
</View>



      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>{t("clientPostTask.title")}</Text>

        <View style={styles.formContainer}>
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
    placeholder={t("clientPostTask.budget") + " (BHD)"}
    placeholderTextColor="#999"
    value={budget}
    onChangeText={setBudget}
    keyboardType="numeric"
    textAlign={I18nManager.isRTL ? "right" : "left"}
  />

  <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
    <Text style={styles.uploadText}>
      + {t("clientPostTask.uploadImage")} ({images.length}/3)
    </Text>
  </TouchableOpacity>
  {images.length > 0 && (
  <View style={{ marginTop: -16 }}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {images.map((img, index) => (
        <View key={index} style={styles.imageWrapper}>
          <Image source={{ uri: img }} style={styles.preview} />
          <TouchableOpacity
            style={styles.deleteIcon}
            onPress={() => deleteImage(index)}
          >
            <Text style={styles.deleteIconText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  </View>
)}


  <TouchableOpacity style={styles.button} onPress={handlePost}>
    <Text style={styles.buttonText}>{t("clientPostTask.postBtn")}</Text>
  </TouchableOpacity>
</View>


        <Modal
  visible={categoryModalVisible}
  animationType="fade"
  transparent
  onRequestClose={() => setCategoryModalVisible(false)}
>
  <TouchableOpacity
    activeOpacity={1}
    onPressOut={() => setCategoryModalVisible(false)}
    style={styles.modalOverlay}
  >
    <TouchableOpacity
      activeOpacity={1}
      style={styles.bottomSheet}
      onPress={() => {}} // prevents dismiss when tapping inside
    >
      <Text style={styles.modalTitle}>{t("clientPostTask.selectCategory")}</Text>
      <FlatList
        data={rawCategories}
        keyExtractor={(item) => item}
        renderItem={renderCategoryItem}
        style={{ maxHeight: 300 }}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        onPress={() => setCategoryModalVisible(false)}
        style={styles.modalCancel}
      >
        <Text style={styles.modalCancelText}>{t("clientPostTask.cancel")}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  </TouchableOpacity>
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
    display: "flex",
    flexDirection: "column",
    gap: 16, // consistent spacing between all inputs
    marginBottom: 24,
  },
  
  
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  
  
  textarea: {
    height: 120,
  },
  categoryPicker: {
    backgroundColor: "#f2f2f2", // match the input background
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
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
    fontSize: 16,         // match input font size
    color: "#333",        // match input text color
  },
  

  preview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  
  imageSection: {
    gap:16,
    marginBottom: 24, // match formSection spacing
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  
  bottomSheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },
  
  modalTitle: {
    fontSize: 18,
    fontFamily: "InterBold",
    marginBottom: 12,
    color: "#213729",
  },
  
  modalCancel: {
    marginTop: 20,
    alignItems: "center",
  },
  
  modalCancelText: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#999",
  },
  imageWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  
  
  deleteIcon: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ffffffdd", // subtle white background
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  
  deleteIconText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16, // increased for better visual breathing space
    marginBottom: 40,
  },
  notificationsIcon: {
    position: "absolute",
    top: 65,
    right: 24,
    zIndex: 10,
  },

  notificationDot: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#c00",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    includeFontPadding: false,
  },
  
  
  
  
  
  
  
  
});
