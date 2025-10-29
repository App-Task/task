import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { updateTaskById } from "../../services/taskService";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

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
  
  const isRTL = i18n.language === "ar";
  
  // Location states
  const [coords, setCoords] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);
  const [tempRegion, setTempRegion] = useState(null);

  // Initialize location from task data
  useEffect(() => {
    if (task.coordinates) {
      setCoords(task.coordinates);
    } else if (task.location) {
      // If we have address but no coordinates, try to geocode it
      geocodeAddress(task.location);
    }
  }, []);

  const geocodeAddress = async (address) => {
    try {
      const result = await Location.geocodeAsync(address);
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        setCoords({ latitude, longitude });
        setTempRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.log("Geocoding error:", error);
    }
  };

  const handleSave = async () => {
    let hasError = false;
    let errorMessage = "";

    if (!title || title.trim().length < 10) {
      hasError = true;
      errorMessage = t("clientEditTask.titleTooShort");
    }

    if (!description || description.trim().length < 25) {
      hasError = true;
      if (errorMessage) {
        errorMessage += "\n\n" + t("clientEditTask.descriptionTooShort");
      } else {
        errorMessage = t("clientEditTask.descriptionTooShort");
      }
    }

    if (!budget.trim()) {
      hasError = true;
      if (errorMessage) {
        errorMessage += "\n\n" + t("clientEditTask.pleaseEnterBudget");
      } else {
        errorMessage = t("clientEditTask.pleaseEnterBudget");
      }
    }

    if (hasError) {
      Alert.alert(t("clientEditTask.validationError"), errorMessage);
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
        coordinates: coords,
        images,
      });

      navigation.navigate("TaskUpdatedSuccess");
    } catch (error) {
      console.log("Update error:", error);
      Alert.alert(t("common.errorTitle"), t("clientEditTask.updateError"));
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

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const pickLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("clientEditTask.permissionDenied"), t("clientEditTask.locationPermissionRequired"));
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
        setCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      Alert.alert(t("common.errorTitle"), t("clientEditTask.locationError"));
    }
  };

  // Open the map picker
  const openMapPicker = async () => {
    try {
      setMapVisible(true);
      if (coords) {
        setTempCoords(coords);
        setTempRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        // Get current location if no coordinates available
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;
          setTempCoords({ latitude, longitude });
          setTempRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    } catch (e) {
      console.log("openMapPicker error", e);
      Alert.alert(t("common.errorTitle"), t("clientEditTask.mapPickerError"));
    }
  };

  // Confirm the location chosen in the modal
  const confirmMapLocation = async () => {
    if (!tempCoords) return;
    
    setCoords(tempCoords);
    
    // Reverse geocode to get address
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude: tempCoords.latitude,
        longitude: tempCoords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];
        setAddress(`${addr.street || ""} ${addr.city || ""} ${addr.region || ""}`.trim());
      }
    } catch (error) {
      console.log("Reverse geocoding error:", error);
    }
    
    setMapVisible(false);
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
          <Text style={styles.headerTitle}>{t("clientEditTask.title")}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Green separator line */}
        <View style={styles.separator} />

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Category */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t("clientEditTask.category")}</Text>
            <TouchableOpacity
              style={styles.categoryBtn}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.categoryText, !category && styles.placeholderText]}>
                {category || t("clientEditTask.selectCategory")}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Task Title */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>{t("clientEditTask.taskTitle")}</Text>
              <Text style={styles.charLimit}>
                {title.length < 10 
                  ? t("clientEditTask.minCharacters", { count: 10 - title.length })
                  : t("clientEditTask.maxCharacters100")
                }
              </Text>
            </View>
            <TextInput
              style={styles.inputField}
              value={title}
              onChangeText={(text) => {
                if (text.length <= 100) setTitle(text);
              }}
              placeholder={t("clientEditTask.taskTitlePlaceholder")}
              placeholderTextColor="#999"
              maxLength={100}
              textAlign={isRTL ? "right" : "left"}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>{t("clientEditTask.describeTask")}</Text>
              <Text style={styles.charLimit}>
                {description.length < 25 
                  ? t("clientEditTask.minCharacters", { count: 25 - description.length })
                  : t("clientEditTask.maxCharacters150")
                }
              </Text>
            </View>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={(text) => {
                  if (text.length <= 150) setDescription(text);
                }}
                placeholder={t("clientEditTask.describeTaskPlaceholder")}
                placeholderTextColor="#999"
                multiline
                maxLength={150}
                textAlignVertical="top"
                textAlign={isRTL ? "right" : "left"}
              />
              <View style={styles.textAreaSeparator} />
              <TouchableOpacity style={styles.addMediaBtn} onPress={pickImage}>
                <Ionicons name="add" size={20} color="#999" />
                <Text style={styles.addMediaText}>{t("clientEditTask.addImagesVideos")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Gallery */}
          {images && images.length > 0 && (
            <View style={styles.imageGalleryContainer}>
              <Text style={styles.galleryTitle}>{t("clientEditTask.selectedImages")}</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.imageGallery}
              >
                {images.map((imageUri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.galleryImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Task Address */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t("clientEditTask.taskAddress")}</Text>
            <TouchableOpacity style={styles.addressBtn} onPress={openMapPicker}>
              <View style={styles.addressBtnContent}>
                <View style={styles.addIcon}>
                  <Ionicons name="location" size={16} color="#fff" />
                </View>
                <Text style={styles.addressBtnText}>{t("clientEditTask.selectLocationOnMap")}</Text>
              </View>
            </TouchableOpacity>
            {address ? (
              <Text style={styles.addressText}>{address}</Text>
            ) : null}
            
            {/* Show map preview if coordinates available */}
            {coords && (
              <View style={styles.mapPreview}>
                <MapView
                  style={styles.mapPreviewStyle}
                  region={{
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker coordinate={coords} />
                </MapView>
                <TouchableOpacity style={styles.editLocationButton} onPress={openMapPicker}>
                  <Text style={styles.editLocationText}>{t("clientEditTask.editLocationOnMap")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Budget */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t("clientEditTask.budget")}</Text>
            <View style={styles.budgetContainer}>
              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={setBudget}
                placeholder={t("clientEditTask.budgetPlaceholder")}
                placeholderTextColor="#999"
                keyboardType="numeric"
                textAlign={isRTL ? "right" : "left"}
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
            {loading ? t("clientEditTask.updating") : t("clientEditTask.confirmChanges")}
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
              <Text style={styles.modalTitle}>{t("clientEditTask.selectCategory")}</Text>
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

        {/* Map Picker Modal */}
        <Modal
        visible={mapVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setMapVisible(false)}
      >
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity
              style={styles.mapBackBtn}
              onPress={() => setMapVisible(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#215432" />
            </TouchableOpacity>
            <Text style={styles.mapHeaderTitle}>{t("clientEditTask.selectTaskLocation")}</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.mapHeaderSubtitle}>
            {t("clientEditTask.mapInstructions")}
          </Text>

          {tempRegion && (
            <MapView
              style={{ flex: 1 }}
              initialRegion={tempRegion}
              onPress={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setTempCoords({ latitude, longitude });
              }}
            >
              {tempCoords && (
                <Marker
                  coordinate={tempCoords}
                  draggable
                  onDragEnd={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setTempCoords({ latitude, longitude });
                  }}
                />
              )}
            </MapView>
          )}

          <View style={styles.mapFooter}>
            <TouchableOpacity style={[styles.mapBtn, styles.mapCancel]} onPress={() => setMapVisible(false)}>
              <Text style={styles.mapBtnText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mapBtn, styles.mapConfirm]} onPress={confirmMapLocation}>
              <Text style={[styles.mapBtnText, { color: "#fff" }]}>{t("clientEditTask.confirmLocation")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
    direction: "ltr",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "InterBold",
    color: "#333",
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  labelRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  charLimit: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Inter",
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  categoryBtn: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  categoryText: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  textAreaSeparator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
  addMediaBtn: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addMediaText: {
    fontSize: 14,
    color: "#999",
    fontFamily: "Inter",
    marginLeft: I18nManager.isRTL ? 0 : 8,
    marginRight: I18nManager.isRTL ? 8 : 0,
  },
  // Image Gallery styles
  imageGalleryContainer: {
    marginBottom: 24,
  },
  galleryTitle: {
    fontSize: 14,
    fontFamily: "InterBold",
    color: "#215432",
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  imageGallery: {
    flexDirection: "row",
  },
  imageContainer: {
    position: "relative",
    marginRight: I18nManager.isRTL ? 0 : 12,
    marginLeft: I18nManager.isRTL ? 12 : 0,
  },
  galleryImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addressBtn: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addressBtnContent: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
  },
  addIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#215432",
    alignItems: "center",
    justifyContent: "center",
    marginRight: I18nManager.isRTL ? 0 : 12,
    marginLeft: I18nManager.isRTL ? 12 : 0,
  },
  addressBtnText: {
    fontSize: 16,
    color: "#215432",
    fontFamily: "InterBold",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Inter",
    marginTop: 8,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  // Map preview styles
  mapPreview: {
    marginTop: 12,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  mapPreviewStyle: {
    height: 120,
    width: "100%",
  },
  editLocationButton: {
    backgroundColor: "#215432",
    paddingVertical: 12,
    alignItems: "center",
  },
  editLocationText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 14,
  },
  budgetContainer: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  currency: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#333",
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    textAlign: "center",
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
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  selectedCategoryItemText: {
    color: "#215432",
    fontFamily: "InterBold",
  },
  // Map Modal styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    direction: "ltr",
  },
  mapBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  mapHeaderTitle: {
    fontSize: 20,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  mapHeaderSubtitle: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  mapFooter: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    gap: 12,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  mapBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCancel: {
    backgroundColor: "#f2f2f2",
  },
  mapConfirm: {
    backgroundColor: "#215432",
  },
  mapBtnText: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: "center",
  },
});