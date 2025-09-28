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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ExploreTasksScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const filterOptions = [
    { id: "nearest", label: "Nearest to you", icon: "location-outline" },
    { id: "cleaning", label: "Cleaning", icon: "broom-outline" },
    { id: "shopping", label: "Shopping & delivery", icon: "bag-outline" },
    { id: "handyman", label: "Handyman", icon: "construct-outline" },
    { id: "moving", label: "Moving", icon: "car-outline" },
    { id: "ikea", label: "IKEA assembly", icon: "hammer-outline" },
    { id: "yardwork", label: "Yardwork Services", icon: "leaf-outline" },
    { id: "dogwalking", label: "Dog Walking", icon: "paw-outline" },
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

  const fetchTasks = async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);

      if (!user.isVerified) {
        setTasks([]);
        setFilteredTasks([]);
        setLoading(false);
        return;
      }

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
    await Promise.all([fetchTasks(), fetchUnreadMessages()]);
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
      fetchUnreadMessages();
      return () => {};
    }, [])
  );

  // Filter tasks based on selected filter and search query
  useEffect(() => {
    let filtered = tasks;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
        filtered = filtered.filter(task => task.category === category);
      }
    }

    setFilteredTasks(filtered);
  }, [selectedFilter, searchQuery, tasks]);

  const getCategoryIcon = (category) => {
    const iconMap = {
      "Cleaning": "broom",
      "Shopping & Delivery": "shopping",
      "Handyman": "construct",
      "Moving": "car",
      "IKEA assembly": "hammer",
      "Yardwork Services": "leaf",
      "Dog Walking": "paw",
      "Other": "ellipsis-horizontal"
    };
    return iconMap[category] || "ellipsis-horizontal";
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
            <MaterialCommunityIcons 
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
            navigation.navigate("TaskerTaskDetails", { task });
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
    <View style={styles.messagesCard}>
      <View style={styles.messagesContent}>
        <View style={styles.chatIconContainer}>
          <Ionicons name="chatbubble-outline" size={24} color="#215433" />
          {unreadMessages > 0 && <View style={styles.notificationDot} />}
        </View>
        <Text style={styles.messagesText}>{unreadMessages} unread messages</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#215433" />
      </View>
    </View>
  );

  const renderWaitingOnTaskCard = () => (
    <View style={styles.waitingCard}>
      <Text style={styles.waitingTitle}>Waiting on a Task?</Text>
      <Text style={styles.waitingDescription}>
        Waiting for clients to accept your bids, if they still haven't you'll be able to see it in
      </Text>
      <TouchableOpacity 
        style={styles.bidSentButton}
        onPress={() => navigation.navigate("MyTasks")}
      >
        <Text style={styles.bidSentButtonText}>Bid Sent</Text>
      </TouchableOpacity>
      <Text style={styles.activeDescription}>But if they have you'll find it in</Text>
      <TouchableOpacity 
        style={styles.activeButton}
        onPress={() => navigation.navigate("MyTasks")}
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
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hi {currentUser?.name || "Tariq"},</Text>
          <Text style={styles.welcomeText}>Welcome to TASK!</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <Ionicons name="notifications-outline" size={24} color="#215433" />
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
        <Text style={styles.noTasksText}>No tasks available</Text>
      ) : (
        filteredTasks.map((task, index) => renderTaskCard(task, index))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 16,
  },
  waitingTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  waitingDescription: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  bidSentButton: {
    backgroundColor: "#e8f4ec",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  bidSentButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215433",
  },
  activeDescription: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  activeButton: {
    backgroundColor: "#215433",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  activeButtonText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#fff",
  },
  searchSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
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