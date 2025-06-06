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
  Modal,
  FlatList,
  Image,
  I18nManager,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const rawCategories = ["Cleaning", "Moving", "Delivery", "Repairs", "Other"];

export default function PostTaskScreen() {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const handlePost = () => {
    if (!title || !description || !location || !budget || !selectedCategory) {
      Alert.alert(t("post.missingTitle"), t("post.fillAllFields"));
      return;
    }

    console.log({ title, description, location, budget, category: selectedCategory, images });

    Alert.alert(t("post.successTitle"), t("post.successMessage"));
    setTitle("");
    setDescription("");
    setLocation("");
    setBudget("");
    setImages([]);
    setSelectedCategory(null);
  };

  const pickImages = async () => {
    if (images.length >= 3) {
      Alert.alert(t("post.limitTitle"), t("post.limitMsg"));
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
      <Text style={styles.categoryText}>{t(`post.categories.${item.toLowerCase()}`)}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>{t("post.title")}</Text>

        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder={t("post.taskTitlePlaceholder")}
            maxLength={15}
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            textAlign={I18nManager.isRTL ? "right" : "left"}
          />

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t("post.taskDescPlaceholder")}
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            maxLength={150}
            multiline
            textAlignVertical="top"
            textAlign={I18nManager.isRTL ? "right" : "left"}
          />

          <TouchableOpacity style={styles.categoryPicker} onPress={() => setCategoryModalVisible(true)}>
            <Text style={styles.uploadText}>
              {selectedCategory ? t(`post.categories.${selectedCategory.toLowerCase()}`) : t("post.selectCategory")}
            </Text>
          </TouchableOpacity>

          <TextInput
  style={styles.input}
  placeholder={t("post.enterAddress")}
  placeholderTextColor="#999"
  value={location}
  onChangeText={setLocation}
  textAlign={I18nManager.isRTL ? "right" : "left"}
/>


          <TextInput
            style={styles.input}
            placeholder={t("post.budget")}
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
              + {t("post.uploadImage")} ({images.length}/3)
            </Text>
          </TouchableOpacity>

          <ScrollView horizontal>
            {images.map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.preview} />
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.button} onPress={handlePost}>
          <Text style={styles.buttonText}>{t("post.postBtn")}</Text>
        </TouchableOpacity>

        {/* Category Modal */}
        <Modal visible={categoryModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <FlatList
                data={rawCategories}
                keyExtractor={(item) => item}
                renderItem={renderCategoryItem}
              />
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>{t("post.cancel")}</Text>
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
  placesWrapper: {
    marginBottom: 20,
  },
  placesInput: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  placesListView: {
    borderRadius: 8,
    marginTop: 5,
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
