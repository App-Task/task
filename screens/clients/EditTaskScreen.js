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
    Alert.alert("Error", "Could not open Google Maps on this device.");
  }
};

export default function EditTaskScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const { task } = route.params;
  const taskId = task._id;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);

  // Location-related state
  const [coords, setCoords] = useState(null);
  const [gettingLoc, setGettingLoc] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);
  const [tempRegion, setTempRegion] = useState(null);
  const [coordsError, setCoordsError] = useState(false);

  const [errors, setErrors] = useState({
    title: false,
    description: false,
    location: false,
    price: false,
  });

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
      setMapVisible(true);

      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Needed", "Location permission is required to select a location on the map.");
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
      Alert.alert("Error", "Could not open map picker.");
    }
  };

  // Confirm the location chosen in the modal
  const confirmMapLocation = async () => {
    if (!tempCoords) return;
    setCoords(tempCoords);
    setCoordsError(false);
    await applyReverseGeocode(tempCoords.latitude, tempCoords.longitude);
    setMapVisible(false);
  };

  useEffect(() => {
    const loadTask = async () => {
      try {
        const task = await getTaskById(taskId);
        setTitle(task.title || "");
        setDescription(task.description || "");
        setLocation(task.location || "");
        setPrice(task.budget?.toString() || "");
        
        // Load coordinates from existing task
        if (task.latitude && task.longitude) {
          setCoords({ latitude: task.latitude, longitude: task.longitude });
        } else if (task.locationGeo?.coordinates) {
          setCoords({ 
            latitude: task.locationGeo.coordinates[1], 
            longitude: task.locationGeo.coordinates[0] 
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
      location: !location.trim(),
      price: !price.trim(),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      Alert.alert(t("clientEditTask.missingTitle"), t("clientEditTask.missingFields"));
      return;
    }

    // Check if coordinates are set
    if (!coords || !coords.latitude || !coords.longitude) {
      setCoordsError(true);
      Alert.alert("Location Required", "Please select a location using the map or current location.");
      return;
    }

    try {
      await updateTaskById(taskId, {
        title,
        description,
        location,
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={30} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>{t("clientEditTask.heading")}</Text>

        {/* Key the ScrollView to language so placeholders refresh on switch */}
        <ScrollView key={i18n.language} contentContainerStyle={styles.container}>
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
          />

          <TextInput
            style={[styles.input, dirStyle, errors.location && styles.errorInput]}
            placeholder={t("clientEditTask.placeholders.location")}
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              if (errors.location && text.trim()) {
                setErrors((prev) => ({ ...prev, location: false }));
              }
            }}
            maxLength={100}
            placeholderTextColor="#999"
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
                    setCoordsError(false);
                    return;
                  }
                }
                const res = await Location.geocodeAsync(location);
                if (res && res[0]) {
                  setCoords({ latitude: res[0].latitude, longitude: res[0].longitude });
                  setCoordsError(false);
                }
              } catch (e) {
                // ignore; user can still pick on map
              }
            }}
          />

          {coordsError && (
            <Text style={styles.errorText}>
              Please select a location on Google Maps
            </Text>
          )}

          {/* Location buttons with equal spacing */}
          <View style={styles.locationButtonsContainer}>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={async () => {
                try {
                  setGettingLoc(true);
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status !== "granted") {
                    Alert.alert("Permission Needed", "Location permission is required to use your current location.");
                    return;
                  }
            
                  const pos = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                  });
            
                  const { latitude, longitude } = pos.coords;
                  setCoords({ latitude, longitude });
                  setCoordsError(false);
            
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
                  Alert.alert("Error", "Could not get your current location.");
                } finally {
                  setGettingLoc(false);
                }
              }}
            >
              <Text style={styles.locationButtonText}>
                {gettingLoc ? "Locating..." : "Use Current Location"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.locationButton}
              onPress={openMapPicker}
            >
              <Text style={styles.locationButtonText}>Edit Location</Text>
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
            </View>
          )}

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
          />

          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>{t("clientEditTask.save")}</Text>
          </TouchableOpacity>
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
  safeArea: { flex: 1, backgroundColor: "#215432" }, // same green background
  container: {
    paddingTop: 20,  // slightly less because header is now separate
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
    marginBottom: 10, // space below arrow
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
    marginTop: 60, // space above heading
    textAlign: "left",
    paddingHorizontal: 24, // aligns with arrow
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
  textarea: { textAlignVertical: "top", height: 120 },
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
  locationButtonsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  locationButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  locationButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#333",
  },
  mapPreviewContainer: {
    height: 200,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  mapPreview: {
    flex: 1,
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
