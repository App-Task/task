import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import EmptyIllustration from "../../components/EmptyIllustration";
import VerificationPopup from "../../components/VerificationPopup";

export default function TaskerTaskDetailsScreen({ route }) {
  const { task: initialTask } = route.params || {};
  const [task, setTask] = useState(initialTask || null);
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [isVerified, setIsVerified] = useState(true);
  const [existingBid, setExistingBid] = useState(null);
  const [loadingBid, setLoadingBid] = useState(true);
  const [coords, setCoords] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);

  const isBiddingAllowed = task?.status === "Pending";

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        if (!task?._id) {
          if (isMounted) setLoadingBid(false);
          return;
        }

        const user = await fetchCurrentUser();
        if (!user?._id) {
          if (isMounted) setLoadingBid(false);
          return;
        }

        if (isMounted) setIsVerified(user.isVerified || false);

        const res = await axios.get(`https://task-kq94.onrender.com/api/bids/tasker/${user._id}`);
        const bids = res.data || [];
        const foundBid = bids.find(
          (b) => b.taskId?._id === task._id || b.taskId === task._id
        );

        if (foundBid && isMounted) {
          setExistingBid(foundBid);
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
  }, [task?._id]);

  useEffect(() => {
    const fetchFullTask = async () => {
      try {
        if (!initialTask?._id) {
          console.error("❌ No task ID provided");
          return;
        }
        const res = await axios.get(
          `https://task-kq94.onrender.com/api/tasks/${initialTask._id}`
        );
        if (res.data) {
          setTask(res.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch full task:", err.message);
      }
    };
    if (initialTask?._id) {
      fetchFullTask();
    }
  }, [initialTask?._id]);

  // Get task coordinates
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof task?.latitude === "number" && typeof task?.longitude === "number") {
          if (!cancelled) {
            setCoords({ latitude: task.latitude, longitude: task.longitude });
          }
          return;
        }
        
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
        
        if (task?.location && task.location.trim()) {
          try {
            const results = await Location.geocodeAsync(task.location);
            if (results && results[0] && !cancelled) {
              setCoords({ latitude: results[0].latitude, longitude: results[0].longitude });
              return;
            }
          } catch (e) {
            // Geocoding failed
          }
        }
        
      } catch (e) {
        console.error("Location error:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task?.location, task?.latitude, task?.longitude]);


  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#4CAF50";
      case "Pending":
        return "#FF9800";
      case "In Progress":
        return "#FF9800";
      case "Started":
        return "#FFEB3B";
      case "Cancelled":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("taskerTaskDetails.dateNotAvailable") || "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t("taskerTaskDetails.dateNotAvailable") || "N/A";
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return t("taskerTaskDetails.dateNotAvailable") || "N/A";
    }
  };

  // If no task data, show error and allow going back
  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
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
        <View style={styles.errorContainer}>
          <EmptyIllustration />
          <Text style={styles.errorText}>{t("common.errorTitle")}</Text>
          <Text style={styles.errorSubtext}>
            {t("taskerTaskDetails.taskNotFound") || "Task information is missing. Please try again."}
          </Text>
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

      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("taskerTaskDetails.title")}</Text>
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
            <Text style={styles.taskTitle}>{task.title || t("common.taskTitle")}</Text>
            <View style={[styles.statusBadge, { backgroundColor: "#FFB74D" }]}>
              <Text style={styles.statusText}>{t("taskerTaskDetails.inProgress")}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Divider */}
        <View style={styles.divider} />

        {/* Task Detail Layout */}
        <View style={styles.taskDetailLayout}>
          <View style={styles.taskMeta}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("taskerTaskDetails.postedOn")}</Text>
              <Text style={styles.metaValue}>{formatDate(task.createdAt)}</Text>
            </View>
            <View style={styles.metaRowRight}>
              <Text style={styles.metaLabelRight}>{t("taskerTaskDetails.budget")}</Text>
              <Text style={styles.metaValueRight}>{task.budget || "22"} {t("common.currency")}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("taskerTaskDetails.description")}</Text>
          <Text style={styles.descriptionText}>
            {task.description || t("taskerTaskDetails.defaultDescription")}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Images - Only show if there are actual images */}
        {task.images && task.images.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("taskerTaskDetails.images")}</Text>
              <View style={styles.imageContainer}>
                <View style={styles.imagesRow}>
                  {task.images.map((uri, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.imagePlaceholder}
                      onPress={() => setSelectedImage(uri)}
                    >
                      <Image source={{ uri }} style={styles.taskImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            {/* Divider */}
            <View style={styles.divider} />
          </>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("taskerTaskDetails.location")}</Text>
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
        <Text style={styles.footerText}>
          {t("taskerTaskDetails.footerText")}
        </Text>
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isBiddingAllowed && styles.submitButtonDisabled
          ]}
          onPress={() => {
            if (isBiddingAllowed) {
              if (!isVerified) {
                setShowVerificationPopup(true);
                return;
              }
              if (existingBid) {
                navigation.navigate("EditBid", { task, existingBid });
              } else {
                navigation.navigate("SendBid", { task });
              }
            }
          }}
          disabled={!isBiddingAllowed}
        >
          <Text style={styles.submitButtonText}>
            {!isBiddingAllowed
              ? t("taskerTaskDetails.biddingClosed")
              : existingBid
              ? t("taskerTaskDetails.updateBid")
              : t("taskerTaskDetails.placeBid")}
          </Text>
        </TouchableOpacity>
      </View>


      {/* Full Screen Image Viewer */}
      {selectedImage && (
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
      )}

      {/* Verification Popup */}
      <VerificationPopup
        visible={showVerificationPopup}
        onClose={() => setShowVerificationPopup(false)}
      />
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
    direction: "ltr",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#215432",
  },
  headerTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#ffffff",
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
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontFamily: "InterBold",
    fontSize: 28,
    color: "#215432",
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  taskMeta: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  metaRow: {
    flex: 1,
    alignItems: I18nManager.isRTL ? "flex-end" : "flex-start",
  },
  metaRowRight: {
    flex: 1,
    alignItems: I18nManager.isRTL ? "flex-start" : "flex-end",
  },
  metaLabelRight: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "left" : "right",
  },
  metaValueRight: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215433",
    textAlign: I18nManager.isRTL ? "left" : "right",
  },
  metaLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  metaValue: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215433",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  divider: {
    height: 1,
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  descriptionText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  imageContainer: {
    marginTop: 8,
  },
  imagesRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    gap: 12,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
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
  footerText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#fff",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  loadingText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215432",
    marginTop: 20,
    textAlign: "center",
  },
  errorSubtext: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
});