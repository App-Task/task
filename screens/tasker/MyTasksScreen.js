import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth";
import { getToken } from "../../services/authStorage";
import EmptyIllustration from "../../components/EmptyIllustration";

export default function TaskerMyTasksScreen() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bidSent"); // "bidSent", "active", "previous"
  const [tasks, setTasks] = useState([]);
  const [bids, setBids] = useState([]);
  const [taskerId, setTaskerId] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await fetchCurrentUser();
      setTaskerId(user._id);

      if (!user.isVerified) {
        setTasks([]);
        setBids([]);
        setLoading(false);
        return;
      }

      const token = await getToken();

      if (activeTab === "bidSent") {
        // Load bids for "Bid Sent" tab
        const bidsRes = await axios.get(
          `https://task-kq94.onrender.com/api/bids/my-bids`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("🔍 Raw bids data:", JSON.stringify(bidsRes.data, null, 2));
        
        // If the API doesn't populate taskId, we need to fetch tasks separately
        const bidsWithTasks = await Promise.all(
          bidsRes.data.map(async (bid) => {
            try {
              if (typeof bid.taskId === "string") {
                const taskRes = await axios.get(
                  `https://task-kq94.onrender.com/api/tasks/${bid.taskId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                return { ...bid, taskId: taskRes.data };
              }
              return bid;
            } catch (err) {
              console.error("❌ Error fetching task for bid:", err.message);
              return bid;
            }
          })
        );
        
        console.log("🔍 Bids with tasks:", JSON.stringify(bidsWithTasks, null, 2));
        setBids(bidsWithTasks);
      } else {
        // Load tasks for "Active" and "Previous" tabs
        const url = `https://task-kq94.onrender.com/api/tasks/tasker/${user._id}?type=${activeTab === "previous" ? "past" : "active"}`;
        const tasksRes = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(tasksRes.data);
      }
    } catch (err) {
      console.error("❌ Error loading data:", err.message);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBid = async (item) => {
    try {
      let task, bid;
      
      if (item.taskId && typeof item.taskId === "object") {
        // It's a bid object
        task = item.taskId;
        bid = item;
      } else {
        // It's a task object, we need to find the bid
        task = item;
        
        // Fetch the bid for this task
        const token = await getToken();
        const bidsRes = await axios.get(
          `https://task-kq94.onrender.com/api/bids/tasker/${taskerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        bid = bidsRes.data.find(b => 
          (b.taskId?._id || b.taskId) === task._id
        );
        
        if (!bid) {
          Alert.alert("Error", "Bid not found for this task.");
          return;
        }
      }
      
      navigation.navigate("EditBid", { 
        task: task, 
        existingBid: bid 
      });
    } catch (err) {
      console.error("❌ Edit bid error:", err.message);
      Alert.alert("Error", "Failed to load bid information.");
    }
  };

  const handleWithdrawBid = async (item) => {
    try {
      let bid;
      
      if (item.taskId && typeof item.taskId === "object") {
        // It's a bid object
        bid = item;
      } else {
        // It's a task object, we need to find the bid
        const token = await getToken();
        const bidsRes = await axios.get(
          `https://task-kq94.onrender.com/api/bids/tasker/${taskerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        bid = bidsRes.data.find(b => 
          (b.taskId?._id || b.taskId) === item._id
        );
        
        if (!bid) {
          Alert.alert("Error", "Bid not found for this task.");
          return;
        }
      }
      
      Alert.alert(
        "Withdraw Bid",
        "Are you sure you want to withdraw this bid?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Withdraw",
            style: "destructive",
            onPress: async () => {
              try {
                const token = await getToken();
                await axios.delete(
                  `https://task-kq94.onrender.com/api/bids/${bid._id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                Alert.alert("Success", "Bid withdrawn successfully.");
                loadData(); // Refresh the data
              } catch (err) {
                console.error("❌ Withdraw bid error:", err.message);
                Alert.alert("Error", "Failed to withdraw bid. Please try again.");
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error("❌ Withdraw bid error:", err.message);
      Alert.alert("Error", "Failed to load bid information.");
    }
  };

  const handleViewDetails = (item) => {
    console.log("🔍 Item data for details:", item);
    console.log("🔍 Active tab:", activeTab);
    
    let task;
    
    if (activeTab === "bidSent") {
      // Check if item is a bid object (has taskId) or already a task object
      if (item.taskId && typeof item.taskId === "object") {
        // It's a bid object with populated taskId
        task = item.taskId;
      } else if (item.taskId && typeof item.taskId === "string") {
        // It's a bid object with string taskId - this shouldn't happen with our new logic
        console.error("❌ Unexpected: bid has string taskId after population");
        Alert.alert("Error", "Task data is not properly loaded.");
        return;
      } else {
        // It's already a task object (API returned tasks instead of bids)
        task = item;
      }
    } else {
      // For other tabs, item is already a task
      task = item;
    }
    
    console.log("🔍 Final task data:", task);
    
    // Ensure task has required properties
    if (!task || !task._id) {
      console.error("❌ Task data missing:", { task, item, activeTab });
      Alert.alert("Error", "Task information is not available.");
      return;
    }
    
    // Ensure task has status property
    if (!task.status) {
      task.status = "Pending"; // Default status
    }
    
    navigation.navigate("TaskerTaskDetails", { task });
  };

  const handleChat = (task) => {
    navigation.navigate("Chat", {
      name: task.user?.name || "Client",
      otherUserId: task.user?._id || task.userId,
    });
  };

  const renderBidCard = ({ item }) => {
    // Check if item is a bid object or a task object
    const isBidObject = item.taskId !== undefined;
    const task = isBidObject ? item.taskId : item;
    const bidData = isBidObject ? item : null;
    
    return (
      <View style={styles.card}>
        {/* Date and Time */}
        <Text style={styles.dateText}>
          {new Date((task || item).createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          •{" "}
          {new Date((task || item).createdAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        {/* Task Title */}
        <Text style={styles.taskTitle}>
          {(task || item).title || "Task Title"}
        </Text>

        {/* View Details Link */}
        <TouchableOpacity onPress={() => handleViewDetails(item)}>
          <Text style={styles.viewDetailsLink}>View Details</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditBid(bidData || item)}
          >
            <Text style={styles.actionButtonText}>Edit Bid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleWithdrawBid(bidData || item)}
          >
            <Text style={styles.actionButtonText}>Withdraw Bid</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTaskCard = ({ item }) => (
    <View style={styles.card}>
      {/* Date and Time */}
      <Text style={styles.dateText}>
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

      {/* Participants Icon */}
      <View style={styles.participantsIcon}>
        <Ionicons name="people-outline" size={16} color="#666" />
      </View>

      {/* Task Title */}
      <Text style={styles.taskTitle}>{item.title || "Task Title"}</Text>

      {/* View Task Details Link */}
      <TouchableOpacity onPress={() => handleViewDetails(item)}>
        <Text style={styles.viewDetailsLink}>View Task Details</Text>
      </TouchableOpacity>

      {/* Chat Button */}
      {activeTab === "active" && (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleChat(item)}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIllustration}>
        <EmptyIllustration size={140} />
      </View>
      <Text style={styles.emptyTitle}>No Tasks Here</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "bidSent" 
          ? "Start bidding on Tasks!" 
          : activeTab === "active"
          ? "Start bidding on Tasks!"
          : "Start posting on Tasks, and get help today!"
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === "bidSent" && styles.activeSegment,
          ]}
          onPress={() => setActiveTab("bidSent")}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === "bidSent" && styles.activeSegmentText,
            ]}
          >
            Bid Sent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === "active" && styles.activeSegment,
          ]}
          onPress={() => setActiveTab("active")}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === "active" && styles.activeSegmentText,
            ]}
          >
            {activeTab === "active" ? "In Progress" : "Active"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === "previous" && styles.activeSegment,
          ]}
          onPress={() => setActiveTab("previous")}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === "previous" && styles.activeSegmentText,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#215433" />
        </View>
      ) : (
        <FlatList
          data={activeTab === "bidSent" ? bids : tasks}
          keyExtractor={(item) => item._id}
          renderItem={activeTab === "bidSent" ? renderBidCard : renderTaskCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  activeSegment: {
    backgroundColor: "#4CAF50",
  },
  segmentText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#616161",
  },
  activeSegmentText: {
    fontFamily: "InterBold",
    color: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyIllustration: {
    marginBottom: 30,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#CFD8DC",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  stopwatch: {
    position: "absolute",
    right: 15,
    top: 20,
    width: 50,
    height: 50,
  },
  stopwatchFace: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#000000",
    position: "relative",
    overflow: "hidden",
  },
  stopwatchProgress: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "33%",
    height: "100%",
    backgroundColor: "#C6FF00",
  },
  stopwatchButton: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  mug: {
    position: "absolute",
    left: 10,
    bottom: 15,
    width: 30,
    height: 25,
    backgroundColor: "#ffffff",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#000000",
  },
  mugHandle: {
    position: "absolute",
    right: -8,
    top: 5,
    width: 8,
    height: 12,
    borderWidth: 1,
    borderColor: "#000000",
    borderLeftWidth: 0,
    borderRadius: 0,
  },
  mugLiquid: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    height: 8,
    backgroundColor: "#C6FF00",
    borderRadius: 1,
  },
  emptyTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#616161",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  participantsIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  taskTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  viewDetailsLink: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#999",
    textDecorationLine: "underline",
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#215433",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    fontFamily: "InterBold",
    fontSize: 14,
    color: "#ffffff",
  },
  chatButton: {
    backgroundColor: "#215433",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  chatButtonText: {
    fontFamily: "InterBold",
    fontSize: 14,
    color: "#ffffff",
  },
});