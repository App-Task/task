import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  I18nManager,
  StyleSheet,
  Dimensions,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const { height } = Dimensions.get("window");

export default function TaskDetailsScreen({ route }) {
  const { task: initialTask } = route.params;
  const [task, setTask] = useState(initialTask);
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingBid, setLoadingBid] = useState(true);
  const isBiddingAllowed = task.status === "Pending";

  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);

  // ---- keyboard & scrolling helpers
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef(null);
  const positionsRef = useRef({ amount: 0, message: 0 });

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

  const scrollToKey = (key) => {
    const y = positionsRef.current[key] ?? 0;
    const extraOffset = 140; // push a bit higher above the keyboard
    scrollRef.current?.scrollTo({ y: Math.max(0, y - extraOffset), animated: true });
  };
  // ----

  // Remove the current location fallback - we only want task coordinates
  // useEffect(() => {
  //   const getCurrentLocation = async () => {
  //     try {
  //       const { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== "granted") {
  //         console.log("Location permission denied");
  //         return;
  //       }
  //       
  //       const pos = await Location.getCurrentPositionAsync({
  //         accuracy: Location.Accuracy.Balanced,
  //       });
  //       
  //       const { latitude, longitude } = pos.coords;
  //       // Only set current location as fallback if no task coordinates exist
  //       if (!coords) {
  //         setCoords({ latitude, longitude });
  //       }
  //     } catch (e) {
  //       console.log("get current location error", e);
  //     }
  //   };
  //   
  //   getCurrentLocation();
  // }, []);

  const openInGoogleMaps = async (lat, lng, labelRaw = "Task Location") => {
    try {
      const label = encodeURIComponent(labelRaw || "Task Location");
      const appUrl = `comgooglemaps://?q=${lat},${lng}(${label})&center=${lat},${lng}&zoom=14`;
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) return Linking.openURL(appUrl);
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      await Linking.openURL(webUrl);
    } catch (e) {
      Alert.alert(t("common.errorTitle"), t("common.couldNotOpenMaps"));
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const user = await fetchCurrentUser();
        if (isMounted) setIsVerified(user.isVerified);

        const res = await axios.get(`https://task-kq94.onrender.com/api/bids/tasker/${user._id}`);
        const bids = res.data;
        const foundBid = bids.find(
          (b) => b.taskId?._id === task._id || b.taskId === task._id
        );

        if (foundBid && isMounted) {
          setExistingBid(foundBid);
          setBidAmount(String(foundBid.amount));
          setMessage(foundBid.message);
        }
      } catch (err) {
        console.error("❌ Failed to check user or bid:", err.message);
      } finally {
        if (isMounted) setLoadingBid(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchFullTask = async () => {
      try {
        const res = await axios.get(
          `https://task-kq94.onrender.com/api/tasks/${initialTask._id}`
        );
        setTask(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch full task:", err.message);
      }
    };
    fetchFullTask();
  }, []);

  // Only use task coordinates - no fallback to user location
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // First priority: Use task's exact coordinates if available
        if (typeof task?.latitude === "number" && typeof task?.longitude === "number") {
          if (!cancelled) {
            setCoords({ latitude: task.latitude, longitude: task.longitude });
          }
          return;
        }
        
        // Second priority: Try to parse coordinates from location string
        if (typeof task?.location === "string") {
          const match = task.location.match(/-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?/);
          if (match) {
            const [lat, lng] = match[0].split(",").map((v) => parseFloat(v.trim()));
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              if (!cancelled) {
                setCoords({ latitude: lat, longitude: lng });
              }
              return;
            }
          }
        }
        
        // Third priority: Geocode the location string
        if (task?.location && task.location.trim()) {
          try {
            const results = await Location.geocodeAsync(task.location);
            if (results && results[0] && !cancelled) {
              setCoords({ latitude: results[0].latitude, longitude: results[0].longitude });
              return;
            }
          } catch (e) {
            // Geocoding failed, continue to next option
          }
        }
        
        // No task coordinates found - don't set any coordinates
        if (!cancelled) {
          setCoords(null);
        }
        
      } catch (e) {
        if (!cancelled) {
          setGeoError(e.message || "Failed to get task location");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task?.location, task?.latitude, task?.longitude]);

  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [existingBid, setExistingBid] = useState(null);

  const handleBid = async () => {
    if (existingBid) {
      Alert.alert(t("taskerTaskDetails.alreadyBidTitle"), t("taskerTaskDetails.alreadyBidMessage"));
      return;
    }
    if (!bidAmount || !message) {
      Alert.alert(t("taskerTaskDetails.errorTitle"), t("taskerTaskDetails.fillFields"));
      return;
    }
    if (Number(bidAmount) < 0.1) {
      Alert.alert(t("taskerTaskDetails.invalidBidTitle"), t("taskerTaskDetails.invalidBidMessage"));
      return;
    }
    try {
      setSubmitting(true);
      const user = await fetchCurrentUser();
      if (!user.isVerified) {
        setSubmitting(false);
        Alert.alert(t("taskerTaskDetails.accessDeniedTitle"), t("taskerTaskDetails.accessDeniedMessage"));
        return;
      }
      await axios.post("https://task-kq94.onrender.com/api/bids", {
        taskId: task._id,
        taskerId: user._id,
        amount: Number(bidAmount),
        message,
      });
      setSubmitting(false);
      Alert.alert(t("taskerTaskDetails.successTitle"), t("taskerTaskDetails.bidSent"), [
        {
          text: t("taskerTaskDetails.ok"),
          onPress: () => {
            navigation.setParams({ refresh: true });
            navigation.goBack();
          },
        },
      ]);
      setBidAmount("");
      setMessage("");
    } catch (err) {
      console.error("❌ Bid error:", err.message);
      setSubmitting(false);
      Alert.alert(t("taskerTaskDetails.errorTitle"), t("taskerTaskDetails.bidSubmitError"));
    }
  };

  const handleUpdateBid = async () => {
    if (!existingBid) {
      Alert.alert(t("taskerTaskDetails.noBidFoundTitle"), t("taskerTaskDetails.noBidFoundMessage"));
      return;
    }
    if (task.status !== "Pending") {
      Alert.alert(t("taskerTaskDetails.cannotEditTitle"), t("taskerTaskDetails.cannotEditMessage"));
      return;
    }
    if (!bidAmount || !message) {
      Alert.alert(t("taskerTaskDetails.errorTitle"), t("taskerTaskDetails.fillFields"));
      return;
    }
    if (Number(bidAmount) < 0.1) {
      Alert.alert(t("taskerTaskDetails.invalidBidTitle"), t("taskerTaskDetails.invalidBidMessage"));
      return;
    }
    try {
      setSubmitting(true);
      const res = await axios.patch(
        `https://task-kq94.onrender.com/api/bids/${existingBid._id}`,
        { amount: Number(bidAmount), message }
      );
      Alert.alert(t("taskerTaskDetails.successTitle"), t("taskerTaskDetails.bidSent"), [
        { text: t("taskerTaskDetails.ok"), onPress: () => navigation.goBack() },
      ]);
      setExistingBid(res.data);
    } catch (err) {
      console.error("❌ Update bid error:", err.message);
      Alert.alert(t("taskerTaskDetails.errorTitle"), t("taskerTaskDetails.bidUpdateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return { backgroundColor: "#4CAF50" };
      case "Pending":
        return { backgroundColor: "#FF9800" };
      case "Started":
        return { backgroundColor: "#FFEB3B" };
      case "Cancelled":
        return { backgroundColor: "#F44336" };
      default:
        return { backgroundColor: "#999" };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity
        style={[styles.backButton, I18nManager.isRTL && { alignSelf: "flex-end" }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons
          name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
          size={30}
          color="#215433"
        />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "height" : undefined}
        keyboardVerticalOffset={0}
      >
<ScrollView
  ref={scrollRef}
  style={{ flex: 1, backgroundColor: "#215432" }}   // ⬅️ paint the scroller
  contentContainerStyle={[
    styles.container,
    {
      flexGrow: 1,
      minHeight: height + (kbHeight || 0),           // ⬅️ always taller than viewport + keyboard
      paddingBottom: (kbHeight || 0),                // ⬅️ so green covers under the keyboard
    },
  ]}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="interactive"
  contentInsetAdjustmentBehavior="never"             // ⬅️ iOS: no auto inset (prevents white peek)
  bounces={false}                                     // ⬅️ iOS: no bounce to reveal white
  alwaysBounceVertical={false}                        // ⬅️ iOS: extra safety
  overScrollMode="never"                              // ⬅️ Android: no overscroll glow/peek
>

          {/* Top header content */}
{/* Top header content */}
<View style={[styles.topContent, { backgroundColor: "#ffffff" }]}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heading}>{task.title}</Text>
                <Text style={styles.subText}>
                  {t("taskerTaskDetails.price")}: {task.budget} BHD
                </Text>
                <Text style={styles.subText}>
                  {new Date(task.createdAt).toLocaleDateString(
                    I18nManager.isRTL ? "ar-SA" : "en-GB",
                    { year: "numeric", month: "short", day: "numeric" }
                  )}{" "}
                  •{" "}
                  {new Date(task.createdAt).toLocaleTimeString(
                    I18nManager.isRTL ? "ar-SA" : "en-GB",
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </Text>
              </View>
              <View style={[styles.statusBadge, getStatusStyle(task.status)]}>
                <Text style={styles.statusText}>{task.status}</Text>
              </View>
            </View>
          </View>

          {/* GREEN SHEET – edge-to-edge, rounded top, seamless to bottom */}
          <View style={[styles.detailsBox, { flexGrow: 1 }]}>
            {/* Description */}
            <Text style={styles.detailsText}>
              <Text style={{ fontFamily: "InterBold" }}>
                {t("taskerTaskDetails.description")}:{" "}
              </Text>
              {task.description || "-"}
            </Text>

            {/* Images */}
            <Text style={[styles.detailsText, { marginTop: 12, fontFamily: "InterBold" }]}>
              {t("taskerTaskDetails.images")}:
            </Text>
            <View style={styles.imageRow}>
              {task.images?.length > 0 ? (
                task.images.map((uri, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelectedImage(uri)}>
                    <Image source={{ uri }} style={styles.image} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.detailsText}>{t("taskerTaskDetails.noImages")}</Text>
              )}
            </View>

            {/* Location text */}
            <Text style={[styles.detailsText, { marginTop: 12, fontFamily: "InterBold" }]}>
              {t("taskerTaskDetails.location") || "Location"}:
            </Text>
            <Text style={styles.detailsText}>
              {task.location || "Location not specified"}
            </Text>

            {/* Map below location text */}
            {coords ? (
              <View style={styles.mapContainer}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    openInGoogleMaps(
                      coords.latitude,
                      coords.longitude,
                      task?.title || "Task Location"
                    )
                  }
                >
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
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.mapContainer, styles.mapLoading]}>
                <Text style={styles.mapLoadingText}>
                  {geoError ? "Location unavailable" : "No location data available for this task"}
                </Text>
              </View>
            )}

            {/* Bid inputs */}
            <Text
              style={[styles.detailsText, { marginTop: 12, fontFamily: "InterBold" }]}
            >
              {t("taskerTaskDetails.enterBid")}:
            </Text>

            <View
              onLayout={(e) => {
                positionsRef.current.amount = e.nativeEvent.layout.y;
              }}
            >
              <TextInput
                style={[
                  styles.input,
                  !isBiddingAllowed && { backgroundColor: "#ccc", color: "#666" },
                ]}
                placeholder={t("taskerTaskDetails.bidAmount")}
                value={bidAmount}
                onChangeText={isBiddingAllowed ? setBidAmount : undefined}
                keyboardType="numeric"
                editable={isBiddingAllowed}
                selectTextOnFocus={isBiddingAllowed}
                placeholderTextColor="#999"
                textAlign={I18nManager.isRTL ? "right" : "left"}
                onFocus={() => scrollToKey("amount")}
              />
            </View>

            <View
              onLayout={(e) => {
                positionsRef.current.message = e.nativeEvent.layout.y;
              }}
            >
              <TextInput
                style={[
                  styles.input,
                  styles.textarea,
                  !isBiddingAllowed && { backgroundColor: "#ccc", color: "#666" },
                ]}
                placeholder={t("taskerTaskDetails.bidMessage")}
                value={message}
                onChangeText={isBiddingAllowed ? setMessage : undefined}
                editable={isBiddingAllowed}
                selectTextOnFocus={isBiddingAllowed}
                multiline
                maxLength={150}
                textAlignVertical="top"
                placeholderTextColor="#999"
                textAlign={I18nManager.isRTL ? "right" : "left"}
                onFocus={() => scrollToKey("message")}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.whiteButton,
                (!isVerified || !isBiddingAllowed) && { backgroundColor: "#ccc" },
              ]}
              onPress={
                isBiddingAllowed ? (existingBid ? handleUpdateBid : handleBid) : null
              }
              disabled={!isVerified || !isBiddingAllowed}
            >
              <Text style={styles.whiteButtonText}>
                {!isBiddingAllowed
                  ? t("taskerTaskDetails.biddingClosed")
                  : existingBid
                  ? t("taskerTaskDetails.updateBid")
                  : t("taskerTaskDetails.submitBid")}
              </Text>
            </TouchableOpacity>

            {/* THIS spacer extends the green sheet to cover under the keyboard */}
            <View style={{ height: kbHeight }} />
          </View>

          {/* Image full screen preview */}
          {selectedImage && (
            <View style={styles.fullScreenOverlay}>
              <TouchableOpacity
                style={styles.closeBtnWhite}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close" size={26} color="#000" />
              </TouchableOpacity>
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {submitting && (
        <View style={styles.submittingOverlay}>
          <View style={styles.submittingBox}>
            <Text style={styles.submittingText}>
              {t("taskerTaskDetails.submittingBid")}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },

  backButton: { paddingHorizontal: 16, paddingTop: 10 },
  container: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 0, // let green sheet own the bottom
  },
  
  topContent: { marginTop: 10, marginBottom: 16 },
  topRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 26,
    color: "#215433",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  subText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
    fontWeight: "900",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: I18nManager.isRTL ? "flex-end" : "flex-start",
  },
  statusText: { color: "#fff", fontFamily: "InterBold", fontSize: 13 },

  /** EDGE‑TO‑EDGE GREEN SHEET **/
  detailsBox: {
    backgroundColor: "#215432",
    paddingTop: 16,
    paddingBottom: 24,
    marginTop: 16,
    marginHorizontal: -24, // full-bleed
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24, // keep inner gutters
    minHeight: height * 0.7,
  },

  detailsText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  imageRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    marginTop: 6,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: I18nManager.isRTL ? 0 : 8,
    marginLeft: I18nManager.isRTL ? 8 : 0,
  },

  // Map container below location text
  mapContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  map: {
    width: "100%",
    height: 180,
  },
  mapLoading: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  mapLoadingText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
  },

  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginTop: 10,
    marginBottom: 12,
  },
  textarea: { height: 120 },

  whiteButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  whiteButtonText: { color: "#215432", fontFamily: "InterBold", fontSize: 15 },

  fullScreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  fullScreenImage: { width: "100%", height: "100%" },
  closeBtnWhite: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  submittingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  submittingBox: {
    backgroundColor: "#ffffff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  submittingText: { fontFamily: "InterBold", fontSize: 16, color: "#215433" },
});
