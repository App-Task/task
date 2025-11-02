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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ add this
import { useSafeAreaInsets } from "react-native-safe-area-context";


import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";



import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";




const { width, height } = Dimensions.get("window");

// Helper function to convert Arabic numerals to Western numerals
const convertToWesternNumerals = (str) => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = arabicNumerals.indexOf(char);
    result += index !== -1 ? westernNumerals[index] : char;
  }
  return result;
};

const rawCategories = [
  "Handyman",
  "Moving",
  "IKEA assembly",
  "Cleaning",
  "Shopping & Delivery",
  "Yardwork Services",
  "Dog Walking",
  "Other"
];
const openInGoogleMaps = async (lat, lng, labelRaw = "Task Location") => {
  try {
    const label = encodeURIComponent(labelRaw || "Task Location");
    const appUrl = `comgooglemaps://?q=${lat},${lng}(${label})&center=${lat},${lng}&zoom=14`;
    const canOpenApp = await Linking.canOpenURL(appUrl);
    if (canOpenApp) {
      await Linking.openURL(appUrl);
      return;
    }
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    await Linking.openURL(webUrl);
  } catch (e) {
    Alert.alert(t("common.errorTitle"), t("common.couldNotOpenMaps"));
  }
};


export default function PostTaskScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [budget, setBudget] = useState("");
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [posting, setPosting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const [categoryError, setCategoryError] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [descError, setDescError] = useState(false);
  const [houseNumberError, setHouseNumberError] = useState(false);
  const [streetNameError, setStreetNameError] = useState(false);
  const [cityError, setCityError] = useState(false);
  const [budgetError, setBudgetError] = useState(false);
  const insets = useSafeAreaInsets();


  const [coords, setCoords] = useState(null); // { latitude, longitude }

const [mapVisible, setMapVisible] = useState(false);
const [tempCoords, setTempCoords] = useState(null);   // used inside the modal
const [tempRegion, setTempRegion] = useState(null);   // MapView region while editing
  




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
    setMapVisible(true);
    if (coords) {
      setTempCoords(coords);
      setTempRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
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
};

const deleteImage = (index) => {
  const updatedImages = [...images];
  updatedImages.splice(index, 1);
  setImages(updatedImages);
};


  const handlePost = async () => {
    let hasError = false;

if (!selectedCategory) {
  setCategoryError(true);
  hasError = true;
} else {
  setCategoryError(false);
}

let errorFlag = false;

if (!title) {
  setTitleError(true);
  errorFlag = true;
} else {
  setTitleError(false);
}

if (!description) {
  setDescError(true);
  errorFlag = true;
} else {
  setDescError(false);
}

if (!houseNumber) {
  setHouseNumberError(true);
  errorFlag = true;
} else {
  setHouseNumberError(false);
}

if (!streetName) {
  setStreetNameError(true);
  errorFlag = true;
} else {
  setStreetNameError(false);
}

if (!city) {
  setCityError(true);
  errorFlag = true;
} else {
  setCityError(false);
}

if (!budget) {
  setBudgetError(true);
  errorFlag = true;
} else {
  setBudgetError(false);
}

if (!selectedCategory) {
  setCategoryError(true);
  errorFlag = true;
} else {
  setCategoryError(false);
}

if (!coords || !coords.latitude || !coords.longitude) {
  Alert.alert(t("common.locationRequired"), t("common.pleaseSelectLocation"));
  return;
}

if (errorFlag) {
  Alert.alert(t("clientPostTask.missingTitle"), t("clientPostTask.fillAllFields"));
  return;
}


    setCategoryError(false); // ✅ clear error once valid
    
  
    try {
      setPosting(true); // ✅ show overlay
  
      const userId = await SecureStore.getItemAsync("userId");
  
      if (!userId) {
        setPosting(false);
        Alert.alert(t("clientPostTask.errorTitle"), t("clientPostTask.userNotLoggedIn"));
        return;
      }

      // Combine address fields into a single location string
      const fullLocation = [houseNumber, streetName, city, state, zipCode]
        .filter(Boolean)
        .join(", ");
  
      // Convert Arabic numerals to Western numerals before parsing
      const westernBudget = convertToWesternNumerals(budget);
  
      const taskData = {
        title,
        description,
        location: fullLocation, // human-readable string shown in input
        budget: parseFloat(westernBudget),
        category: selectedCategory,
        images,
        userId,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        locationGeo: coords
          ? { type: "Point", coordinates: [coords.longitude, coords.latitude] }
          : null
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
  
      Alert.alert(
        t("clientPostTask.successTitle"),
        t("clientPostTask.successMessage"),
        [
          {
            text: t("clientPostTask.ok"),
            onPress: () => {
              setTimeout(() => {
                navigation.navigate("Home");
              }, 100);
            },
          },
        ]
      );
  
      setTitle("");
      setDescription("");
      setHouseNumber("");
      setStreetName("");
      setCity("");
      setState("");
      setZipCode("");
      setBudget("");
      setImages([]);
      setSelectedCategory(null);
    } catch (err) {
      console.error("❌ Post error:", err.message);
      Alert.alert(t("clientPostTask.errorTitle"), t("clientPostTask.postError"));
    } finally {
      setPosting(false); // ✅ always hide popup
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

<ScrollView
  style={{ flex: 1, backgroundColor: "#215432" }}  // ✅ green background for the whole scroll area
  contentContainerStyle={styles.container}
>

        <Text style={styles.heading}>{t("clientPostTask.title")}</Text>

        {/* Map at the top */}
        {coords && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              pointerEvents="none"
            >
              <Marker coordinate={coords} />
            </MapView>
            <TouchableOpacity style={styles.editLocationButton} onPress={openMapPicker}>
              <Text style={styles.editLocationText}>Edit Location on Map</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.formContainer}>
  <TextInput
      style={[styles.input, titleError && { borderColor: "#c00", borderWidth: 2 }]}
    placeholder={t("clientPostTask.taskTitlePlaceholder")}
    maxLength={15}
    placeholderTextColor="#999"
    value={title}
    onChangeText={setTitle}
    textAlign={I18nManager.isRTL ? "right" : "left"}
  />

<TextInput
  style={[styles.input, styles.textarea, descError && { borderColor: "#c00", borderWidth: 2 }]}
  placeholder={t("clientPostTask.taskDescPlaceholder")}
  placeholderTextColor="#999"
  value={description}
  onChangeText={(text) => {
    const lines = text.split("\n");
    if (lines.length <= 25) {
      setDescription(text);
    }
  }}
  multiline
  maxLength={1000} // Optional: just to avoid massive input
  textAlignVertical="top"
  textAlign={I18nManager.isRTL ? "right" : "left"}
/>


<TouchableOpacity
  style={[
    styles.categoryPicker,
    categoryError && { borderColor: "#c00", borderWidth: 2 }
  ]}
  onPress={() => setCategoryModalVisible(true)}
>

    <Text style={styles.uploadText}>
      {selectedCategory
        ? t(`clientPostTask.categories.${selectedCategory.toLowerCase()}`)
        : t("clientPostTask.selectCategory")}
    </Text>
  </TouchableOpacity>

  {/* Address fields */}
  <Text style={styles.sectionTitle}>{t("clientPostTask.addressSectionTitle")}</Text>
  
  <TextInput
    style={[styles.input, houseNumberError && { borderColor: "#c00", borderWidth: 2 }]}
    placeholder={t("clientPostTask.addressFields.houseNumber")}
    placeholderTextColor="#999"
    value={houseNumber}
    onChangeText={setHouseNumber}
    maxLength={20}
    textAlign={I18nManager.isRTL ? "right" : "left"}
  />

  <TextInput
    style={[styles.input, streetNameError && { borderColor: "#c00", borderWidth: 2 }]}
    placeholder={t("clientPostTask.addressFields.streetName")}
    placeholderTextColor="#999"
    value={streetName}
    onChangeText={setStreetName}
    maxLength={100}
    textAlign={I18nManager.isRTL ? "right" : "left"}
  />

  <TextInput
    style={[styles.input, cityError && { borderColor: "#c00", borderWidth: 2 }]}
    placeholder={t("clientPostTask.addressFields.city")}
    placeholderTextColor="#999"
    value={city}
    onChangeText={setCity}
    maxLength={50}
    textAlign={I18nManager.isRTL ? "right" : "left"}
  />

  <TextInput
    style={styles.input}
    placeholder={t("clientPostTask.addressFields.state")}
    placeholderTextColor="#999"
    value={state}
    onChangeText={setState}
    maxLength={50}
    textAlign={I18nManager.isRTL ? "right" : "left"}
  />

  <TextInput
    style={styles.input}
    placeholder={t("clientPostTask.addressFields.zipCode")}
    placeholderTextColor="#999"
    value={zipCode}
    onChangeText={setZipCode}
    maxLength={20}
    textAlign={I18nManager.isRTL ? "right" : "left"}
  />

  <TextInput
      style={[styles.input, budgetError && { borderColor: "#c00", borderWidth: 2 }]}

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


      {posting && (
  <View style={styles.postingOverlay}>
    <View style={styles.postingBox}>
      <Text style={styles.postingText}>{t("clientPostTask.postingNow")}</Text>
    </View>
  </View>
)}



{imageUploading && (
  <View style={styles.postingOverlay}>
    <View style={styles.postingBox}>
      <Text style={styles.postingText}>
        {t("clientPostTask.uploadingImage") || "Uploading image..."}
      </Text>
    </View>
  </View>
)}

<Modal visible={previewVisible} transparent animationType="fade">
  <View style={styles.previewModalContainer}>
    <TouchableOpacity
      style={styles.closeButton}
      onPress={() => setPreviewVisible(false)} //
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
  statusBarTranslucent={Platform.OS === "android"} // translucent only on Android
>
  {/* Use View + paddingTop=insets.top so the header is pushed down on first render */}
  <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
    <View style={styles.modalHeaderRow}>
      <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.modalBackBtn}>
        <Ionicons
          name={"arrow-back"}
          size={24}
          color="#215433"
        />
      </TouchableOpacity>
      <Text style={styles.modalHeader}>{t("clientPostTask.selectTaskLocation")}</Text>
      <View style={{ width: 24 }} />
    </View>

    <Text style={styles.modalHeaderSubtitle}>
      {t("clientPostTask.mapInstructions")}
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
        <Text style={styles.mapBtnText}>{t("clientPostTask.cancel")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.mapBtn, styles.mapConfirm]} onPress={confirmMapLocation}>
        <Text style={[styles.mapBtnText, { color: "#fff" }]}>{t("clientPostTask.confirmLocation")}</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 120,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: "#215432", // ✅ dark green background like the screenshot
    minHeight: height,
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 32,
    color: "#ffffff", // ✅ white text
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
    backgroundColor: "#ffffff", // White box like the screenshot
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd", // Light gray border
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  
  
  textarea: {
    height: 120,
  },
  categoryPicker: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  
  
  uploadBox: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#ffffff", // ✅ white background
    paddingVertical: 14,
    borderRadius: 30, // ✅ fully rounded like screenshot
    alignItems: "center",
    width: "100%",
    marginTop: 30,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432", // ✅ green text
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
    color: "#215433",
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
    color: "#215433",
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
    gap: 16, // equal spacing between all form elements
    marginBottom: 40,
  },

  // Map container at the top
  mapContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  map: {
    width: "100%",
    height: 200,
  },
  editLocationButton: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  editLocationText: {
    fontSize: 14,
    color: "#215432",
    fontFamily: "InterBold",
  },
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#ffffff",
    marginBottom: 16,
    marginTop: 8,
  },

  

  postingOverlay: {
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
  postingBox: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  postingText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
  },

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
  mapFooter: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  mapBtn: {
    flex: 1,
    paddingVertical: 14,
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
    color: "#215433",
  },
  mapHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  mapHeaderTitle: {
    fontSize: 20,
    fontFamily: "InterBold",
    color: "#215433",
    marginBottom: 4,
  },
  mapHeaderSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  modalHeaderRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 0,          // was 6; not needed with insets
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  
  modalBackBtn: {
    padding: 4,
  },
  modalHeader: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215433",
    textAlign: "center",
    flex: 1,
  },
  modalHeaderSubtitle: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  errorText: {
    color: "#c00",
    fontSize: 14,
    fontFamily: "Inter",
    marginTop: 4,
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  
});
