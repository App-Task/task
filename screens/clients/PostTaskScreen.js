import React, { useState, useEffect } from "react";
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
  Keybaord,
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
    Alert.alert("Error", "Could not open Google Maps on this device.");
  }
};


export default function PostTaskScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
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
  const [locationError, setLocationError] = useState(false);
  const [budgetError, setBudgetError] = useState(false);
  const [coordsError, setCoordsError] = useState(false);
  const insets = useSafeAreaInsets();


  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [gettingLoc, setGettingLoc] = useState(false);

const [mapVisible, setMapVisible] = useState(false);

// ⬇️ keep track of keyboard height so the green background extends under it
const [kbHeight, setKbHeight] = useState(0);
useEffect(() => {
  const showSub = Keyboard.addListener(
    Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
    (e) => setKbHeight(e.endCoordinates?.height ?? 0)
  );
  const hideSub = Keyboard.addListener(
    Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
    () => setKbHeight(0)
  );
  return () => {
    showSub.remove();
    hideSub.remove();
  };
}, []);

const [tempCoords, setTempCoords] = useState(null);   // used inside the modal
const [tempRegion, setTempRegion] = useState(null);   // MapView region while editing
  




// Helper: reverse geocode and set the address field
const applyReverseGeocode = async (lat, lng) => {
  try {
    const placemarks = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (placemarks?.length) {
      const p = placemarks[0];
      const nice = [p.name, p.street, p.subregion, p.city, p.region, p.country]
        .filter(Boolean)
        .join(", ");
      setLocation(nice || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } else {
      setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  } catch {
    setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  }
};

// Open the map picker; if no coords yet, get current location first
const openMapPicker = async () => {
  try {
    // ✅ show UI immediately so safe-area applies on first open
    setMapVisible(true);

    if (!coords) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("clientPostTask.permissionNeeded"), t("clientPostTask.mapPermissionMessage"));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setCoords({ latitude, longitude });
      setTempCoords({ latitude, longitude });
      setTempRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
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
  setCoordsError(false); // Clear error when coordinates are set
  await applyReverseGeocode(tempCoords.latitude, tempCoords.longitude);
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

if (!location) {
  setLocationError(true);
  errorFlag = true;
} else {
  setLocationError(false);
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
  setCoordsError(true);
  errorFlag = true;
} else {
  setCoordsError(false);
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
  
      const taskData = {
        title,
        description,
        location, // human-readable string shown in input
        budget: parseFloat(budget),
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
      setLocation("");
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
<SafeAreaView style={{ flex: 1, backgroundColor: "#215432" }} edges={['top','bottom']}>
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "height" : undefined}
  style={{ flex: 1, backgroundColor: "#215432" }}
  keyboardVerticalOffset={0}
>


<ScrollView
  style={{ flex: 1, backgroundColor: "#215432" }}
  contentContainerStyle={[
    styles.container,
    {
      // ensure content always taller than the viewport + keyboard + bottom inset
      minHeight: height + (kbHeight || 0) + insets.bottom,
      paddingBottom: (kbHeight || insets.bottom) + 40,
    },
  ]}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="interactive"
  // prevent white overscroll glow/peek
  contentInsetAdjustmentBehavior="never"   // iOS
  bounces={false}                           // iOS
  alwaysBounceVertical={false}              // iOS
  overScrollMode="never"                    // Android
>



        <Text style={styles.heading}>{t("clientPostTask.title")}</Text>

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
  <TextInput
  style={[styles.input, locationError && { borderColor: "#c00", borderWidth: 2 }]}
  placeholder={t("clientPostTask.enterAddress")}
  placeholderTextColor="#999"
  value={location}
  onChangeText={setLocation}
  onBlur={async () => {
    // When the user types an address manually, geocode it to set coords
    try {
      if (!location) return;
      // If user pasted "lat,lng" set coords directly
      const match = location.match(/-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?/);
      if (match) {
        const [lat, lng] = match[0].split(",").map(v => parseFloat(v.trim()));
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          setCoords({ latitude: lat, longitude: lng });
          setCoordsError(false); // Clear error when coordinates are set
          return;
        }
      }
      const res = await Location.geocodeAsync(location);
      if (res && res[0]) {
        setCoords({ latitude: res[0].latitude, longitude: res[0].longitude });
        setCoordsError(false); // Clear error when coordinates are set
      }
    } catch (e) {
      // ignore; user can still pick on map
    }
  }}
  textAlign={I18nManager.isRTL ? "right" : "left"}
/>

  {coordsError && (
    <Text style={styles.errorText}>
      {t("clientPostTask.locationRequired", "Please select a location on Google Maps")}
    </Text>
  )}
  
  {/* Location buttons with equal spacing */}
  <View style={[styles.locationButtonsContainer, coordsError && { borderColor: "#c00", borderWidth: 2, borderRadius: 10, padding: 8 }]}>
    <TouchableOpacity
      style={[styles.locationButton, coordsError && { borderColor: "#c00", borderWidth: 1 }]}
      onPress={async () => {
        try {
          setGettingLoc(true);
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(t("clientPostTask.permissionNeeded"), t("clientPostTask.locationPermissionMessage"));
            return;
          }
    
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
    
          const { latitude, longitude } = pos.coords;
          setCoords({ latitude, longitude });
          setCoordsError(false); // Clear error when coordinates are set
    
          // Reverse geocode to fill the address
          const placemarks = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (placemarks?.length) {
            const p = placemarks[0];
            const nice = [p.name, p.street, p.subregion, p.city, p.region, p.country]
              .filter(Boolean)
              .join(", ");
            setLocation(nice || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          } else {
            setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        } catch (e) {
          console.log("get location error", e);
          Alert.alert(t("clientPostTask.errorTitle"), t("clientPostTask.locationError"));
        } finally {
          setGettingLoc(false);
        }
      }}
    >
      <Text style={styles.locationButtonText}>
        {gettingLoc ? t("clientPostTask.locating") : t("clientPostTask.useCurrentLocation")}
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.locationButton, coordsError && { borderColor: "#c00", borderWidth: 1 }]}
      onPress={openMapPicker}
    >
      <Text style={styles.locationButtonText}>{t("clientPostTask.selectOnMap")}</Text>
    </TouchableOpacity>
  </View>
  
  {/* Map preview if coordinates are set */}
  {coords && (
  <View style={styles.mapPreviewContainer}>
    <View style={styles.mapPreview}>
      <MapView
        style={{ flex: 1 }}
        pointerEvents="none"
        region={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={coords} />
      </MapView>
    </View>

    <TouchableOpacity
      style={styles.editLocationButton}
      onPress={openMapPicker}
    >
      <Text style={styles.editLocationText}>{t("clientPostTask.editLocation")}</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.editLocationButton, { marginTop: 6, backgroundColor: "#e7f0e9" }]}
      onPress={() =>
        openInGoogleMaps(
          coords.latitude,
          coords.longitude,
          title || "Task Location"
        )
      }
    >
<Text style={styles.editLocationText}>
  {t("clientPostTask.openInGoogleMaps")}
</Text>

    </TouchableOpacity>
  </View>
)}



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
          name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
          size={24}
          color="#213729"
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
  </SafeAreaView>
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
    textAlign: "left",
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
    gap: 16, // equal spacing between all form elements
    marginBottom: 40,
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
    color: "#213729",
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
    flexDirection: "row",
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
    color: "#213729",
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
    color: "#213729",
    marginBottom: 4,
  },
  mapHeaderSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  mapPreviewContainer: {
    marginTop: 10,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  mapPreview: {
    width: "100%",
    height: 180,
  },
  editLocationButton: {
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  editLocationText: {
    fontSize: 14,
    color: "#215432",
    fontFamily: "InterBold",
  },
  locationButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  locationButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  locationButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#333",
  },
  imagePreviewContainer: {
    marginTop: 8,
    marginBottom: 8,
  },

  
  modalHeaderRow: {
    flexDirection: "row",
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
    color: "#213729",
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
