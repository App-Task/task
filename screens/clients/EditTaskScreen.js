import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { updateTaskById } from "../../services/taskService";

const { width } = Dimensions.get("window");

// Available services from PostTaskScreen
const AVAILABLE_SERVICES = [
  "Cleaning",
  "Moving",
  "Handyman",
  "Delivery",
  "Pet Care",
  "Tutoring",
  "Photography",
  "Event Planning",
  "Gardening",
  "Computer Help",
  "Other"
];

export default function EditTaskScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { task } = route.params;

  const [category, setCategory] = useState(task.category || "");
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [budget, setBudget] = useState(task.budget?.toString() || "");
  const [address, setAddress] = useState(task.location || "");
  const [images, setImages] = useState(task.images || []);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !budget.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Use the existing service method
      await updateTaskById(task._id, {
        category,
        title: title.trim(),
        description: description.trim(),
        budget: parseFloat(budget),
        location: address,
        images,
      });

      Alert.alert("Success", "Task updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log("Update error:", error);
      Alert.alert("Error", "Failed to update task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const pickLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];
        setAddress(`${addr.street || ""} ${addr.city || ""} ${addr.region || ""}`.trim());
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#215432" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Task</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Green separator line */}
        <View style={styles.separator} />

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Category */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Category</Text>
            <TouchableOpacity
              style={styles.categoryBtn}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.categoryText, !category && styles.placeholderText]}>
                {category || "Select Category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Task Title */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Task Title</Text>
              <Text style={styles.charLimit}>Maximum 100 Characters</Text>
            </View>
            <TextInput
              style={styles.inputField}
              value={title}
              onChangeText={(text) => {
                if (text.length <= 100) setTitle(text);
              }}
              placeholder="What do you need done?"
              placeholderTextColor="#999"
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Describe your Task</Text>
              <Text style={styles.charLimit}>Maximum 350 Characters</Text>
            </View>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={(text) => {
                  if (text.length <= 350) setDescription(text);
                }}
                placeholder="Add a more detailed description of the task you want done"
                placeholderTextColor="#999"
                multiline
                maxLength={350}
                textAlignVertical="top"
              />
              <View style={styles.textAreaSeparator} />
              <TouchableOpacity style={styles.addMediaBtn} onPress={pickImage}>
                <Ionicons name="add" size={20} color="#999" />
                <Text style={styles.addMediaText}>Add Images/Videos</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Task Address */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Task Address</Text>
            <TouchableOpacity style={styles.addressBtn} onPress={pickLocation}>
              <View style={styles.addressBtnContent}>
                <View style={styles.addIcon}>
                  <Ionicons name="add" size={16} color="#fff" />
                </View>
                <Text style={styles.addressBtnText}>Add Task Address</Text>
              </View>
            </TouchableOpacity>
            {address ? (
              <Text style={styles.addressText}>{address}</Text>
            ) : null}
          </View>

          {/* Budget */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Budget</Text>
            <View style={styles.budgetContainer}>
              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={setBudget}
                placeholder="Your Budget"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              <Text style={styles.currency}>BHD</Text>
            </View>
          </View>
        </View>

        {/* Confirm Changes Button */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.confirmBtnText}>
            {loading ? "Updating..." : "Confirm Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowCategoryModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList}>
              {AVAILABLE_SERVICES.map((service, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryItem,
                    category === service && styles.selectedCategoryItem
                  ]}
                  onPress={() => {
                    setCategory(service);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[
                    styles.categoryItemText,
                    category === service && styles.selectedCategoryItemText
                  ]}>
                    {service}
                  </Text>
                  {category === service && (
                    <Ionicons name="checkmark" size={20} color="#215432" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#215432",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "InterBold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  separator: {
    height: 2,
    backgroundColor: "#215432",
    marginHorizontal: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#215432",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  charLimit: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Inter",
  },
  inputField: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter",
    backgroundColor: "#fff",
  },
  categoryBtn: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  categoryText: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter",
    minHeight: 100,
    maxHeight: 120,
  },
  textAreaSeparator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
  addMediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addMediaText: {
    fontSize: 14,
    color: "#999",
    fontFamily: "Inter",
    marginLeft: 8,
  },
  addressBtn: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addressBtnContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  addIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#215432",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addressBtnText: {
    fontSize: 16,
    color: "#215432",
    fontFamily: "InterBold",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Inter",
    marginTop: 8,
  },
  budgetContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  budgetInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter",
  },
  currency: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#333",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmBtn: {
    backgroundColor: "#215432",
    marginHorizontal: 20,
    marginVertical: 32,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#fff",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "InterBold",
    color: "#333",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedCategoryItem: {
    backgroundColor: "#f0f8f0",
  },
  categoryItemText: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  selectedCategoryItemText: {
    color: "#215432",
    fontFamily: "InterBold",
  },
});
