import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import Modal from "react-native-modal";
import { I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function MyTasksScreen({ navigation, route }) {

  const { t } = useTranslation();

  // Custom star rating component using Ionicons
  const CustomStarRating = ({ rating, onChange, starSize = 32, color = "#FFD700" }) => {
    const handleStarPress = (starIndex, isHalfStar = false) => {
      const newRating = starIndex + (isHalfStar ? 0.5 : 1);
      onChange(newRating);
    };

    const renderStar = (starNumber) => {
      const isFullStar = starNumber <= Math.floor(rating);
      const isHalfStar = starNumber === Math.ceil(rating) && rating % 1 !== 0;
      
      return (
        <View key={`star-${starNumber}`} style={{ marginRight: 8, position: 'relative' }}>
          {/* Left half - for half star rating */}
          <TouchableOpacity
            onPress={() => handleStarPress(starNumber - 1, true)}
            activeOpacity={0.7}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: starSize / 2,
              height: starSize,
              zIndex: 2,
            }}
          />
          
          {/* Right half - for full star rating */}
          <TouchableOpacity
            onPress={() => handleStarPress(starNumber - 1, false)}
            activeOpacity={0.7}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: starSize / 2,
              height: starSize,
              zIndex: 2,
            }}
          />
          
          {/* Star icon */}
          <Ionicons
            name={isFullStar ? "star" : isHalfStar ? "star-half" : "star-outline"}
            size={starSize}
            color={isFullStar ? color : isHalfStar ? color : "#D3D3D3"}
            style={{
              shadowColor: isFullStar || isHalfStar ? color : "#D3D3D3",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isFullStar || isHalfStar ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: isFullStar || isHalfStar ? 4 : 1,
            }}
          />
        </View>
      );
    };

    return (
      <View>
        <Text style={{ 
          fontFamily: "Inter", 
          fontSize: 16, 
          color: "#215432", 
          marginBottom: 16,
          textAlign: "center",
          fontWeight: "600"
        }}>
          Rate your experience: {rating}/5
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          {renderStar(1)}
          {renderStar(2)}
          {renderStar(3)}
          {renderStar(4)}
          {renderStar(5)}
        </View>
      </View>
    );
  };

  const [activeTab, setActiveTab] = useState("Pending");
  const [previousSubTab, setPreviousSubTab] = useState("Completed");

  const [groupedTasks, setGroupedTasks] = useState({
    Pending: [],
    Started: [],
    Completed: [],
    Cancelled: [],
  });
  
  const [loading, setLoading] = useState(true);

  const [showReview, setShowReview] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userId, setUserId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reportedTaskIds, setReportedTaskIds] = useState([]);
  const [reportingTaskId, setReportingTaskId] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportTask, setReportTask] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchTasks = async () => {
        try {
          setLoading(true);
          const userId = await SecureStore.getItemAsync("userId");
          if (!userId) throw new Error("No user ID");
          setUserId(userId);
          
      
          const res = await fetch(`https://task-kq94.onrender.com/api/tasks/user/${userId}`);
          const allTasks = await res.json();
      
          const grouped = { Pending: [], Started: [], Completed: [], Cancelled: [] };

allTasks.forEach((task) => {
  const normalizedStatus = (task.status || "").toLowerCase();
  if (normalizedStatus === "pending") {
    grouped.Pending.push(task);
  } else if (normalizedStatus === "started") {
    grouped.Started.push(task);
  } else if (normalizedStatus === "completed") {
    grouped.Completed.push(task);
  } else if (normalizedStatus === "cancelled") {
    grouped.Cancelled.push(task);
  }
});

      
          setGroupedTasks(grouped);
      
          if (route?.params?.refreshTasks) {
            setActiveTab(route.params.targetTab || "Pending");
          
            if (route.params.targetTab === "Previous" && route.params.subTab) {
              setPreviousSubTab(route.params.subTab); // ✅ set inner tab
            }
          
            navigation.setParams({
              refreshTasks: false,
              targetTab: null,
              subTab: null,
            });
          }
          
          
      
          // Handle review popup
          for (let task of grouped.Completed) {
            const check = await fetch(`https://task-kq94.onrender.com/api/reviews/task/${task._id}`);
            const review = await check.json();
            if (!review || (Array.isArray(review) && review.length === 0)) {
              setReviewTask(task);
              setShowReview(true);
              break;
            }
          }
      
        } catch (err) {
          console.error("❌ Failed to fetch tasks:", err.message);
          Alert.alert(t("clientMyTasks.errorTitle"), t("clientMyTasks.fetchError"));
        } finally {
          setLoading(false);
        }
      };
      
      
  
      const handleReviewIntent = async () => {
        if (route?.params?.showReview && route?.params?.completedTask) {
          const task = route.params.completedTask;
  
          try {
            const check = await fetch(`https://task-kq94.onrender.com/api/reviews/task/${task._id}`);
            const review = await check.json();
  
            if (!review) {
              setReviewTask(task);
              setShowReview(true);
            }
          } catch (err) {
            console.warn("⚠️ Failed to check review for completed task");
          }
  
          // Prevent modal from showing again
          navigation.setParams({ showReview: false, completedTask: null });
        }
      };
  
      fetchTasks();
      handleReviewIntent();
    }, [route])
  );
  
  

  const submitReview = async () => {
    if (!rating || !reviewTask) {
      Alert.alert(
        t("clientReview.validationTitle", "Missing Information"),
        t("clientReview.validationMessage", "Please select a rating before submitting.")
      );
      return;
    }
    
    try {
      setSubmittingReview(true); // ✅ Show loading overlay
  
      await fetch("https://task-kq94.onrender.com/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: reviewTask._id,
          taskerId: reviewTask.taskerId,
          clientId: reviewTask.userId,
          rating,
          comment,
        }),
      });
  
      setSubmittingReview(false); // ✅ Hide overlay
  
      Alert.alert(t("clientMyTasks.thankYouTitle"), t("clientMyTasks.reviewSubmittedMessage"));
      setShowReview(false);
      setReviewTask(null);
      setRating(0);
      setComment("");
      setActiveTab("Previous");
      navigation.setParams({});
    } catch (err) {
      setSubmittingReview(false); // ✅ Hide on error
      Alert.alert(t("clientMyTasks.errorTitle"), t("clientMyTasks.reviewFailedMessage"));
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !reportTask) return;
    try {
      setIsReporting(true);
      const token = await SecureStore.getItemAsync("token");
      await fetch("https://task-kq94.onrender.com/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reporterId: userId,
          reportedUserId: reportTask.taskerId,
          reason: reportReason,
          taskId: reportTask._id,
        }),
      });
      
      setReportedTaskIds((prev) => [...prev, reportTask._id]);
      setIsReporting(false);
      setShowReportModal(false);
      setReportReason("");
      setReportTask(null);
      
      Alert.alert(
        t("clientMyTasks.reportedTitle"),
        t("clientMyTasks.reportedMessage")
      );
    } catch (err) {
      setIsReporting(false);
      console.error("❌ Report error:", err.message);
      Alert.alert(
        t("clientMyTasks.errorTitle"),
        t("clientMyTasks.reportFailedMessage")
      );
    }
  };
  
  const handleChat = (task) => {
    // task.taskerId is just a string ID, not an object
    const otherUserId = task.taskerId;
    const name = "Tasker"; // Default name since we don't have the tasker's name here
    console.log(" Navigating to Chat with:", { name, otherUserId });
    navigation.navigate("Chat", { name, otherUserId });
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("TaskDetails", { task: item })}
    >
      <View style={styles.card}>
        {/* ✅ Date Row */}
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          •{" "}
          {new Date(item.createdAt).toLocaleTimeString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
  
        {/* ✅ Divider Line Above Title */}
        <View style={{ height: 1, backgroundColor: "#e0e0e0", marginVertical: 6 }} />
  
        {/* ✅ Task Title */}
        <Text style={styles.cardTitle}>{item.title}</Text>
  
       {/* ✅ Completed / Cancelled Label for Previous Tab */}
{activeTab === "Previous" && (
  <>
    {item.status?.toLowerCase() === "completed" && (
      <Text
        style={{
          fontFamily: "InterBold",
          color: "#27a567",
          marginTop: 4,
        }}
      >
        {t("clientMyTasks.completed")}
      </Text>
    )}
    {item.status?.toLowerCase() === "cancelled" && (
      <Text
        style={{
          fontFamily: "InterBold",
          color: "#c00",
          marginTop: 4,
        }}
      >
        {item.cancelledBy === userId ? t("clientMyTasks.cancelledByYou") : t("clientMyTasks.cancelledByTasker")}
      </Text>
    )}
  </>
)}

  
        {/* ✅ Cancelled By Info */}
        {activeTab === "Cancelled" && item.cancelledBy && (
          <Text
            style={{ fontFamily: "Inter", color: "#c00", marginTop: 8 }}
          >
            {item.cancelledBy === userId ? t("clientMyTasks.cancelledByYou") : t("clientMyTasks.cancelledByTasker")}
          </Text>
        )}
  
        {/* ✅ View Details Hint */}
        <Text style={styles.viewDetails}>{t("clientMyTasks.viewTaskDetails")}</Text>

        {/* ✅ Pending Tab - View Bids Button */}
        {activeTab === "Pending" && (
          <TouchableOpacity
            style={styles.viewBidsBtn}
            onPress={() => navigation.navigate("TaskDetails", { task: item, showOffersTab: true })}
          >
            <Text style={styles.viewBidsText}>
              {t("clientMyTasks.viewBids", "View Bids")}
            </Text>
          </TouchableOpacity>
        )}

        {/* ✅ Started Tab - Chat, Mark as Done, Cancel Buttons */}
        {activeTab === "Started" && item.taskerId && (
          <View style={styles.buttonsRow}>
            {/* Chat Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleChat(item)}
            >
              <Text style={styles.actionBtnText}>
                {t("clientMyTasks.chat", "Chat")}
              </Text>
            </TouchableOpacity>

            {/* Mark as Done Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                Alert.alert(
                  t("clientMyTasks.markAsDoneConfirmTitle", "Mark as Done"),
                  t("clientMyTasks.markAsDoneConfirmMessage", "Are you sure you want to mark this task as completed?"),
                  [
                    { text: t("clientMyTasks.no", "No"), style: "cancel" },
                    {
                      text: t("clientMyTasks.yes", "Yes"),
                      onPress: async () => {
                        try {
                          setCompleting(true);
                          const res = await fetch(`https://task-kq94.onrender.com/api/tasks/${item._id}/complete`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" }
                          });
                          if (!res.ok) throw new Error("Failed to complete task");
                          
                          // Refresh the tasks list
                          const userId = await SecureStore.getItemAsync("userId");
                          const res2 = await fetch(`https://task-kq94.onrender.com/api/tasks/user/${userId}`);
                          const allTasks = await res2.json();
                          const grouped = { Pending: [], Started: [], Completed: [], Cancelled: [] };
                          allTasks.forEach((task) => {
                            const normalizedStatus = (task.status || "").toLowerCase();
                            if (normalizedStatus === "pending") {
                              grouped.Pending.push(task);
                            } else if (normalizedStatus === "started") {
                              grouped.Started.push(task);
                            } else if (normalizedStatus === "completed") {
                              grouped.Completed.push(task);
                            } else if (normalizedStatus === "cancelled") {
                              grouped.Cancelled.push(task);
                            }
                          });
                          setGroupedTasks(grouped);
                          setCompleting(false);
                          
                          Alert.alert(
                            t("clientMyTasks.successTitle", "Success"),
                            t("clientMyTasks.taskCompletedMessage", "Task has been marked as completed!")
                          );
                        } catch (err) {
                          setCompleting(false);
                          console.error("❌ Complete task error:", err.message);
                          Alert.alert(
                            t("clientMyTasks.errorTitle", "Error"),
                            t("clientMyTasks.completeTaskError", "Failed to complete task. Please try again.")
                          );
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.actionBtnText}>
                {t("clientMyTasks.markAsDone", "Mark as Done")}
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                Alert.alert(
                  t("clientMyTasks.cancelTaskConfirmTitle", "Cancel Task"),
                  t("clientMyTasks.cancelTaskConfirmMessage", "Are you sure you want to cancel this task?"),
                  [
                    { text: t("clientMyTasks.no", "No"), style: "cancel" },
                    {
                      text: t("clientMyTasks.yes", "Yes"),
                      onPress: async () => {
                        try {
                          setCanceling(true);
                          const userId = await SecureStore.getItemAsync("userId");
                          const res = await fetch(`https://task-kq94.onrender.com/api/tasks/${item._id}/cancel`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ cancelledBy: userId })
                          });
                          if (!res.ok) throw new Error("Failed to cancel task");
                          
                          // Refresh the tasks list
                          const res2 = await fetch(`https://task-kq94.onrender.com/api/tasks/user/${userId}`);
                          const allTasks = await res2.json();
                          const grouped = { Pending: [], Started: [], Completed: [], Cancelled: [] };
                          allTasks.forEach((task) => {
                            const normalizedStatus = (task.status || "").toLowerCase();
                            if (normalizedStatus === "pending") {
                              grouped.Pending.push(task);
                            } else if (normalizedStatus === "started") {
                              grouped.Started.push(task);
                            } else if (normalizedStatus === "completed") {
                              grouped.Completed.push(task);
                            } else if (normalizedStatus === "cancelled") {
                              grouped.Cancelled.push(task);
                            }
                          });
                          setGroupedTasks(grouped);
                          setCanceling(false);
                          
                          Alert.alert(
                            t("clientMyTasks.successTitle", "Success"),
                            t("clientMyTasks.taskCancelledMessage", "Task has been cancelled!")
                          );
                        } catch (err) {
                          setCanceling(false);
                          console.error("❌ Cancel task error:", err.message);
                          Alert.alert(
                            t("clientMyTasks.errorTitle", "Error"),
                            t("clientMyTasks.cancelTaskError", "Failed to cancel task. Please try again.")
                          );
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.actionBtnText}>
                {t("clientMyTasks.cancel", "Cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
  
        {/* ✅ View Profile & Report Buttons for Pending, Cancelled */}
        {["Pending", "Cancelled"].includes(activeTab) &&
          item.taskerId && (
            <View style={styles.buttonsRow}>
              {/* View Profile */}
              <TouchableOpacity
                style={styles.viewProfileBtn}
                onPress={() =>
                  navigation.navigate("TaskerProfile", {
                    taskerId:
                      typeof item.taskerId === "string"
                        ? item.taskerId
                        : item.taskerId?._id,
                  })
                }
              >
                <Text style={styles.viewProfileText}>
                  {t("clientMyTasks.viewProfile")}
                </Text>
              </TouchableOpacity>
  
              {/* Report Tasker */}
              <TouchableOpacity
                style={styles.reportBtn}
                disabled={reportingTaskId === item._id}
                onPress={() => {
                  setReportTask(item);
                  setShowReportModal(true);
                }}
              >
                <Text style={styles.reportText}>
                  {t("clientMyTasks.reportTasker")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
      </View>
    </TouchableOpacity>
  );
  
  

  return (
    <View style={styles.container}>
      {/* Review Modal */}
      <Modal isVisible={showReview} avoidKeyboard={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{ backgroundColor: "#fff", padding: 24, borderRadius: 20, maxHeight: "80%" }}>
              {submittingReview ? (
                <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#215433" style={{ marginBottom: 12 }} />
                  <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#215433" }}>
                    {t("clientReview.submitting", "Submitting review...")}
                  </Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text style={{ fontFamily: "InterBold", fontSize: 18, color: "#215433", marginBottom: 12 }}>
                    {t("clientReview.title", "Rate Your Tasker")}
                  </Text>

                  <CustomStarRating rating={rating} onChange={setRating} starSize={32} color="#FFD700" />

                  <TextInput
                    placeholder={t("clientReview.commentPlaceholder", "Leave a comment...")}
                    placeholderTextColor="#999"
                    value={comment}
                    onChangeText={(text) => {
                      if (text.length <= 300) setComment(text);
                    }}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 12,
                      padding: 12,
                      marginTop: 16,
                      fontFamily: "Inter",
                      fontSize: 14,
                      color: "#333",
                      textAlignVertical: "top",
                      minHeight: 80,
                      maxHeight: 120,
                    }}
                    multiline
                    maxLength={300}
                    blurOnSubmit={true}
                  />

                  <Text style={{ fontFamily: "Inter", fontSize: 12, color: "#999", marginTop: 4 }}>
                    {t("clientMyTasks.charactersCount", { count: comment.length })}
                  </Text>

                  <TouchableOpacity
                    style={{
                      backgroundColor: "#215433",
                      paddingVertical: 12,
                      borderRadius: 30,
                      marginTop: 20,
                      alignItems: "center",
                    }}
                    onPress={submitReview}
                  >
                    <Text style={{ color: "#fff", fontFamily: "InterBold", fontSize: 16 }}>
                      {t("clientReview.submit", "Submit Review")}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Report Modal */}
      <Modal isVisible={showReportModal}>
        <View style={{ backgroundColor: "#fff", padding: 24, borderRadius: 20 }}>
          {isReporting ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#215433" style={{ marginBottom: 12 }} />
              <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#215433" }}>
                {t("clientMyTasks.submittingReport", "Submitting report...")}
              </Text>
            </View>
          ) : (
            <>
              <Text style={{ fontFamily: "InterBold", fontSize: 18, color: "#215433", marginBottom: 12 }}>
                {t("clientMyTasks.reportPromptTitle", "Report Tasker")}
              </Text>

              <Text style={{ fontFamily: "Inter", fontSize: 14, color: "#666", marginBottom: 16 }}>
                {t("clientMyTasks.reportPromptMessage", "Please describe the issue with this tasker:")}
              </Text>

              <TextInput
                placeholder={t("clientMyTasks.reportPlaceholder", "Describe the issue...")}
                placeholderTextColor="#999"
                value={reportReason}
                onChangeText={(text) => {
                  if (text.length <= 300) setReportReason(text);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  fontFamily: "Inter",
                  fontSize: 14,
                  color: "#333",
                  textAlignVertical: "top",
                  height: 80,
                }}
                multiline
                maxLength={300}
              />

              <Text style={{ fontFamily: "Inter", fontSize: 12, color: "#999", marginBottom: 20 }}>
                {reportReason.length}/300 characters
              </Text>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#f5f5f5",
                    paddingVertical: 12,
                    borderRadius: 30,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setShowReportModal(false);
                    setReportReason("");
                    setReportTask(null);
                  }}
                >
                  <Text style={{ color: "#666", fontFamily: "InterBold", fontSize: 16 }}>
                    {t("clientMyTasks.cancel", "Cancel")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: reportReason.trim() ? "#215433" : "#ccc",
                    paddingVertical: 12,
                    borderRadius: 30,
                    alignItems: "center",
                  }}
                  onPress={submitReport}
                  disabled={!reportReason.trim()}
                >
                  <Text style={{ color: "#fff", fontFamily: "InterBold", fontSize: 16 }}>
                    {t("clientMyTasks.submit", "Submit")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Tabs */}
      <View style={styles.tabs}>
      {["Pending", "Started", "Previous"].map((tabKey) => (
  <TouchableOpacity
    key={tabKey}
    style={[styles.tab, activeTab === tabKey && styles.activeTab]}
    onPress={() => setActiveTab(tabKey)}
  >
    <Text style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}>
      {t(`clientMyTasks.${tabKey.toLowerCase()}`, tabKey)}
    </Text>
  </TouchableOpacity>
))}




    
      </View>

      {/* Task List */}
      {loading ? (
  <ActivityIndicator size="large" color="#215433" style={{ marginTop: 40 }} />
) : (
  <>
    {activeTab === "Previous" ? (
  <View>
    {/* Sub Tabs */}
    <View style={styles.subTabs}>
      {["Completed", "Cancelled"].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.subTab, previousSubTab === tab && styles.activeSubTab]}
          onPress={() => setPreviousSubTab(tab)}
        >
          <Text style={[styles.subTabText, previousSubTab === tab && styles.activeSubTabText]}>
            {t(`clientMyTasks.${tab.toLowerCase()}`, tab)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Sub-tab Content */}
    <FlatList
      data={groupedTasks[previousSubTab]}
      keyExtractor={(item) => item._id}
      renderItem={renderTask}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          {t("clientMyTasks.noTasks", {
            status: t(`clientMyTasks.${previousSubTab.toLowerCase()}`),
          })}
        </Text>
      }
      contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
    />
  </View>
) : (

      <FlatList
        data={groupedTasks[activeTab]}
        keyExtractor={(item) => item._id}
        renderItem={renderTask}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t("clientMyTasks.noTasks", {
              status: t(`clientMyTasks.${activeTab.toLowerCase()}`),
            })}
          </Text>
        }
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
      />
    )}
  </>
)}



