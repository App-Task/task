import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  I18nManager,
  Linking,
  Modal,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const { taskId } = route.params || {};

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [bids, setBids] = useState([]);
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (isFocused && taskId) {
      fetchTask();
    }
  }, [isFocused, taskId]);

  const fetchTask = async () => {
    try {
      if (!taskId) {
        throw new Error("Task ID is missing");
      }
      setLoading(true);
      const freshTask = await getTaskById(taskId);
      setTask(freshTask);

      const res = await fetch(`https://task-kq94.onrender.com/api/bids/task/${taskId}`);
      const bidData = await res.json();
      setBids(bidData);
    } catch (err) {
      console.error("❌ Task fetch failed:", err.message);
      Alert.alert(
        t("clientTaskDetails.errorTitle") || "Error", 
        t("clientTaskDetails.loadTaskError") || "Failed to load task details.",
        [{ text: t("common.ok") || "OK", onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle case where taskId is not provided
  useEffect(() => {
    if (!taskId) {
      Alert.alert(t("common.errorTitle") || "Error", t("clientTaskDetails.taskNotFound") || "Task information is missing.", [
        { text: t("common.ok") || "OK", onPress: () => navigation.goBack() }
      ]);
    }
  }, [taskId]);

  // Show loading state until task is loaded
  if (loading || !task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f6f7" }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#215432" />
        </View>
      </SafeAreaView>
    );
  }

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#4CAF50";
      case "Pending":
        return "#FF9800";
      case "Started":
      case "In Progress":
        return "#FFB74D";
      case "Cancelled":
        return "#F44336";
      default:
        return "#999";
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

  // Show loading state until task is loaded
  if (loading || !task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#215432" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={"arrow-back"}
            size={24}
            color="#215432"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Top Divider */}
        <View style={styles.divider} />

        {/* Spacing */}
        <View style={styles.spacing} />

        {/* Divider Above Title */}
        <View style={styles.divider} />

        {/* Task Overview */}
        <View style={styles.taskOverview}>
          <View style={styles.taskTitleRow}>
            <Text style={styles.taskTitle}>{task.title || "Task Title"}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>{task.status}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Divider */}
        <View style={styles.divider} />

        {/* Task Detail Layout */}
        <View style={styles.taskDetailLayout}>
          <View style={styles.taskMeta}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Posted on</Text>
              <Text style={styles.metaValue}>{formatDate(task.createdAt)}</Text>
            </View>
            <View style={styles.metaRowRight}>
              <Text style={styles.metaLabelRight}>BUDGET</Text>
              <Text style={styles.metaValueRight}>{task.budget || "0"} BHD</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {task.description || "No description provided"}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Images - Only show if there are actual images */}
        {task.images && task.images.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Images</Text>
              <View style={styles.imageContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {task.images.map((uri, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.imagePlaceholder}
                      onPress={() => setSelectedImage(uri)}
                    >
                      <Image source={{ uri }} style={styles.taskImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            {/* Divider */}
            <View style={styles.divider} />
          </>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          {coords ? (
            <View style={styles.mapPlaceholder}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                pointerEvents="none"
                onMapReady={() => {
                  console.log("Map ready");
                }}
                onError={(error) => {
                  console.error("MapView error:", error);
                  // Don't show alert for read-only map, just log the error
                }}
              >
                <Marker coordinate={coords} />
              </MapView>
            </View>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location-outline" size={32} color="#ccc" />
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom Footer */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          {task.status === "Pending" && (
            <>
              {bids.length === 0 && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    navigation.navigate("EditTask", { taskId: task._id });
                  }}
                >
                  <Text style={styles.editButtonText}>Edit Task</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.viewBidsButton}
                onPress={() => navigation.navigate("ViewBids", { taskId: task._id })}
              >
                <Text style={styles.viewBidsButtonText}>View Bids ({bids.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleDelete}
                disabled={canceling}
              >
                {canceling ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancel Task</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {task.status === "Started" && (
            <>
              <TouchableOpacity
                style={styles.viewTaskerButton}
                onPress={() => {
                  const taskerId = task.assignedTo || task.taskerId || task.assignedTasker || task.tasker || task.assignedUser;
                  if (taskerId) {
                    navigation.navigate("TaskerProfile", { 
                      taskerId: taskerId,
                      taskId: task._id
                    });
                  } else {
                    Alert.alert(
                      "Tasker Profile Unavailable", 
                      "Tasker information is not available for this task."
                    );
                  }
                }}
              >
                <Text style={styles.viewTaskerButtonText}>View Tasker Profile</Text>
              </TouchableOpacity>
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
                disabled={completing}
              >
                {completing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.completeButtonText}>Mark as Complete</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Full Screen Image Viewer */}
      {selectedImage && (
        <Modal visible={true} transparent={true} onRequestClose={() => setSelectedImage(null)}>
          <View style={styles.fullScreenOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  taskOverview: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  spacing: {
    height: 20,
  },
  taskDetailLayout: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  taskTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  taskTitle: {
    flex: 1,
    fontFamily: "InterBold",
    fontSize: 28,
    color: "#215432",
    marginRight: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 12,
  },
  taskMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  metaRow: {
    flex: 1,
    alignItems: "flex-start",
  },
  metaRowRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  metaLabelRight: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    textAlign: "right",
  },
  metaValueRight: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215433",
    textAlign: "right",
  },
  metaLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215433",
  },
  divider: {
    height: 2,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
    marginTop: 0,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#666666",
    marginBottom: 12,
  },
  descriptionText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  imageContainer: {
    marginTop: 8,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  taskImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginTop: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  footer: {
    backgroundColor: "rgba(248, 246, 247)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerButtons: {
    gap: 12,
  },
  editButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#215432",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432",
  },
  viewBidsButton: {
    backgroundColor: "#215432",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewBidsButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#fff",
  },
  viewTaskerButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#215432",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  viewTaskerButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432",
  },
  cancelButton: {
    backgroundColor: "#F44336",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#fff",
  },
  completeButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#fff",
  },
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
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "90%",
    height: "80%",
  },
});
