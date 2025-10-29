import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  I18nManager,
  Dimensions,
  Alert,
  TextInput,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Modal from "react-native-modal";
import * as SecureStore from "expo-secure-store";

const { height } = Dimensions.get("window");

export default function TaskerProfileScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { taskerId, taskId, task } = route.params;
  const [tasker, setTasker] = useState(null);
  const [reviewData, setReviewData] = useState({ reviews: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [taskData, setTaskData] = useState(task);
  const [coords, setCoords] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [bids, setBids] = useState([]);
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  
  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, reviewRes, taskRes] = await Promise.all([
          axios.get(`https://task-kq94.onrender.com/api/users/${taskerId}`),
          axios.get(`https://task-kq94.onrender.com/api/reviews/all/tasker/${taskerId}`),
          taskId ? axios.get(`https://task-kq94.onrender.com/api/tasks/${taskId}`) : Promise.resolve(null)
        ]);
        setTasker(userRes.data);
        setReviewData({ reviews: reviewRes.data || [] });
        if (taskRes && taskRes.data) {
          setTaskData(taskRes.data);
        }
        
        // Fetch bids for the task
        if (taskId) {
          const bidRes = await fetch(`https://task-kq94.onrender.com/api/bids/task/${taskId}`);
          const bidData = await bidRes.json();
          setBids(bidData);
        }
      } catch (err) {
        console.error("❌ Error loading data:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [taskerId, taskId]);

  // Derive coords from task location
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!taskData) return;
        
        if (typeof taskData?.latitude === "number" && typeof taskData?.longitude === "number") {
          if (!cancelled) setCoords({ latitude: taskData.latitude, longitude: taskData.longitude });
          return;
        }
        if (typeof taskData?.location === "string") {
          const match = taskData.location.match(/-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?/);
          if (match) {
            const [lat, lng] = match[0].split(",").map((v) => parseFloat(v.trim()));
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              if (!cancelled) setCoords({ latitude: lat, longitude: lng });
              return;
            }
          }
        }
        if (taskData?.location) {
          const results = await Location.geocodeAsync(taskData.location);
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
  }, [taskData?.location, taskData?.latitude, taskData?.longitude]);

  // Helper functions for task details
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
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
          onPress: async () => {
            try {
              const clientId = await SecureStore.getItemAsync("userId");
              if (!clientId) {
                Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.userIdNotFound"));
                return;
              }
              setCanceling(true);
              const cancelPayload = { cancelledBy: clientId };
              const res = await fetch(
                `https://task-kq94.onrender.com/api/tasks/${taskData._id}/cancel`,
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
          },
        },
      ]
    );
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    
    setIsReporting(true);
    try {
      const userId = await SecureStore.getItemAsync("userId");
      await axios.post("https://task-kq94.onrender.com/api/reports", {
        reporterId: userId,
        reportedUserId: taskerId,
        reason: reportReason,
        taskId: taskId,
      });
      
      setIsReporting(false);
      setShowReportModal(false);
      setReportReason("");
      Alert.alert(t("common.reportSubmitted"), t("common.reportThankYou"));
    } catch (err) {
      setIsReporting(false);
      console.error("❌ Report error:", err.message);
      Alert.alert(t("common.errorTitle"), t("common.reportError"));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#000000" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!tasker) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.error}>{t("taskerProfile.loadError")}</Text>
      </SafeAreaView>
    );
  }

  const firstInitial =
    typeof tasker.name === "string" && tasker.name.trim().length > 0
      ? tasker.name.trim()[0].toUpperCase()
      : "?";

  const avg =
    reviewData.reviews.length > 0
      ? (reviewData.reviews.reduce((s, r) => s + (r?.rating || 0), 0) / reviewData.reviews.length).toFixed(1)
      : "0.0";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "rgba(248, 246, 247)" }}
        contentContainerStyle={styles.container}
        bounces={false}
        overScrollMode="never"
      >
        {/* Header with back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons
            name={"arrow-back"}
            size={24}
            color="#215432"
          />
        </TouchableOpacity>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "details" && styles.activeTab]}
            onPress={() => setActiveTab("details")}
          >
            <Text style={[styles.tabText, activeTab === "details" && styles.activeTabText]}>
              {t("taskerProfile.taskDetails")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "profile" && styles.activeTab]}
            onPress={() => setActiveTab("profile")}
          >
            <Text style={[styles.tabText, activeTab === "profile" && styles.activeTabText]}>
              {t("taskerProfile.taskerProfile")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conditional Content Based on Active Tab */}
        {activeTab === "profile" ? (
          <>
        {/* Big centered avatar */}
        <View style={styles.avatarWrap}>
          {tasker.profileImage ? (
            <Image source={{ uri: tasker.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{firstInitial}</Text>
            </View>
          )}
        </View>

        {/* Name & basics */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{tasker.name}</Text>

          <Text style={styles.profileDetails}>
                {tasker.location || t("taskerProfile.defaultLocation")}
          </Text>

          {/* About section moved here */}
          <Text style={styles.aboutTitle}>
                <Text style={styles.aboutBold}>{t("taskerProfile.about")}: </Text>
                {tasker.about || t("taskerProfile.defaultAbout")}
          </Text>
        </View>

        {/* Report User Button */}
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
        >
          <Text style={styles.reportButtonText}>{t("common.reportUser")}</Text>
        </TouchableOpacity>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          {/* Reviews Header */}
          <View style={styles.reviewsHeader}>
                <Text style={styles.reviewsTitle}>{t("taskerProfile.reviews")}</Text>
            <Text style={styles.reviewsAvg}>
                  {t("taskerProfile.avgRating")}: {avg}
            </Text>
          </View>

              {/* Divider */}
              <View style={styles.reviewsDivider} />

          {/* Reviews */}
          {reviewData.reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.noReviewsTitle}>{t("taskerProfile.noReviewsYet")}</Text>
              <Text style={styles.noReviewsSubtitle}>{t("taskerProfile.noReviewsSubtitle")}</Text>
            </View>
          ) : (
            reviewData.reviews.map((rev, idx) => (
                  <View key={idx} style={styles.reviewCard}>
                  <Text style={styles.reviewTaskTitle}>
                    {rev.taskId?.title || rev.taskTitle || t("common.taskTitle")}
                  </Text>
                  
                  <View style={styles.reviewStarsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        let starName = "star-outline";
                        if (star <= Math.floor(rev.rating)) {
                          starName = "star";
                        } else if (star === Math.ceil(rev.rating) && rev.rating % 1 !== 0) {
                          starName = "star-half";
                        }
                        return (
                      <Ionicons
                        key={star}
                            name={starName}
                        size={16}
                        color="#215432"
                        style={styles.reviewStar}
                      />
                        );
                      })}
                    </View>

                    <Text style={styles.reviewComment}>
                      {rev.comment || t("taskerProfile.defaultComment")}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          // Task Details Content
          <>
            {/* Spacing */}
            <View style={styles.spacing} />

            {/* Divider Above Title */}
            <View style={styles.divider} />

            {/* Task Overview */}
            <View style={styles.taskOverview}>
              <View style={styles.taskTitleRow}>
                <Text style={styles.taskTitle}>{taskData?.title || t("common.taskTitle")}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(taskData?.status) }]}>
                  <Text style={styles.statusText}>{t(`clientMyTasks.${taskData?.status?.toLowerCase()}`)}</Text>
                </View>
              </View>
            </View>

            {/* Bottom Divider */}
            <View style={styles.divider} />

            {/* Task Detail Layout */}
            <View style={styles.taskDetailLayout}>
              <View style={styles.taskMeta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{t("taskerProfile.postedOn")}</Text>
                  <Text style={styles.metaValue}>{formatDate(taskData?.createdAt)}</Text>
                </View>
                <View style={styles.metaRowRight}>
                  <Text style={styles.metaLabelRight}>{t("taskerProfile.budget")}</Text>
                  <Text style={styles.metaValueRight}>{taskData?.budget || "0"} {t("common.currency")}</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("taskerProfile.description")}</Text>
              <Text style={styles.descriptionText}>
                {taskData?.description || t("taskerProfile.noDescription")}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Images - Only show if there are actual images */}
            {taskData?.images && taskData.images.length > 0 && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("taskerProfile.images")}</Text>
                  <View style={styles.imageContainer}>
                    <View style={styles.imagesRow}>
                      {taskData.images.map((uri, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.imagePlaceholder}
                          onPress={() => setPreviewImage(uri)}
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
              <Text style={styles.sectionTitle}>{t("taskerProfile.location")}</Text>
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

            {/* Action Buttons */}
            <View style={styles.buttonSection}>
              {taskData?.status === "Pending" && (
                <>
                  {bids.length === 0 && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => navigation.navigate("EditTask", { task: taskData })}
                    >
                      <Text style={styles.editButtonText}>{t("taskerProfile.editTask")}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleDelete}
                    disabled={canceling}
                  >
                    {canceling ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.cancelButtonText}>{t("taskerProfile.cancelTask")}</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {taskData?.status === "Started" && (
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
                              await fetch(`https://task-kq94.onrender.com/api/tasks/${taskData._id}/complete`, { method: "PATCH" });
                              // Refresh task data
                              const taskRes = await axios.get(`https://task-kq94.onrender.com/api/tasks/${taskId}`);
                              if (taskRes && taskRes.data) {
                                setTaskData(taskRes.data);
                              }
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
                    <Text style={styles.completeButtonText}>{t("taskerProfile.markAsComplete")}</Text>
                  )}
                </TouchableOpacity>
          )}
        </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </>
        )}
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

      {/* Report Modal */}
      <Modal isVisible={showReportModal}>
        <View style={styles.modalContainer}>
          {isReporting ? (
            <View style={styles.modalContent}>
              <ActivityIndicator size="large" color="#000000" style={{ marginBottom: 10 }} />
              <Text style={styles.modalText}>{t("common.submittingReport")}</Text>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t("common.reportTasker")}</Text>
              <Text style={styles.modalSubtitle}>
                {t("common.reportDescription")}
              </Text>
              
              <TextInput
                style={styles.reportInput}
                placeholder={t("common.reportPlaceholder")}
                multiline
                numberOfLines={4}
                value={reportReason}
                onChangeText={(text) => {
                  if (text.length <= 300) setReportReason(text);
                }}
                maxLength={300}
              />
              
              <Text style={styles.characterCount}>
                {reportReason.length}/300 {t("common.characters")}
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                >
                  <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSubmitButton,
                    { backgroundColor: reportReason.trim() ? "#F44336" : "#ccc" }
                  ]}
                  onPress={submitReport}
                  disabled={!reportReason.trim()}
                >
                  <Text style={styles.modalSubmitText}>{t("common.submit")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "rgba(248, 246, 247)" 
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    backgroundColor: "rgba(248, 246, 247)",
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 6,
    alignSelf: I18nManager.isRTL ? "flex-end" : "flex-start",
  },

  // Navigation tabs
  tabContainer: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
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
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#215432",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  activeTabText: {
    color: "#fff",
    fontFamily: "InterBold",
  },

  // Avatar
  avatarWrap: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#ffffff",
    backgroundColor: "#e8efe9",
  },
  avatarFallback: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#215432",
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  avatarFallbackText: {
    fontFamily: "InterBold",
    fontSize: 48,
    color: "#ffffff",
    marginTop: 4,
  },

  // Name / Basics
  infoSection: {
    alignSelf: "stretch",
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: I18nManager.isRTL ? "right" : "left",
    marginBottom: 8,
  },
  profileDetails: {
    fontSize: 14,
    color: "#616161",
    textAlign: I18nManager.isRTL ? "right" : "left",
    marginBottom: 6,
  },
  profileLabel: {
    fontFamily: "InterBold",
    color: "#215432",
  },

  // About section
  aboutTitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215432",
    lineHeight: 20,
    marginTop: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  aboutBold: { 
    fontFamily: "InterBold", 
    color: "#215432" 
  },

  // Report button - WIDER and OVAL/Rounded
  reportButton: {
    backgroundColor: "#F44336",
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "stretch",
    marginHorizontal: 0,
  },
  reportButtonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },

  // Reviews section
  reviewsSection: {
    marginTop: 20,
  },
  reviewsHeader: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  reviewsTitle: { 
    fontFamily: "InterBold", 
    fontSize: 16, 
    color: "#215432",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  reviewsAvg: { 
    fontFamily: "InterBold", 
    fontSize: 14, 
    color: "#215432",
    textAlign: I18nManager.isRTL ? "left" : "right",
  },
  reviewsDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  noReviewsTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#215432",
    textAlign: "center",
    marginBottom: 8,
  },
  noReviewsSubtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#616161",
    textAlign: "center",
  },

  reviewCard: {
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    marginBottom: 20,
  },
  reviewTaskTitle: {
    fontFamily: "InterBold",
    fontSize: 14,
    color: "#215432",
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  reviewStarsContainer: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewStar: {
    marginRight: I18nManager.isRTL ? 0 : 2,
    marginLeft: I18nManager.isRTL ? 2 : 0,
  },
  reviewComment: { 
    fontFamily: "Inter", 
    fontSize: 13, 
    color: "#616161",
    lineHeight: 18,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  reviewDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginBottom: 16,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: "center",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter",
    textAlignVertical: "top",
    marginBottom: 10,
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#666",
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#ffffff",
  },

  error: { 
    textAlign: "center", 
    marginTop: 50, 
    color: "red", 
    fontSize: 16 
  },
  
  // Task Details Styles
  spacing: {
    height: 20,
  },
  divider: {
    height: 2,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
    marginVertical: 20,
  },
  taskOverview: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  taskTitleRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  taskDetailLayout: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  
  // Button section styles
  buttonSection: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  editButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#215432",
    borderRadius: 25,
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
    backgroundColor: "#215432",
    borderWidth: 2,
    borderColor: "#215432",
    borderRadius: 25,
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
    backgroundColor: "#215432",
    borderWidth: 2,
    borderColor: "#215432",
    borderRadius: 25,
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
});