{submittingReview && (
  <View style={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  }}>
    <View style={{
      backgroundColor: "#fff",
      padding: 24,
      borderRadius: 20,
      alignItems: "center",
    }}>
      <ActivityIndicator size="large" color="#215433" style={{ marginBottom: 10 }} />
      <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#215433" }}>
        {t("clientReview.submitting", "Submitting review...")}
      </Text>
    </View>
  </View>
)}



{isReporting && (
  <View style={{
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  }}>
    <View style={{
      backgroundColor: "#fff",
      padding: 24,
      borderRadius: 16,
      alignItems: "center",
    }}>
      <ActivityIndicator size="large" color="#215433" />
      <Text style={{ fontFamily: "InterBold", marginTop: 10, color: "#215433" }}>
        {t("clientMyTasks.submittingReport")}
      </Text>
    </View>
  </View>
)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#e9e9e9",
    borderRadius: 30,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: "#215433", // dark green
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontFamily: "Inter",
    color: "#555", // softer grey for inactive tabs
    fontSize: 14,
  },
  activeTabText: {
    color: "#fff",
    fontFamily: "InterBold",
  },
  
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 14,  // ✅ better vertical spacing
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  
  
  
  cardTitle: {
    fontFamily: "InterBold",
    fontSize: 17, // ✅ slightly larger
    color: "#215433",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  

  
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontFamily: "Inter",
    marginTop: 60,
  },
  detailHintText: {
    fontSize: 13,
    fontFamily: "Inter",
    color: "#555",
    textAlign: I18nManager.isRTL ? "right" : "left", // ✅
  },
  
  detailHintText: {
    fontSize: 13,
    fontFamily: "Inter",
    color: "#555",
  },
  
  
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#215433",
    marginVertical: 12,
    textAlign: I18nManager.isRTL ? "right" : "left", // ✅
  },

  subTabs: {
    flexDirection: "row",
    backgroundColor: "#e9e9e9",
    borderRadius: 20,
    marginBottom: 10,
    overflow: "hidden",
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 20,
  },
  activeSubTab: {
    backgroundColor: "#215433",
  },
  subTabText: {
    fontFamily: "Inter",
    color: "#215433",
    fontSize: 14,
  },
  activeSubTabText: {
    fontFamily: "InterBold",
    color: "#fff",
  },

  cardDate: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },

  viewDetails: {
    color: "#215433",       // ✅ green like screenshot
    fontFamily: "InterBold",
    fontSize: 13,
    marginTop: 8,           // ✅ proper spacing from previous content
    textDecorationLine: "underline", // ✅ underlined
  },

  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 4,
  },

  viewProfileBtn: {
    flex: 1,
    backgroundColor: "#215433",
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    marginRight: 8,
  },

  viewProfileText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 13,
  },

  reportBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#215433",
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  reportText: {
    color: "#215433",
    fontFamily: "InterBold",
    fontSize: 13,
  },
  
  viewBidsBtn: {
    backgroundColor: "#215433",
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },

  viewBidsText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 13,
  },

  actionBtn: {
    flex: 1,
    backgroundColor: "#215433",
    paddingVertical: 10,
    paddingHorizontal: 8, // Increased horizontal padding
    borderRadius: 30,
    alignItems: "center",
    marginHorizontal: 4,
    minWidth: 80, // Added minimum width
  },

  actionBtnText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 12, // Slightly smaller font size
    textAlign: "center",
  },
  
});