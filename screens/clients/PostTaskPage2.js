import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  ScrollView,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

const { width, height } = Dimensions.get("window");

export default function PostTaskPage2() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { category } = route.params || {};

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [descError, setDescError] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const [images, setImages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const [coords, setCoords] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);
  const [tempRegion, setTempRegion] = useState(null);
  const [address, setAddress] = useState("");

  const handleContinue = () => {
    let hasError = false;
    let errorMessage = "";

    console.log("Validation - Title:", title, "Length:", title?.length);
    console.log("Validation - Description:", description, "Length:", description?.length);

    if (!title || title.trim().length < 10) {
      setTitleError(true);
      hasError = true;
      errorMessage = t("clientPostTask.page2.titleTooShort");
    } else {
      setTitleError(false);
    }

    if (!description || description.trim().length < 25) {
      setDescError(true);
      hasError = true;
      if (errorMessage) {
        errorMessage += "\n\n" + t("clientPostTask.page2.descriptionTooShort");
      } else {
        errorMessage = t("clientPostTask.page2.descriptionTooShort");
      }
    } else {
      setDescError(false);
    }

    if (!address || address.trim().length === 0) {
      setAddressError(true);
      hasError = true;
      if (errorMessage) {
        errorMessage += "\n\n" + "Please add a task address";
      } else {
        errorMessage = "Please add a task address";
      }
    } else {
      setAddressError(false);
    }

    if (hasError) {
      Alert.alert(
        t("clientPostTask.page2.validationError"),
        errorMessage
      );
      return;
    }

    // Navigate to next page with data
    navigation.navigate("PostTaskPage3", {
      title,
      description,
      category,
      images,
      coords,
      address,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Get current location automatically when component mounts
  React.useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t("common.permissionNeeded"), t("common.locationPermissionRequired"));
          return;
        }
        
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        setTempRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (e) {
        console.log("get location error", e);
        Alert.alert(t("common.errorTitle"), t("common.couldNotGetLocation"));
      }
    };
    
    getCurrentLocation();
  }, []);

  // Open the map picker
  const openMapPicker = async () => {
    try {
      // Prepare tempRegion and tempCoords BEFORE opening modal
      if (coords) {
        setTempCoords(coords);
        setTempRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        // If no coords yet, try to get current location
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = pos.coords;
          setTempCoords({ latitude, longitude });
          setTempRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } catch (e) {
          // If location fetch fails, use default location (Bahrain)
          console.log("Location fetch error, using default", e);
          setTempRegion({
            latitude: 26.0667,
            longitude: 50.5577,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }
      
      // Wait a tick to ensure state is updated before showing modal
      await new Promise(resolve => setTimeout(resolve, 100));
      setMapVisible(true);
    } catch (e) {
      console.log("openMapPicker error", e);
      Alert.alert(t("clientPostTask.errorTitle"), t("clientPostTask.mapError"));
    }
  };

  // Confirm the location chosen in the modal
  const confirmMapLocation = async () => {
    if (!tempCoords) return;
    setCoords(tempCoords);
    setMapVisible(false);
    
    // Get address from coordinates
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync(tempCoords);
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const fullAddress = [
          addr.streetNumber,
          addr.street,
          addr.city,
          addr.region,
          addr.postalCode
        ].filter(Boolean).join(", ");
        setAddress(fullAddress);
        setAddressError(false);
      }
    } catch (e) {
      console.log("Reverse geocoding error", e);
    }
  };

  const pickImages = async () => {
    if (images.length >= 3) {
      Alert.alert(t("clientPostTask.limitTitle"), t("clientPostTask.limitMsg"));
      return;
    }
  
    Alert.alert(
      t("clientPostTask.uploadChoiceTitle", { defaultValue: "Choose Image Source" }),
      t("clientPostTask.uploadChoiceMsg", { defaultValue: "How would you like to upload the image?" }),
      [
        {
          text: t("clientPostTask.takePhoto", { defaultValue: "Take Photo" }),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(t("clientPostTask.permissionDenied"), t("clientPostTask.cameraPermissionMessage"));
              return;
            }
    
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.5,
            });
    
            if (!result.canceled) {
              handleImageUpload(result.assets[0].uri);
            }
          },
        },
        {
          text: t("clientPostTask.chooseFromLibrary", { defaultValue: "Choose from Library" }),
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(t("clientPostTask.permissionDenied"), t("clientPostTask.libraryPermissionMessage"));
              return;
            }
    
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsMultipleSelection: false,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.5,
            });
    
            if (!result.canceled) {
              handleImageUpload(result.assets[0].uri);
            }
          },
        },
        {
          text: t("clientPostTask.cancel", { defaultValue: "Cancel" }),
          style: "cancel",
        },
      ]
    );
  };

  const handleImageUpload = async (uri) => {
    const formData = new FormData();
    formData.append("image", {
      uri,
      type: "image/jpeg",
      name: "upload.jpg",
    });
  
    try {
      setImageUploading(true);
      const response = await fetch("https://task-kq94.onrender.com/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
  
      const data = await response.json();
  
      if (data.imageUrl) {
        setImages((prev) => [...prev, data.imageUrl]);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      Alert.alert(t("clientPostTask.uploadFailed"), t("clientPostTask.uploadFailedMessage"));
    } finally {
      setImageUploading(false);
    }
  };

  const deleteImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons
              name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color="#215432"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("clientPostTask.page2.title")}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, styles.progressBarActive]} />
          <View style={[styles.progressBar, styles.progressBarActive]} />
          <View style={[styles.progressBar, styles.progressBarInactive]} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Task Title Section */}
          <View style={styles.section}>
            <View style={I18nManager.isRTL ? styles.labelContainerRTL : styles.labelContainer}>
              <Text style={I18nManager.isRTL ? styles.labelRTL : styles.label}>{t("clientPostTask.page2.taskTitle")}</Text>
              <Text style={I18nManager.isRTL ? styles.requirementRTL : styles.requirement}>
                {title.length < 10 
                  ? `Min ${10 - title.length} more characters`
                  : "Maximum 100 characters"
                }
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                titleError && styles.inputError
              ]}
              placeholder={t("clientPostTask.page2.taskTitlePlaceholder")}
              placeholderTextColor="#999"
              value={title}
              maxLength={100}
              onChangeText={(text) => {
                setTitle(text);
                setTitleError(false);
              }}
              textAlign={I18nManager.isRTL ? "right" : "left"}
            />
          </View>

          {/* Task Description Section */}
          <View style={styles.section}>
            <View style={I18nManager.isRTL ? styles.labelContainerRTL : styles.labelContainer}>
              <Text style={I18nManager.isRTL ? styles.labelRTL : styles.label}>{t("clientPostTask.page2.describeTask")}</Text>
              <Text style={I18nManager.isRTL ? styles.requirementRTL : styles.requirement}>
                {description.length < 25 
                  ? `Min ${25 - description.length} more characters`
                  : "Maximum 150 characters"
                }
              </Text>
            </View>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={[
                  styles.textArea,
                  descError && styles.inputError
                ]}
                placeholder={t("clientPostTask.page2.describeTaskPlaceholder")}
                placeholderTextColor="#999"
                value={description}
                maxLength={150}
                onChangeText={(text) => {
                  setDescription(text);
                  setDescError(false);
                }}
                multiline
                textAlignVertical="top"
                textAlign={I18nManager.isRTL ? "right" : "left"}
              />
            </View>
            
            {/* Separator Line */}
            <View style={styles.separatorLine} />
            
            <TouchableOpacity style={styles.addMediaButton} onPress={pickImages}>
              <Ionicons name="add" size={16} color="#999" />
              <Text style={styles.addMediaText}>{t("clientPostTask.page2.addImagesVideos")}</Text>
            </TouchableOpacity>
          </View>

          {/* Task Address Section */}
          <View style={styles.addressSection}>
            <Text style={styles.label}>{t("clientPostTask.page2.taskAddress")}</Text>
            <TouchableOpacity 
              style={[
                styles.addressButton,
                addressError && styles.addressButtonError
              ]} 
              onPress={openMapPicker}
            >
              <Ionicons name="add" size={20} color="#215432" />
              <Text style={styles.addressButtonText}>
                {address ? address : t("clientPostTask.page2.addTaskAddress")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Image Preview Section */}
          {images.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {images.map((img, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <TouchableOpacity onPress={() => {
                      setPreviewUri(img);
                      setPreviewVisible(true);
                    }}>
                      <Image source={{ uri: img }} style={styles.preview} />
                    </TouchableOpacity>
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
        </View>

        {/* Continue Button */}
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>{t("clientPostTask.page2.continue")}</Text>
          </TouchableOpacity>
        </View>

        {/* Image Upload Loading Overlay */}
        {imageUploading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Uploading image...</Text>
            </View>
          </View>
        )}

        {/* Image Preview Modal */}
        <Modal visible={previewVisible} transparent animationType="fade">
          <View style={styles.previewModalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPreviewVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Image source={{ uri: previewUri }} style={styles.fullPreviewImage} />
          </View>
        </Modal>

        {/* Map Picker Modal */}
        <Modal
          visible={mapVisible}
          animationType="slide"
          transparent={false}
          presentationStyle="fullScreen"
        >
          <SafeAreaView style={styles.mapModalContainer} edges={['top']}>
            <View style={styles.mapHeaderContainer}>
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.modalBackBtn}>
                  <Ionicons
                    name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
                    size={24}
                    color="#215432"
                  />
                </TouchableOpacity>
                <Text style={styles.modalHeader}>Select Task Location</Text>
                <View style={{ width: 40 }} />
              </View>
              <Text style={styles.modalHeaderSubtitle}>
                Tap on the map to select your task location
              </Text>
            </View>

            {tempRegion ? (
              <MapView
                style={styles.map}
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
            ) : (
              <View style={styles.mapLoadingContainer}>
                <Text style={styles.mapLoadingText}>Loading map...</Text>
              </View>
            )}

            <View style={styles.mapFooter}>
              <TouchableOpacity style={[styles.mapBtn, styles.mapCancel]} onPress={() => setMapVisible(false)}>
                <Text style={styles.mapBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mapBtn, styles.mapConfirm]} onPress={confirmMapLocation}>
                <Text style={[styles.mapBtnText, { color: "#fff" }]}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
  },
  header: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "InterBold",
    color: "#000000",
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: "#215432",
  },
  progressBarInactive: {
    backgroundColor: "#e0e0e0",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  addressSection: {
    marginBottom: 24,
    gap: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  labelContainerRTL: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#215432",
    marginRight: 8,
    textAlign: "left",
  },
  labelRTL: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: "right",
  },
  requirement: {
    fontSize: 12,
    fontFamily: "Inter",
    color: "#999999",
    textAlign: "right",
  },
  requirementRTL: {
    fontSize: 12,
    fontFamily: "Inter",
    color: "#999999",
    textAlign: "left",
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333333",
  },
  inputError: {
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  textAreaContainer: {
    position: "relative",
  },
  separatorLine: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
  textArea: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333333",
    height: 120,
    textAlignVertical: "top",
  },
  addMediaButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: 4,
  },
  addMediaText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#999999",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  addressButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: 8,
  },
  addressButtonError: {
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  addressButtonText: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#215432",
    textAlign: I18nManager.isRTL ? "right" : "left",
    flex: 1,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  continueButton: {
    backgroundColor: "#215432",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#ffffff",
  },
  // Image preview styles
  imagePreviewContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  imageWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    marginRight: I18nManager.isRTL ? 0 : 10,
    marginLeft: I18nManager.isRTL ? 10 : 0,
    borderRadius: 10,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  deleteIcon: {
    position: "absolute",
    top: 2,
    right: I18nManager.isRTL ? undefined : 2,
    left: I18nManager.isRTL ? 2 : undefined,
    backgroundColor: "#ffffffdd",
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
  // Loading overlay styles
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  // Image preview modal styles
  previewModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullPreviewImage: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 12,
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: -2,
  },
  // Map modal styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247, 1)",
  },
  mapHeaderContainer: {
    backgroundColor: "rgba(248, 246, 247, 1)",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalBackBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215432",
    textAlign: "center",
    flex: 1,
  },
  modalHeaderSubtitle: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666666",
    paddingHorizontal: 20,
    textAlign: "center",
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(248, 246, 247, 1)",
  },
  mapLoadingText: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#666666",
  },
  mapFooter: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    gap: 12,
    padding: 20,
    paddingBottom: 24,
    backgroundColor: "rgba(248, 246, 247, 1)",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  mapBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCancel: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  mapConfirm: {
    backgroundColor: "#215432",
    shadowColor: "#215432",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mapBtnText: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#333333",
  },
});
