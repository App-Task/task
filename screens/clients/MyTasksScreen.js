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
} from "react-native";
import { useTranslation } from "react-i18next";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import Modal from "react-native-modal";
import StarRating from "react-native-star-rating-widget";
import { I18nManager } from "react-native";


const { width } = Dimensions.get("window");

export default function MyTasksScreen({ navigation, route }) {

  const { t } = useTranslation();
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
          Alert.alert("Error", t("clientMyTasks.fetchError"));
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
    if (!rating || !reviewTask) return;
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
  
      Alert.alert("Thank you!", "Your review was submitted.");
      setShowReview(false);
      setReviewTask(null);
      setRating(0);
      setComment("");
      setActiveTab("Previous");
      navigation.setParams({});
    } catch (err) {
      setSubmittingReview(false); // ✅ Hide on error
      Alert.alert("Error", "Failed to submit review.");
    }
  };
  
  const renderTask = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("TaskDetails", { task: item })}
    >
      <View style={styles.card}>
        {/* ✅ Date Row */}
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          •{" "}
          {new Date(item.createdAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
  
        {/* ✅ Divider Line Above Title */}
        <View style={{ height: 1, backgroundColor: "#e0e0e0", marginVertical: 6 }} />
  
        {/* ✅ Task Title & Price */}
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPrice}>{item.budget} BHD</Text>
  
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
        Completed
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
        Cancelled by {item.cancelledBy === userId ? "you" : "Tasker"}
      </Text>
    )}
  </>
)}

  
        {/* ✅ Cancelled By Info */}
        {activeTab === "Cancelled" && item.cancelledBy && (
          <Text
            style={{ fontFamily: "Inter", color: "#c00", marginTop: 8 }}
          >
            Cancelled by {item.cancelledBy === userId ? "You" : "Tasker"}
          </Text>
        )}
  
        {/* ✅ View Details Hint */}
        <Text style={styles.viewDetails}>View Task Details</Text>

  
        {/* ✅ View Profile & Report Buttons */}
        {["Pending", "Started", "Cancelled"].includes(activeTab) &&
          item.taskerId && (
            <View
              style={{ marginTop: 10, flexDirection: "row", gap: 12 }}
            >
              {/* View Profile */}
              <TouchableOpacity
                style={{
                  backgroundColor: "#213729",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 30,
                }}
                onPress={() =>
                  navigation.navigate("TaskerProfile", {
                    taskerId:
                      typeof item.taskerId === "string"
                        ? item.taskerId
                        : item.taskerId?._id,
                  })
                }
              >
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "InterBold",
                    fontSize: 13,
                  }}
                >
                  View Profile
                </Text>
              </TouchableOpacity>
  
              {/* Report Tasker */}
              <TouchableOpacity
                style={{
                  backgroundColor: "#fff",
                  borderColor: "#213729",
                  borderWidth: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 30,
                }}
                disabled={reportingTaskId === item._id}
                onPress={() => {
                  Alert.prompt(
                    "Report Tasker",
                    "Enter reason for reporting this tasker:",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Submit",
                        onPress: async (reason) => {
                          try {
                            setReportingTaskId(item._id);
                            setIsReporting(true);
                            const token =
                              await SecureStore.getItemAsync("token");
                            await fetch(
                              "https://task-kq94.onrender.com/api/reports",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  reporterId: userId,
                                  reportedUserId: item.taskerId,
                                  reason,
                                  taskId: item._id,
                                }),
                              }
                            );
                            setReportedTaskIds((prev) => [
                              ...prev,
                              item._id,
                            ]);
                            Alert.alert(
                              "Reported",
                              "Tasker has been reported successfully."
                            );
                          } catch (err) {
                            console.error("❌ Report error:", err.message);
                            Alert.alert(
                              "Error",
                              "Failed to submit report."
                            );
                          } finally {
                            setIsReporting(false);
                            setReportingTaskId(null);
                          }
                        },
                      },
                    ],
                    "plain-text"
                  );
                }}
              >
                <Text
                  style={{
                    color: "#213729",
                    fontFamily: "InterBold",
                    fontSize: 13,
                  }}
                >
                  Report Tasker
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
      <Modal isVisible={showReview}>
  <View style={{ backgroundColor: "#fff", padding: 24, borderRadius: 20 }}>
    {submittingReview ? (
      <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
        <ActivityIndicator size="large" color="#213729" style={{ marginBottom: 12 }} />
        <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#213729" }}>
          {t("clientReview.submitting", "Submitting review...")}
        </Text>
      </View>
    ) : (
      <>
        <Text style={{ fontFamily: "InterBold", fontSize: 18, color: "#213729", marginBottom: 12 }}>
          {t("clientReview.title", "Rate Your Tasker")}
        </Text>

        <StarRating rating={rating} onChange={setRating} starSize={28} color="#215432" />

        <TextInput
          placeholder={t("clientReview.commentPlaceholder", "Leave a comment...")}
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
          }}
          multiline
          maxLength={300}
        />

        <Text style={{ fontFamily: "Inter", fontSize: 12, color: "#999", marginTop: 4 }}>
          {comment.length}/300 characters
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: "#213729",
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
  <ActivityIndicator size="large" color="#213729" style={{ marginTop: 40 }} />
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
      <ActivityIndicator size="large" color="#213729" style={{ marginBottom: 10 }} />
      <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#213729" }}>
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
      <ActivityIndicator size="large" color="#213729" />
      <Text style={{ fontFamily: "InterBold", marginTop: 10, color: "#213729" }}>
        Submitting Report...
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
    backgroundColor: "#213729", // dark green like screenshot
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
    color: "#213729",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  
  cardPrice: {
    fontFamily: "InterBold", // ✅ bold like screenshot
    fontSize: 15,
    color: "#215432",
    marginBottom: 6,
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
    color: "#213729",
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
    backgroundColor: "#213729",
  },
  subTabText: {
    fontFamily: "Inter",
    color: "#213729",
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
    color: "#213729",       // ✅ green like screenshot
    fontFamily: "InterBold",
    fontSize: 13,
    marginTop: 8,           // ✅ proper spacing from previous content
    textDecorationLine: "underline", // ✅ underlined
  },
  
  
  
  
  
});