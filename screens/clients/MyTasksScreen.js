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

const { width } = Dimensions.get("window");

export default function MyTasksScreen({ navigation, route }) {

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Pending");
  const [groupedTasks, setGroupedTasks] = useState({
    Pending: [],
    Started: [],
    Completed: [],
    Cancelled: [], // 🆕 add this

  });
  const [loading, setLoading] = useState(true);

  const [showReview, setShowReview] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetchTasks = async () => {
        try {
          setLoading(true);
          const userId = await SecureStore.getItemAsync("userId");
          if (!userId) throw new Error("No user ID");
  
          const res = await fetch(`https://task-kq94.onrender.com/api/tasks/user/${userId}`);
          const allTasks = await res.json();
  
          const grouped = { Pending: [], Started: [], Completed: [], Cancelled: [] };

          allTasks.forEach((task) => {
            if (task.status === "cancelled") {
              grouped.Cancelled.push(task);
            } else if (grouped[task.status]) {
              grouped[task.status].push(task);
            }
          });
          
  
          setGroupedTasks((prev) => {
            const updated = { ...prev };
            updated[activeTab] = updated[activeTab].filter((t) => t._id !== cancelledId);
            updated.Cancelled = [...updated.Cancelled, cancelledTask]; // 👈 move it to Cancelled tab
            return updated;
          });
            
          // Show review for any completed task without review (on first load)
          for (let task of grouped.Completed) {
            const check = await fetch(`https://task-kq94.onrender.com/api/reviews/task/${task._id}`);
            const review = await check.json();
          
            // ✅ Only show popup if there is NO review at all (null or empty array)
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

      Alert.alert("Thank you!", "Your review was submitted.");
      setShowReview(false);
      setReviewTask(null);
      setRating(0);
      setComment("");
      setActiveTab("Completed"); // 👈 make sure the tab is correct
      navigation.setParams({}); // 👈 clear old params

    } catch (err) {
      Alert.alert("Error", "Failed to submit review.");
    }
  };
  const renderTask = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("TaskDetails", { task: item })}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPrice}>{item.budget} BHD</Text>
  
        <View style={styles.detailHint}>
          <Text style={styles.detailHintText}>View Task Details</Text>
          <Text style={styles.detailArrow}>›</Text>
        </View>
        
      {/* ⬇️ ADD THIS BLOCK RIGHT HERE (inside renderTask) */}
      {activeTab === "Cancelled" && item.cancelledBy && (
        <Text style={{ fontFamily: "Inter", color: "#c00", marginTop: 8 }}>
          Cancelled by {item.cancelledBy === "client" ? "You" : "Tasker"}
        </Text>
      )}
    </View>
      
    </TouchableOpacity>
  );
  

  return (
    <View style={styles.container}>
      {/* Review Modal */}
      <Modal isVisible={showReview}>
        <View style={{ backgroundColor: "#fff", padding: 24, borderRadius: 20 }}>
        <Text style={{ fontFamily: "InterBold", fontSize: 18, color: "#213729", marginBottom: 12 }}>
  {t("clientReview.title", "Rate Your Tasker")}
</Text>


          <StarRating rating={rating} onChange={setRating} starSize={28} color="#215432" />
          <TextInput
  placeholder={t("clientReview.commentPlaceholder", "Leave a comment...")}
  value={comment}
  onChangeText={(text) => {
    if (text.length <= 300) setComment(text); // limit to 300 characters
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
        </View>
      </Modal>

      {/* Tabs */}
      <View style={styles.tabs}>
       {["Pending", "Started", "Completed", "Cancelled"].map((tabKey) => (
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
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    padding: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: "#213729",
  },
  tabText: {
    fontFamily: "Inter",
    color: "#213729",
    fontSize: 14,
  },
  activeTabText: {
    color: "#ffffff",
    fontFamily: "InterBold",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
    marginBottom: 6,
  },
  cardPrice: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215432",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontFamily: "Inter",
    marginTop: 60,
  },
  detailHint: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  
  detailHintText: {
    fontSize: 13,
    fontFamily: "Inter",
    color: "#555",
  },
  
  detailArrow: {
    fontSize: 16,
    color: "#555",
    marginLeft: 4,
    fontFamily: "InterBold",
  },
  
});
