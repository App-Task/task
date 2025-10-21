import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getToken } from "../../services/authStorage";
import { fetchCurrentUser } from "../../services/auth";
import { useFocusEffect } from "@react-navigation/native";
import EmptyState from "../../components/EmptyState";
import VerificationPopup from "../../components/VerificationPopup";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ExploreTasksScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const filterOptions = [
    { id: "nearest", label: "Nearest to you", icon: "location-outline" },
    { id: "cleaning", label: "Cleaning", icon: "water-outline" },
    { id: "shopping", label: "Shopping & delivery", icon: "bag-outline" },
    { id: "handyman", label: "Handyman", icon: "hammer-outline" },
    { id: "moving", label: "Moving", icon: "car-outline" },
    { id: "ikea", label: "IKEA assembly", icon: "build-outline" },
    { id: "yardwork", label: "Yardwork Services", icon: "leaf-outline" },
    { id: "dogwalking", label: "Dog Walking", icon: "walk-outline" },
    { id: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
  ];

  const fetchUnreadMessages = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("https://task-kq94.onrender.com/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const totalUnread = res.data.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0);
      setUnreadMessages(totalUnread);
    } catch (err) {
      console.error("❌ Failed to fetch unread messages:", err.message);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("https://task-kq94.onrender.com/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const unreadCount = res.data.filter(notification => !notification.isRead).length;
      setUnreadNotifications(unreadCount);
    } catch (err) {
      console.error("❌ Failed to fetch notifications:", err.message);
      setUnreadNotifications(0);
    }
  };

  const fetchTasks = async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);

      const token = await getToken();
      const taskRes = await axios.get(
        "https://task-kq94.onrender.com/api/tasks",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Get bids made by this tasker to exclude them
      const bidRes = await axios.get(
        `https://task-kq94.onrender.com/api/bids/tasker/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const bidTaskIds = bidRes.data.map((bid) =>
        typeof bid.taskId === "object" ? bid.taskId._id : bid.taskId
      );

      // Filter out tasks already bid on and only show pending tasks
      const availableTasks = taskRes.data.filter(
        (task) => !bidTaskIds.includes(task._id) && task.status === "Pending"
      );

      setTasks(availableTasks);
      setFilteredTasks(availableTasks);
    } catch (err) {
      console.error("❌ Error fetching tasks:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), fetchUnreadMessages(), fetchUnreadNotifications()]);
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
      fetchUnreadMessages();
      fetchUnreadNotifications();
      return () => {};
    }, [])
  );

  // Filter tasks based on selected filter and search query
  useEffect(() => {
    let filtered = [...tasks]; // Create a copy to avoid mutating original array
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (selectedFilter && selectedFilter !== "nearest") {
      const categoryMap = {
        cleaning: "Cleaning",
        shopping: "Shopping & Delivery", 
        handyman: "Handyman",
        moving: "Moving",
        ikea: "IKEA assembly",
        yardwork: "Yardwork Services",
        dogwalking: "Dog Walking",
        other: "Other"
      };
      
      const category = categoryMap[selectedFilter];
      if (category) {
        filtered = filtered.filter(task => {
          const taskCategory = task.category || "";
          return taskCategory.toLowerCase() === category.toLowerCase();
        });
      }
    }

    setFilteredTasks(filtered);
  }, [selectedFilter, searchQuery, tasks]);

  const getCategoryIcon = (category) => {
    const iconMap = {
      "Cleaning": "water-outline",
      "cleaning": "water-outline",
      "Shopping & Delivery": "bag-outline",
      "shopping": "bag-outline",
      "Handyman": "hammer-outline",
      "handyman": "hammer-outline",
      "Moving": "car-outline",
      "moving": "car-outline",
      "IKEA assembly": "build-outline",
      "ikea assembly": "build-outline",
      "Yardwork Services": "leaf-outline",
      "yardwork services": "leaf-outline",
      "Dog Walking": "walk-outline",
      "dog walking": "walk-outline",
      "Other": "ellipsis-horizontal-outline",
      "other": "ellipsis-horizontal-outline"
    };
    return iconMap[category] || "ellipsis-horizontal-outline";
  };

  const toggleTaskExpansion = (taskId) => {
    const newExpandedTasks = new Set(expandedTasks);
    if (newExpandedTasks.has(taskId)) {
      newExpandedTasks.delete(taskId);
    } else {
      newExpandedTasks.add(taskId);
    }
    setExpandedTasks(newExpandedTasks);
  };

  const renderTaskCard = (task, index) => {
    const taskId = task._id || index;
    const isExpanded = expandedTasks.has(taskId);
    const description = task.description || "It is a long established fact that a reader will be distracted by the readable content of a page when It is a long established fact that a reader";
    const shouldTruncate = description.length > 100;
    const displayDescription = isExpanded || !shouldTruncate ? description : `${description.substring(0, 100)}...`;

    return (
      <TouchableOpacity 
        key={taskId} 
        style={styles.taskCard}
        onPress={() => navigation.navigate("TaskerTaskDetails", { task })}
        activeOpacity={0.7}
      >
        <Text style={styles.taskTitle}>{task.title || "Task Title"}</Text>
        
        <View style={styles.taskTags}>
          <View style={styles.tag}>
            <Ionicons 
              name={getCategoryIcon(task.category)} 
              size={16} 
              color="#215433" 
            />
            <Text style={styles.tagText}>{task.category || "Other"}</Text>
          </View>
          <View style={styles.budgetTag}>
            <Text style={styles.budgetText}>Client Budget: {task.budget || "5"}BHD</Text>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.taskDescription}>
            {displayDescription}
          </Text>
          {shouldTruncate && (
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation(); // Prevent card navigation when pressing Read More
                toggleTaskExpansion(taskId);
              }}
            >
              <Text style={styles.readMoreLink}>
                {isExpanded ? "Read Less" : "Read More..."}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.bidButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent card navigation when pressing Bid button
            console.log("Bid button pressed, currentUser:", currentUser);
            console.log("isVerified:", currentUser?.isVerified);
            // Temporarily force show popup for testing
            setShowVerificationPopup(true);
            // if (currentUser && !currentUser.isVerified) {
            //   console.log("Showing verification popup");
            //   setShowVerificationPopup(true);
            // } else {
            //   console.log("Navigating to task details");
            //   navigation.navigate("TaskerTaskDetails", { task });
            // }
          }}
        >
          <Text style={styles.bidButtonText}>Bid on Task</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderVerificationCard = () => (
    <View style={styles.verificationCard}>
      <View style={styles.verificationContent}>
        <Ionicons name="hourglass-outline" size={24} color="#215433" />
        <Text style={styles.verificationText}>Pending document verification</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#215433" />
      </View>
    </View>
  );

  const renderUnreadMessagesCard = () => (
    <TouchableOpacity 
      style={styles.messagesCard}
      onPress={() => navigation.navigate("Messages")}
      activeOpacity={0.7}
    >
      <View style={styles.messagesContent}>
        <View style={styles.chatIconContainer}>
          <Ionicons name="chatbubble-outline" size={24} color="#215433" />
          {unreadMessages > 0 && <View style={styles.notificationDot} />}
        </View>
        <Text style={styles.messagesText}>{unreadMessages} unread messages</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#215433" />
      </View>
    </TouchableOpacity>
  );

  const renderWaitingOnTaskCard = () => (
    <View style={styles.waitingCard}>
      <Text style={styles.waitingTitle}>Waiting on a Task?</Text>
      <Text style={styles.waitingDescription}>
        Waiting for clients to accept your bids, if they still haven't you'll be able to see it in
      </Text>
      <TouchableOpacity 
        style={styles.bidSentButton}
        onPress={() => navigation.navigate("MyTasks", { targetTab: "bidSent" })}
      >
        <Text style={styles.bidSentButtonText}>Bid Sent</Text>
      </TouchableOpacity>
      <Text style={styles.activeDescription}>But if they have you'll find it in</Text>
      <TouchableOpacity 
        style={styles.activeButton}
        onPress={() => navigation.navigate("MyTasks", { targetTab: "active" })}
      >
        <Text style={styles.activeButtonText}>Active</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchSection = () => (
    <View style={styles.searchSection}>
      <Text style={styles.searchTitle}>Search for Tasks</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search tasks..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <Text style={styles.filterLabel}>Filter by...</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(
              selectedFilter === filter.id ? null : filter.id
            )}
          >
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color={selectedFilter === filter.id ? "#fff" : "#215433"} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter.id && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
        {selectedFilter && (
          <TouchableOpacity
            style={[styles.filterChip, styles.clearFilterChip]}
            onPress={() => setSelectedFilter(null)}
          >
            <Ionicons name="close-outline" size={16} color="#666" />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      {/* Divider after filter badges */}
      <View style={styles.divider} />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={filteredTasks.length === 0 ? styles.emptyScrollContainer : undefined}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#215432"
            colors={["#215432"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hi {currentUser?.name || "Tariq"},</Text>
            <Text style={styles.welcomeText}>Welcome to TASK!</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
            <View style={styles.notificationIconContainer}>
              <Ionicons name="notifications-outline" size={24} color="#215433" />
              {(unreadMessages > 0 || unreadNotifications > 0) && <View style={styles.headerNotificationDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Verification or Messages Card */}
        {!currentUser?.isVerified ? renderVerificationCard() : renderUnreadMessagesCard()}

        {/* Waiting on Task Card */}
        {renderWaitingOnTaskCard()}

        {/* Search Section */}
        {renderSearchSection()}

        {/* Task Cards */}
        {loading ? (
          <ActivityIndicator size="large" color="#215433" style={styles.loading} />
        ) : filteredTasks.length === 0 ? (
          <EmptyState 
            title="No Tasks Available" 
            subtitle="No tasks match your current filters. Try adjusting your search or filters to find more tasks."
          />
        ) : (
          filteredTasks.map((task, index) => renderTaskCard(task, index))
        )}
      </ScrollView>

      {/* Verification Popup */}
      <VerificationPopup
        visible={showVerificationPopup}
        onClose={() => setShowVerificationPopup(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
  },
  emptyScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  notificationIconContainer: {
    position: "relative",
  },
  headerNotificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4444",
  },
  greeting: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#215433",
    marginBottom: 4,
  },
  welcomeText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#666",
  },
  verificationCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000000",
  },
  verificationContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  verificationText: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 16,
    color: "#215433",
    marginLeft: 12,
  },
  messagesCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000000",
  },
  messagesContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  chatIconContainer: {
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4444",
  },
  messagesText: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 16,
    color: "#215433",
    marginLeft: 12,
  },
  waitingCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000000",
    padding: 16,
  },
  waitingTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#414141",
    marginBottom: 12,
    textAlign: "left",
  },
  waitingDescription: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#414141",
    marginBottom: 16,
    lineHeight: 20,
    textAlign: "left",
  },
  bidSentButton: {
    backgroundColor: "#e8f4ec",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  bidSentButtonText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#215433",
  },
  activeDescription: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#414141",
    marginBottom: 16,
    textAlign: "left",
  },
  activeButton: {
    backgroundColor: "#215433",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  activeButtonText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#fff",
  },
  searchSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchTitle: {
    fontFamily: "InterBold",
    fontSize: 28,
    color: "#666",
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter",
    marginBottom: 12,
  },
  filterLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  filterContainer: {
    paddingRight: 20,
  },
  divider: {
    height: 2,
    backgroundColor: "#e0e0e0",
    marginTop: 20,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#215433",
    borderColor: "#215433",
  },
  filterChipText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215433",
    marginLeft: 6,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  clearFilterChip: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ccc",
  },
  clearFilterText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  taskCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000000",
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  taskTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  taskTags: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
    alignItems: "center",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tagText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#215433",
    marginLeft: 4,
  },
  budgetTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  budgetText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#215433",
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  taskDescription: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  readMoreLink: {
    color: "#0066cc",
    textDecorationLine: "underline",
    fontFamily: "Inter",
    fontSize: 14,
    marginTop: 4,
  },
  bidButton: {
    backgroundColor: "#215433",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  bidButtonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#fff",
  },
  loading: {
    marginVertical: 40,
  },
  noTasksText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 40,
  },
});