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
  Dimensions,
  Modal,
  I18nManager,
  Linking,
} from "react-native";

import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getTaskById, updateTaskById } from "../../services/taskService";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

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

export default function EditTaskScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const { task } = route.params;
  const taskId = task._id;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);

  // Location-related state
  const [coords, setCoords] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);
  const [tempRegion, setTempRegion] = useState(null);

  const [errors, setErrors] = useState({
    title: false,
    description: false,
    houseNumber: false,
    streetName: false,
    city: false,
    price: false,
  });

  // Get current location automatically when component mounts
  useEffect(() => {
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
      Alert.alert(t("common.errorTitle"), t("common.couldNotOpenMapPicker"));
    }
  };

  // Confirm the location chosen in the modal
  const confirmMapLocation = async () => {
    if (!tempCoords) return;
    setCoords(tempCoords);
    setMapVisible(false);
  };

  useEffect(() => {
    const loadTask = async () => {
      try {
        const task = await getTaskById(taskId);
        setTitle(task.title || "");
        setDescription(task.description || "");
        
        // Parse existing location into separate fields if available
        if (task.location) {
          // Try to parse existing location string into components
          const locationParts = task.location.split(',').map(part => part.trim());
          if (locationParts.length >= 3) {
            setHouseNumber(locationParts[0] || "");
            setStreetName(locationParts[1] || "");
            setCity(locationParts[2] || "");
            if (locationParts.length >= 4) setState(locationParts[3] || "");
            if (locationParts.length >= 5) setZipCode(locationParts[4] || "");
          } else {
            // Fallback: put everything in street name
            setStreetName(task.location);
          }
        }
        
        setPrice(task.budget?.toString() || "");
        
        // Load coordinates from existing task
        if (task.latitude && task.longitude) {
          setCoords({ latitude: task.latitude, longitude: task.longitude });
          setTempRegion({
            latitude: task.latitude,
            longitude: task.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else if (task.locationGeo?.coordinates) {
          const lat = task.locationGeo.coordinates[1];
          const lng = task.locationGeo.coordinates[0];
          setCoords({ latitude: lat, longitude: lng });
          setTempRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (err) {
        Alert.alert(t("common.errorTitle"), t("clientEditTask.loadError"));
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [taskId, t]);

  const handleUpdate = async () => {
    const newErrors = {
      title: !title.trim(),
      description: !description.trim(),
      houseNumber: !houseNumber.trim(),
      streetName: !streetName.trim(),
      city: !city.trim(),
      price: !price.trim(),
      // Note: state and zipCode remain optional
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      Alert.alert(t("clientEditTask.missingTitle"), t("clientEditTask.missingFields"));
      return;
    }

    // Check if coordinates are set
    if (!coords || !coords.latitude || !coords.longitude) {
      Alert.alert(t("common.locationRequired"), t("common.pleaseSelectLocation"));
      return;
    }

    // Combine address fields into a single location string
    const fullLocation = [houseNumber, streetName, city, state, zipCode]
      .filter(Boolean)
      .join(", ");

    try {
      await updateTaskById(taskId, {
        title,
        description,
        location: fullLocation,
        budget: price,
        latitude: coords.latitude,
        longitude: coords.longitude,
        locationGeo: {
          type: "Point",
          coordinates: [coords.longitude, coords.latitude]
        }
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert(t("common.errorTitle"), t("clientEditTask.updateError"));
    }
  };

  if (loading) return <Text style={{ marginTop: 100, textAlign: "center" }}>Loading...</Text>;

  const dirStyle = { writingDirection: i18n.language?.startsWith("ar") ? "rtl" : "ltr" };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={30} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>{t("clientEditTask.heading")}</Text>

        {/* ScrollView with all content including map */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Map inside the scroll view */}
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

          {/* Form fields */}
          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, dirStyle, errors.title && styles.errorInput]}
              placeholder={t("clientEditTask.placeholders.title")}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title && text.trim()) {
                  setErrors((prev) => ({ ...prev, title: false }));
                }
              }}
              maxLength={30}
              placeholderTextColor="#999"
              returnKeyType="next"
            />

            <TextInput
              style={[styles.input, styles.textarea, dirStyle, errors.description && styles.errorInput]}
              placeholder={t("clientEditTask.placeholders.description")}
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
              returnKeyType="next"
            />

            {/* Address fields */}
            <Text style={styles.sectionTitle}>{t("clientPostTask.addressSectionTitle")}</Text>
            
            <TextInput
              style={[styles.input, dirStyle, errors.houseNumber && styles.errorInput]}
              placeholder={t("clientPostTask.addressFields.houseNumber")}
              value={houseNumber}
              onChangeText={(text) => {
                setHouseNumber(text);
                if (errors.houseNumber && text.trim()) {
                  setErrors((prev) => ({ ...prev, houseNumber: false }));
                }
              }}
              maxLength={20}
              placeholderTextColor="#999"
              returnKeyType="next"
            />

            <TextInput
              style={[styles.input, dirStyle, errors.streetName && styles.errorInput]}
              placeholder={t("clientPostTask.addressFields.streetName")}
              value={streetName}
              onChangeText={(text) => {
                setStreetName(text);
                if (errors.streetName && text.trim()) {
                  setErrors((prev) => ({ ...prev, streetName: false }));
                }
              }}
              maxLength={100}
              placeholderTextColor="#999"
              returnKeyType="next"
            />

            <TextInput
              style={[styles.input, dirStyle, errors.city && styles.errorInput]}
              placeholder={t("clientPostTask.addressFields.city")}
              value={city}
              onChangeText={(text) => {
                setCity(text);
                if (errors.city && text.trim()) {
                  setErrors((prev) => ({ ...prev, city: false }));
                }
              }}
              maxLength={50}
              placeholderTextColor="#999"
              returnKeyType="next"
            />

            <TextInput
              style={[styles.input, dirStyle]}
              placeholder={t("clientPostTask.addressFields.state")}
              value={state}
              onChangeText={setState}
              maxLength={50}
              placeholderTextColor="#999"
              returnKeyType="next"
            />

            <TextInput
              style={[styles.input, dirStyle]}
              placeholder={t("clientPostTask.addressFields.zipCode")}
              value={zipCode}
              onChangeText={setZipCode}
              maxLength={20}
              placeholderTextColor="#999"
              returnKeyType="next"
            />

            {/* Budget section - separated from address */}
            <Text style={styles.sectionTitle}>{t("clientPostTask.budgetSectionTitle")}</Text>
            
            <TextInput
              style={[styles.input, dirStyle, errors.price && styles.errorInput]}
              placeholder={t("clientEditTask.placeholders.price", { currency: "BHD" })}
              value={price}
              onChangeText={(text) => {
                setPrice(text);
                if (errors.price && text.trim()) {
                  setErrors((prev) => ({ ...prev, price: false }));
                }
              }}
              keyboardType="numeric"
              placeholderTextColor="#999"
              returnKeyType="done"
            />

            <TouchableOpacity style={styles.button} onPress={handleUpdate}>
              <Text style={styles.buttonText}>{t("clientEditTask.save")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Map Picker Modal */}
        <Modal
          visible={mapVisible}
          animationType="slide"
          transparent={false}
          presentationStyle="fullScreen"
          statusBarTranslucent={Platform.OS === "android"}
        >
          <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.modalBackBtn}>
                <Ionicons
                  name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
                  size={24}
                  color="#215433"
                />
              </TouchableOpacity>
              <Text style={styles.modalHeader}>Select Task Location</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.modalHeaderSubtitle}>
              Tap on the map to select your task location
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
                <Text style={styles.mapBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mapBtn, styles.mapConfirm]} onPress={confirmMapLocation}>
                <Text style={[styles.mapBtnText, { color: "#fff" }]}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#215432" },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
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
    marginTop: 60,
    textAlign: "left",
    paddingHorizontal: 24,
  },
  // Map container inside scroll view
  mapContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
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
  formContainer: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#ffffff",
    marginBottom: 16,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#ffffff",
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
  textarea: { 
    textAlignVertical: "top", 
    height: 120,
    paddingTop: 14,
  },
  button: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
    marginTop: 30,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432",
  },
  errorInput: {
    borderWidth: 1,
    borderColor: "#ff4d4d",
  },
  errorText: {
    color: "#ff4d4d",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
    textAlign: "center",
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  modalBackBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeader: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215433",
    flex: 1,
    textAlign: "center",
  },
  modalHeaderSubtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 24,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  mapFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  mapBtn: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#215432",
  },
  mapCancel: {
    backgroundColor: "#ffffff",
    borderColor: "#215432",
    borderWidth: 1,
  },
  mapConfirm: {
    backgroundColor: "#215432",
  },
  mapBtnText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432",
  },
});
