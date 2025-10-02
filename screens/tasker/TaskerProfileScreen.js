import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  I18nManager,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Modal from "react-native-modal";
import * as SecureStore from "expo-secure-store";

const { height } = Dimensions.get("window");

export default function TaskerProfileScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { taskerId, taskId } = route.params;
  const [tasker, setTasker] = useState(null);
  const [reviewData, setReviewData] = useState({ reviews: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    const fetchTaskerAndReview = async () => {
      try {
        const [userRes, reviewRes] = await Promise.all([
          axios.get(`https://task-kq94.onrender.com/api/users/${taskerId}`),
          axios.get(`https://task-kq94.onrender.com/api/reviews/all/tasker/${taskerId}`),
        ]);
        setTasker(userRes.data);
        setReviewData({ reviews: reviewRes.data || [] });
        
        // Debug: Log the review data structure
        console.log("🔍 Review data:", reviewRes.data);
        if (reviewRes.data && reviewRes.data.length > 0) {
          console.log("🔍 First review structure:", reviewRes.data[0]);
          console.log("🔍 TaskId in first review:", reviewRes.data[0].taskId);
          console.log("🔍 Task title in first review:", reviewRes.data[0].taskId?.title);
        }
      } catch (err) {
        console.error("❌ Error loading tasker or review:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTaskerAndReview();
  }, [taskerId]);

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
      Alert.alert("Report Submitted", "Thank you for your report. We will review it shortly.");
    } catch (err) {
      setIsReporting(false);
      console.error("❌ Report error:", err.message);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#215432" style={{ marginTop: 40 }} />
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
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        contentContainerStyle={styles.container}
        bounces={false}
        overScrollMode="never"
      >
        {/* Header with back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#215432"
          />
        </TouchableOpacity>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "details" && styles.activeTab]}
            onPress={() => {
              setActiveTab("details");
              // Go back to the existing TaskDetails screen instead of navigating to a new one
              navigation.goBack();
            }}
          >
            <Text style={[styles.tabText, activeTab === "details" && styles.activeTabText]}>
              Task Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "profile" && styles.activeTab]}
            onPress={() => setActiveTab("profile")}
          >
            <Text style={[styles.tabText, activeTab === "profile" && styles.activeTabText]}>
              Tasker's Profile
            </Text>
          </TouchableOpacity>
        </View>

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
            <Text style={styles.profileLabel}>{t("taskerProfile.location")} </Text>
            {tasker.location || t("taskerProfile.notProvided")}
          </Text>

          {/* About section moved here */}
          <Text style={styles.aboutTitle}>
            <Text style={styles.aboutBold}>{t("taskerProfile.about")} </Text>
            {tasker.about || t("taskerProfile.notProvided")}
          </Text>
        </View>

        {/* Report User Button */}
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
        >
          <Text style={styles.reportButtonText}>Report User</Text>
        </TouchableOpacity>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          {/* Reviews Header */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>{t("taskerProfile.reviews")}</Text>
            <Text style={styles.reviewsAvg}>
              {t("taskerProfile.avgRating")} {avg}
            </Text>
          </View>

          {/* Reviews */}
          {reviewData.reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.noReviewsTitle}>No Reviews Yet</Text>
              <Text style={styles.noReviewsSubtitle}>This Tasker hasn't been rated yet</Text>
            </View>
          ) : (
            reviewData.reviews.map((rev, idx) => (
              <React.Fragment key={idx}>
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewTaskTitle}>
                    {rev.taskId?.title || rev.taskTitle || "Task Title"}
                  </Text>
                  
                  <View style={styles.reviewStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= rev.rating ? "star" : "star-outline"}
                        size={16}
                        color="#215432"
                        style={styles.reviewStar}
                      />
                    ))}
                  </View>

                  {rev.comment ? (
                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                  ) : null}
                </View>
                {idx < reviewData.reviews.length - 1 && (
                  <View style={styles.reviewDivider} />
                )}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>

      {/* Report Modal */}
      <Modal isVisible={showReportModal}>
        <View style={styles.modalContainer}>
          {isReporting ? (
            <View style={styles.modalContent}>
              <ActivityIndicator size="large" color="#215432" style={{ marginBottom: 10 }} />
              <Text style={styles.modalText}>Submitting report...</Text>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Report Tasker</Text>
              <Text style={styles.modalSubtitle}>
                Please describe the issue with this tasker:
              </Text>
              
              <TextInput
                style={styles.reportInput}
                placeholder="Describe the issue..."
                multiline
                numberOfLines={4}
                value={reportReason}
                onChangeText={(text) => {
                  if (text.length <= 300) setReportReason(text);
                }}
                maxLength={300}
              />
              
              <Text style={styles.characterCount}>
                {reportReason.length}/300 characters
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSubmitButton,
                    { backgroundColor: reportReason.trim() ? "#F44336" : "#ccc" }
                  ]}
                  onPress={submitReport}
                  disabled={!reportReason.trim()}
                >
                  <Text style={styles.modalSubmitText}>Submit</Text>
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
    backgroundColor: "#F8F8F8" 
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    backgroundColor: "#F8F8F8",
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
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
    height: 50,
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
    color: "#616161",
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
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: "left",
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
    color: "#616161",
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
    borderRadius: 8,
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  reviewsTitle: { 
    fontFamily: "InterBold", 
    fontSize: 16, 
    color: "#215432" 
  },
  reviewsAvg: { 
    fontFamily: "InterBold", 
    fontSize: 14, 
    color: "#215432" 
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
    marginBottom: 16,
  },
  reviewTaskTitle: {
    fontFamily: "InterBold",
    fontSize: 14,
    color: "#215432",
    marginBottom: 8,
    textAlign: "left",
  },
  reviewStarsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewStar: {
    marginRight: 2,
  },
  reviewComment: { 
    fontFamily: "Inter", 
    fontSize: 13, 
    color: "#616161",
    lineHeight: 18,
    textAlign: "left",
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
});
