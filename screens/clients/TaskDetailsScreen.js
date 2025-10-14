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
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getTaskById } from "../../services/taskService";
import { useIsFocused } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
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
  const [coords, setCoords] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

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

  // Derive coords from task
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
        console.log("Geocoding error:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [task?.location, task?.latitude, task?.longitude]);

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
      <View style={styles.container}>
        {/* Header with back button - matching ViewBidsScreen structure */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={30} color="#215432" />
          </TouchableOpacity>
          
          <View style={styles.backBtn} />
        </View>

        {/* Navigation Tabs - matching ViewBidsScreen structure */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, styles.activeTab]} // Always show as active
            onPress={() => {
              // Do nothing when Task Details tab is pressed since we're already on it
            }}
          >
            <Text style={[styles.tabText, styles.activeTabText]}>
              Task Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab]} // Never show as active
            onPress={() => {
              if (task.status === "Pending") {
                navigation.navigate("ViewBids", { taskId: task._id });
              } else {
                // Debug: Log the task object to see available fields
                console.log("Task object:", task);
                console.log("Task keys:", Object.keys(task));
                
                // Try different possible field names for tasker ID
                const taskerId = task.assignedTo || task.taskerId || task.assignedTasker || task.tasker || task.assignedUser;
                
                if (taskerId) {
                  console.log("Found taskerId:", taskerId);
                  navigation.navigate("TaskerProfile", { 
                    taskerId: taskerId,
                    task: task, // Pass the task object
                    taskId: task._id // Also pass taskId
                  });
                } else {
                  console.error("No tasker ID found in task object");
                  Alert.alert(
                    "Tasker Profile Unavailable", 
                    "Tasker information is not available for this task. The task may not have been assigned to a tasker yet."
                  );
                }
              }
            }}
          >
            <Text style={[styles.tabText]}>
              {task.status === "Pending" ? "Offers" : "Tasker's Profile"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Separator line above title */}
          <View style={styles.separator} />

          {/* Task Title and Status */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              <View style={[styles.statusBadge, getStatusStyle(task.status)]}>
                <Text style={styles.statusText}>
                  {task.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Separator line below title */}
          <View style={styles.separator} />

          {/* Posted on and Budget */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.infoLabel}>Posted on</Text>
                <Text style={styles.infoValue}>
                  {new Date(task.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </Text>
              </View>
              <View>
                <Text style={styles.infoLabel}>BUDGET</Text>
                <Text style={styles.budgetValue}>{budget} BHD</Text>
              </View>
            </View>
          </View>

          {/* Separator line */}
          <View style={styles.separator} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.sectionValue}>{description}</Text>
          </View>

          {/* Images */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Images</Text>
            <View style={styles.imageRow}>
              {images.length > 0 ? (
                images.map((img, index) => (
                  <TouchableOpacity key={index} onPress={() => setPreviewImage(img)}>
                    <Image source={{ uri: img }} style={styles.image} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.placeholderImage} />
              )}
            </View>
          </View>

          {/* Separator line */}
          <View style={styles.separator} />

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            {coords && (
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
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            {task.status === "Pending" && (
              <>
                {bids.length === 0 && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate("EditTask", { task })}
                  >
                    <Text style={styles.editButtonText}>Edit Task</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.cancelButtonText}>Cancel Task</Text>
                </TouchableOpacity>
              </>
            )}

            {task.status === "Started" && (
              <TouchableOpacity
                style={styles.completeButton}
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
                <Text style={styles.completeButtonText}>Mark as Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

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
      </View>

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
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 10, // Reduced to push content closer to arrow
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E5E5",
    borderRadius: 25,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#215432",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
    fontFamily: "InterBold",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: "#ffffff",
  },

  // Title section
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 32,
    fontFamily: "InterBold",
    color: "#215432",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 12,
  },

  // Info section
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontFamily: "InterBold",
  },
  budgetValue: {
    fontSize: 16,
    color: "#215432",
    fontFamily: "InterBold",
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 20,
  },

  // Section styling
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#333",
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666",
    lineHeight: 20,
  },

  // Images
  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    backgroundColor: "#E5E5E5",
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },

  // Map
  mapContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E5E5E5",
    height: 180,
  },
  map: {
    width: "100%",
    height: "100%",
  },

  // Buttons
  buttonSection: {
    marginTop: 20,
  },
  editButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#215432",
    borderRadius: 25,  // More rounded/oval
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  editButtonText: {
    color: "#215432",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#215432",  // Green background
    borderWidth: 2,
    borderColor: "#215432",
    borderRadius: 25,  // More rounded/oval
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  cancelButtonText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  completeButton: {
    backgroundColor: "#215432",  // Green background
    borderWidth: 2,
    borderColor: "#215432",
    borderRadius: 25,  // More rounded/oval
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  completeButtonText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 16,
  },

  // Preview overlay
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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
  overlayText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
  },
});
