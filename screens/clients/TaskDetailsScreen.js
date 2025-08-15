import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  I18nManager,
  Linking,                   // ✅ ADDED
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getTaskById } from "../../services/taskService";
import { useIsFocused } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

// ✅ ADDED for map & geocoding
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

export default function TaskDetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { task: initialTask } = route.params;

  const [task, setTask] = useState(initialTask);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [bids, setBids] = useState([]);
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // ✅ ADDED
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    if (isFocused) {
      fetchTask();
    }
  }, [isFocused]);

  const fetchTask = async () => {
    try {
      const freshTask = await getTaskById(initialTask._id);
      setTask(freshTask);

      const res = await fetch(`https://task-kq94.onrender.com/api/bids/task/${initialTask._id}`);
      const bidData = await res.json();
      setBids(bidData);
    } catch (err) {
      console.error("❌ Task fetch failed:", err.message);
      Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.loadTaskError"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADDED: derive coords from task
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (typeof task?.latitude === "number" && typeof task?.longitude === "number") {
          if (!cancelled) setCoords({ latitude: task.latitude, longitude: task.longitude });
          return;
        }
        if (typeof task?.location === "string") {
          const match = task.location.match(/-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?/);
          if (match) {
            const [lat, lng] = match[0].split(",").map((v) => parseFloat(v.trim()));
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              if (!cancelled) setCoords({ latitude: lat, longitude: lng });
              return;
            }
          }
        }
        if (task?.location) {
          const results = await Location.geocodeAsync(task.location);
          if (results && results[0] && !cancelled) {
            setCoords({ latitude: results[0].latitude, longitude: results[0].longitude });
          }
        }
      } catch (e) {
        if (!cancelled) setGeoError(e.message || "Geocoding failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [task?.location, task?.latitude, task?.longitude]);

  // ✅ ADDED: open maps
  const openInGoogleMaps = async (lat, lng, labelRaw = "Task Location") => {
    try {
      const label = encodeURIComponent(labelRaw || "Task Location");
      const appUrl = `comgooglemaps://?q=${lat},${lng}(${label})&center=${lat},${lng}&zoom=14`;
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) return Linking.openURL(appUrl);
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert("Error", "Could not open Google Maps on this device.");
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      t("clientTaskDetails.cancelTaskConfirmTitle"),
      t("clientTaskDetails.cancelTaskConfirmMessage"),
      [
        { text: t("clientTaskDetails.no") },
        {
          text: t("clientTaskDetails.yes"),
          onPress: () => {
            SecureStore.getItemAsync("userId").then(async (clientId) => {
              if (!clientId) {
                Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.userIdNotFound"));
                return;
              }
              try {
                setCanceling(true);
                const cancelPayload = { cancelledBy: clientId };
                const res = await fetch(
                  `https://task-kq94.onrender.com/api/tasks/${task._id}/cancel`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(cancelPayload),
                  }
                );
                if (!res.ok) throw new Error("Failed to cancel task");
                setCanceling(false);
                Alert.alert(t("clientTaskDetails.taskCancelled"));
                navigation.navigate("ClientHome", {
                  screen: "Tasks",
                  params: {
                    refreshTasks: true,
                    targetTab: "Previous",
                    subTab: "Cancelled",
                    unique: Date.now(),
                  },
                });
              } catch (err) {
                setCanceling(false);
                Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.cancelTaskError"));
              }
            });
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#215433" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const { title, description, budget, images = [] } = task;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Make the scroller itself green so the very bottom is always green */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#215432" }}           // ✅ green behind the sheet
        contentContainerStyle={styles.container}                   // ✅ white top container
        bounces={false}
        overScrollMode="never"
      >
        {/* Header (white area) */}
        <TouchableOpacity
          style={[styles.backBtn, I18nManager.isRTL && { alignSelf: "flex-end" }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={30}
            color="#215433"
          />
        </TouchableOpacity>

        <View style={styles.topContent}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>{title}</Text>
              <Text style={styles.subText}>{t("clientTaskDetails.offeredPrice")}: {budget} BHD</Text>
              <Text style={styles.subText}>
                {new Date(task.createdAt).toLocaleDateString(
                  I18nManager.isRTL ? "ar-SA" : "en-GB",
                  { year: "numeric", month: "short", day: "numeric" }
                )} •{" "}
                {new Date(task.createdAt).toLocaleTimeString(
                  I18nManager.isRTL ? "ar-SA" : "en-GB",
                  { hour: "2-digit", minute: "2-digit" }
                )}
              </Text>
            </View>
            <View style={[styles.statusBadge, getStatusStyle(task.status)]}>
              <Text style={styles.statusText}>
                {t(`clientHome.status.${task.status.toLowerCase()}`)}
              </Text>
            </View>
          </View>
        </View>

        {/* GREEN SHEET: full-bleed, rounded top, seamless to bottom */}
        <View style={styles.detailsBox}>
          {/* Description */}
          <Text style={styles.detailsText}>
            <Text style={{ fontFamily: "InterBold" }}>
              {t("clientTaskDetails.description")}:{" "}
            </Text>
            {description}
          </Text>

          {/* Images */}
          <Text style={[styles.detailsText, { marginTop: 12, fontFamily: "InterBold" }]}>
            {t("clientTaskDetails.images")}:
          </Text>
          <View style={styles.imageRow}>
            {images.length > 0 ? (
              images.map((img, index) => (
                <TouchableOpacity key={index} onPress={() => setPreviewImage(img)}>
                  <Image source={{ uri: img }} style={styles.image} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.detailsText}>{t("clientTaskDetails.noImages")}</Text>
            )}
          </View>

          {/* Location label */}
    <Text style={[styles.detailsText, { marginTop: 12 }]}>
           <Text style={{ fontFamily: "InterBold" }}>
             {t("clientTaskDetails.location") || "Location"}:
           </Text>
         </Text>

          {/* 🔻 REPLACED plain location/category with a tappable map preview */}
          {coords ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                openInGoogleMaps(
                  coords.latitude,
                  coords.longitude,
                  task?.title || "Task Location"
                )
              }
              style={{ marginTop: 12, borderRadius: 12, overflow: "hidden" }}
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
          ) : geoError ? null : (
            <View style={[styles.map, { justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ color: "#fff", opacity: 0.8, fontFamily: "Inter" }}>
                {t("taskerTaskDetails.locating") || "Locating on map…"}
              </Text>
            </View>
          )}

          {/* 🔻 REMOVED:
              - location text row
              - category row
          */}

          {/* Actions (inside the green box) */}
          <View style={styles.actionsInside}>
            {task.status === "Pending" && (
              <>
                {bids.length > 0 ? (
                  <Text style={styles.noticeInside}>{t("clientTaskDetails.editNotAllowed")}</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.whiteButton}
                    onPress={() => navigation.navigate("EditTask", { task })}
                  >
                    <Text style={styles.whiteButtonText}>{t("clientTaskDetails.editTask")}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.whiteButton}
                  onPress={() => navigation.navigate("ViewBids", { taskId: task._id })}
                >
                  <Text style={styles.whiteButtonText}>{t("clientTaskDetails.viewBids")}</Text>
                </TouchableOpacity>
              </>
            )}

            {task.status === "Started" && (
              <TouchableOpacity
                style={styles.whiteButton}
                onPress={() => {
                  Alert.alert(
                    t("clientTaskDetails.markCompletedConfirmTitle"),
                    t("clientTaskDetails.markCompletedConfirmMessage"),
                    [
                      { text: t("clientTaskDetails.no") },
                      {
                        text: t("clientTaskDetails.yes"),
                        onPress: async () => {
                          try {
                            setCompleting(true);
                            await fetch(`https://task-kq94.onrender.com/api/tasks/${task._id}/complete`, { method: "PATCH" });
                            await fetchTask();
                            setCompleting(false);
                            navigation.navigate("ClientHome", {
                              screen: "Tasks",
                              params: {
                                refreshTasks: true,
                                targetTab: "Previous",
                                subTab: "Completed",
                                unique: Date.now(),
                              },
                            });
                          } catch {
                            setCompleting(false);
                            Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.markCompletedError"));
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.whiteButtonText}>{t("clientTaskDetails.markCompleted")}</Text>
              </TouchableOpacity>
            )}

            {(task.status === "Pending" || task.status === "Started") && (
              <TouchableOpacity style={styles.whiteButton} onPress={handleDelete}>
                <Text style={styles.whiteButtonText}>{t("clientTaskDetails.cancelTask")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Spacer so the green sheet reaches the very bottom */}
          <View style={{ height: 24 }} />
        </View>

        {/* Image Preview */}
        {previewImage && (
          <View style={styles.previewOverlay}>
            <TouchableOpacity
              style={styles.closePreviewBtn}
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
          </View>
        )}
      </ScrollView>

      {/* Loading overlays */}
      {completing && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#215433" style={{ marginBottom: 10 }} />
            <Text style={styles.overlayText}>{t("clientTaskDetails.completingTask")}</Text>
          </View>
        </View>
      )}

      {canceling && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#215433" style={{ marginBottom: 10 }} />
            <Text style={styles.overlayText}>{t("clientTaskDetails.cancelingTask")}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ✅ WHITE top
  safeArea: { flex: 1, backgroundColor: "#ffffff" },  // ✅ WHITE top container (header area)
  container: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 0,
    backgroundColor: "#ffffff",
  },

  heading: {
    fontFamily: "InterBold",
    fontSize: 30,
    color: "#215433",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    color: "#215432",
  },
  subText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: I18nManager.isRTL ? "flex-end" : "flex-start",
  },
  statusText: { color: "#fff", fontFamily: "InterBold", fontSize: 13 },

  topContent: { marginTop: 10, marginBottom: 16 },
  topRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  /** ✅ EDGE‑TO‑EDGE GREEN SHEET **/
  detailsBox: {
    backgroundColor: "#215432",
    paddingTop: 16,
    paddingBottom: 24,
    marginTop: 16,
    marginHorizontal: -24,       // full‑bleed horizontally
    borderTopLeftRadius: 24,     // only top corners rounded
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24,       // inner gutters aligned to page
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

  map: {
    width: "100%",
    height: 180,
    backgroundColor: "#e6e6e6",
  },

  actionsInside: { marginTop: 20 },
  whiteButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  whiteButtonText: {
    color: "#215432",
    fontFamily: "InterBold",
    fontSize: 15,
  },
  noticeInside: {
    marginBottom: 10,
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
    fontFamily: "Inter",
  },

  // Preview overlay
  previewOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  previewImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
  closePreviewBtn: {
    position: "absolute",
    top: 40,
    left: I18nManager.isRTL ? undefined : 20,
    right: I18nManager.isRTL ? 20 : undefined,
    zIndex: 1001,
  },

  // Loading overlays
  overlay: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  overlayBox: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  overlayText: { fontFamily: "InterBold", fontSize: 16, color: "#215433" },
});
