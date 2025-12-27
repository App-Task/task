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
  Platform,
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import axios from "axios";
import { getToken } from "../../services/authStorage";
import { fetchCurrentUser } from "../../services/auth";
import { useFocusEffect } from "@react-navigation/native";
import EmptyState from "../../components/EmptyState";
import VerificationPopup from "../../components/VerificationPopup";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ExploreTasksScreen({ navigation }) {
  const { t } = useTranslation();
  const isRTL = i18n.language === "ar";
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

  // Single source of truth for all categories
  const categoryConfig = {
    "Cleaning": { icon: "water-outline", translationKey: "clientPostTask.categories.cleaning" },
    "Shopping & Delivery": { icon: "bag-outline", translationKey: "clientPostTask.categories.shopping" },
    "Handyman": { icon: "construct-outline", translationKey: "clientPostTask.categories.handyman" },
    "Moving": { icon: "car-outline", translationKey: "clientPostTask.categories.moving" },
    "IKEA assembly": { icon: "bed-outline", translationKey: "clientPostTask.categories.furniture" },
    "Yardwork Services": { icon: "leaf-outline", translationKey: "clientPostTask.categories.yardwork" },
    "Dog Walking": { icon: "paw-outline", translationKey: "clientPostTask.categories.dogWalking" },
    "Other": { icon: "ellipsis-horizontal-outline", translationKey: "clientPostTask.categories.other" },
  };

  const filterOptions = [
    { id: "nearest", label: t("taskerExplore.nearestToYou"), icon: "location-outline" },
    { id: "cleaning", label: t("clientPostTask.categories.cleaning"), icon: "water-outline" },
    { id: "shopping", label: t("clientPostTask.categories.shopping"), icon: "bag-outline" },
    { id: "handyman", label: t("clientPostTask.categories.handyman"), icon: "construct-outline" },
    { id: "moving", label: t("clientPostTask.categories.moving"), icon: "car-outline" },
    { id: "ikea", label: t("clientPostTask.categories.furniture"), icon: "bed-outline" },
    { id: "yardwork", label: t("clientPostTask.categories.yardwork"), icon: "leaf-outline" },
    { id: "dogwalking", label: t("clientPostTask.categories.dogWalking"), icon: "paw-outline" },
    { id: "other", label: t("clientPostTask.categories.other"), icon: "ellipsis-horizontal-outline" },
  ];

  const getCategoryConfig = (category) => {
    // Normalize input
    const normalized = category || "Other";
    
    // Check exact match
    if (categoryConfig[normalized]) {
      return categoryConfig[normalized];
    }
    
    // Check case-insensitive match
    const normalizedLower = normalized.toLowerCase();
    for (const [key, config] of Object.entries(categoryConfig)) {
      if (key.toLowerCase() === normalizedLower) {
        return config;
      }
    }
    
    // Handle English aliases/variants
    const aliasMap = {
      "pet": "Dog Walking",
      "pet services": "Dog Walking",
      "furniture assembly": "IKEA assembly",
      "furniture": "IKEA assembly",
      "yardwork": "Yardwork Services",
      "shopping": "Shopping & Delivery",
      "shopping & delivery": "Shopping & Delivery",
      "cleaning": "Cleaning",
      "handyman": "Handyman",
      "moving": "Moving",
      "dog walking": "Dog Walking",
      "other": "Other"
    };
    
    if (aliasMap[normalizedLower]) {
      return categoryConfig[aliasMap[normalizedLower]];
    }
    
    // Handle Arabic category names (if categories are stored in Arabic in the database)
    const arabicAliasMap = {
      "التنظيف": "Cleaning",
      "التسوق والتوصيل": "Shopping & Delivery",
      "أعمال الصيانة": "Handyman",
      "النقل": "Moving",
      "تركيب الأثاث": "IKEA assembly",
      "أعمال الحديقة": "Yardwork Services",
      "تمشية الكلاب": "Dog Walking",
      "خدمات الحيوانات الأليفة": "Dog Walking",
      "أخرى": "Other"
    };
    
    if (arabicAliasMap[normalized]) {
      return categoryConfig[arabicAliasMap[normalized]];
    }
    
    // Return default for "Other"
    return categoryConfig["Other"];
  };

  // Get the normalized categoryConfig key for a given category string
  const getNormalizedCategoryKey = (category) => {
    const normalized = (category || "").trim();
    if (!normalized) return "Other";
    
    // Check exact match
    if (categoryConfig[normalized]) {
      return normalized;
    }
    
    // Check case-insensitive match
    const normalizedLower = normalized.toLowerCase();
    for (const key of Object.keys(categoryConfig)) {
      if (key.toLowerCase() === normalizedLower) {
        return key;
      }
    }
    
    // Handle English aliases/variants
    const aliasMap = {
      "pet": "Dog Walking",
      "pet services": "Dog Walking",
      "furniture assembly": "IKEA assembly",
      "furniture": "IKEA assembly",
      "yardwork": "Yardwork Services",
      "shopping": "Shopping & Delivery",
      "shopping & delivery": "Shopping & Delivery",
      "cleaning": "Cleaning",
      "handyman": "Handyman",
      "moving": "Moving",
      "dog walking": "Dog Walking",
      "other": "Other"
    };
    
    if (aliasMap[normalizedLower]) {
      return aliasMap[normalizedLower];
    }
    
    // Handle Arabic category names (if categories are stored in Arabic in the database)
    const arabicAliasMap = {
      "التنظيف": "Cleaning",
      "التسوق والتوصيل": "Shopping & Delivery",
      "أعمال الصيانة": "Handyman",
      "النقل": "Moving",
      "تركيب الأثاث": "IKEA assembly",
      "أعمال الحديقة": "Yardwork Services",
      "تمشية الكلاب": "Dog Walking",
      "خدمات الحيوانات الأليفة": "Dog Walking",
      "أخرى": "Other"
    };
    
    if (arabicAliasMap[normalized]) {
      return arabicAliasMap[normalized];
    }
    
    // Return default for "Other"
    return "Other";
  };

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
      // Map filter IDs to their corresponding category names from categoryConfig
      const filterToCategoryMap = {
        cleaning: "Cleaning",
        shopping: "Shopping & Delivery", 
        handyman: "Handyman",
        moving: "Moving",
        ikea: "IKEA assembly",
        yardwork: "Yardwork Services",
        dogwalking: "Dog Walking",
        other: "Other"
      };
      
      const selectedCategoryName = filterToCategoryMap[selectedFilter];
      if (selectedCategoryName) {
        // Normalize the selected category to get the categoryConfig key
        const selectedNormalizedKey = getNormalizedCategoryKey(selectedCategoryName);
        
        filtered = filtered.filter(task => {
          const taskCategory = task.category || "";
          // Normalize the task category to get the categoryConfig key
          const taskNormalizedKey = getNormalizedCategoryKey(taskCategory);
          
          // Compare the normalized keys - they should match if they're the same category
          return selectedNormalizedKey === taskNormalizedKey;
        });
      }
    }

    setFilteredTasks(filtered);
  }, [selectedFilter, searchQuery, tasks]);

  const getCategoryIcon = (category) => {
    const config = getCategoryConfig(category);
    return config.icon;
  };

  const getCategoryTranslation = (category) => {
    const config = getCategoryConfig(category);
    return t(config.translationKey);
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
    const description = task.description || t("taskerExplore.taskDescription");
    const shouldTruncate = description.length > 100;
    const displayDescription = isExpanded || !shouldTruncate ? description : `${description.substring(0, 100)}...`;

    return (
      <TouchableOpacity 
        key={taskId} 
        style={styles.taskCard}
        onPress={() => {
          if (!task || !task._id) {
            Alert.alert(t("common.errorTitle") || "Error", t("taskerExplore.taskNotFound") || "Task information is missing. Please try again.");
            return;
          }
          // On Android, serialize task object to prevent navigation crashes
          const taskToNavigate = Platform.OS === "android" 
            ? {
                _id: task._id,
                title: task.title || "",
                description: task.description || "",
                budget: task.budget || 0,
                category: task.category || "",
                status: task.status || "Pending",
                location: task.location || "",
                latitude: task.latitude || null,
                longitude: task.longitude || null,
                images: task.images || [],
                createdAt: task.createdAt || new Date().toISOString(),
                userId: task.userId || null,
              }
            : task;
          navigation.navigate("TaskerTaskDetails", { task: taskToNavigate });
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.taskTitle}>{task.title || t("taskerExplore.taskTitle")}</Text>
        
        <View style={styles.taskTags}>
          <View style={styles.tag}>
            <Ionicons 
              name={getCategoryIcon(task.category)} 
              size={16} 
              color="#215433" 
            />
            <Text 
              style={styles.tagText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {getCategoryTranslation(task.category)}
            </Text>
          </View>
          <View style={styles.budgetTag}>
            <Text 
              style={styles.budgetText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t("taskerExplore.clientBudget", { budget: task.budget || "5" })}
            </Text>
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
                {isExpanded ? t("taskerExplore.readLess") : t("taskerExplore.readMore")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.bidButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent card navigation when pressing Bid button
            try {
              if (!task || !task._id) {
                Alert.alert(t("common.errorTitle") || "Error", t("taskerExplore.taskNotFound") || "Task information is missing. Please try again.");
                return;
              }
              
              // On Android, ensure task object is properly serialized
              const taskToNavigate = Platform.OS === "android" 
                ? {
                    _id: task._id,
                    title: task.title || "",
                    description: task.description || "",
                    budget: task.budget || 0,
                    category: task.category || "",
                    status: task.status || "Pending",
                    location: task.location || "",
                    latitude: task.latitude || null,
                    longitude: task.longitude || null,
                    images: task.images || [],
                    createdAt: task.createdAt || new Date().toISOString(),
                    userId: task.userId || null,
                  }
                : task;

            if (currentUser && !currentUser.isVerified) {
              setShowVerificationPopup(true);
            } else {
                // Add small delay on Android to ensure navigation state is ready
                if (Platform.OS === "android") {
                  setTimeout(() => {
                    navigation.navigate("TaskerTaskDetails", { task: taskToNavigate });
                  }, 100);
                } else {
                  navigation.navigate("TaskerTaskDetails", { task: taskToNavigate });
                }
              }
            } catch (error) {
              console.error("Bid button navigation error:", error);
              Alert.alert(
                t("common.errorTitle") || "Error",
                t("taskerExplore.taskNotFound") || "Failed to open task details. Please try again."
              );
            }
          }}
        >
          <Text style={styles.bidButtonText}>{t("taskerExplore.bidOnTask")}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderVerificationCard = () => (
    <View style={styles.verificationCard}>
      <View style={styles.verificationContent}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons name="hourglass-outline" size={24} color="#215433" />
          <Text style={styles.verificationText}>{t("taskerExplore.pendingVerification")}</Text>
        </View>
        <Ionicons 
          name={isRTL ? "chevron-back" : "chevron-forward"} 
          size={20} 
          color="#333" 
        />
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
        {isRTL ? (
          <>
            <View style={styles.messageIconTextContainer}>
              <View style={styles.messageIconContainer}>
                <View style={styles.messageIcon}>
                  <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
                </View>
                {unreadMessages > 0 && (
                  <View style={styles.messageBadge}>
                    <Text style={styles.messageBadgeText}>{unreadMessages}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.messagesText}>
                {t("taskerExplore.unreadMessages", { count: unreadMessages })}
              </Text>
            </View>
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color="#333" 
            />
          </>
        ) : (
          <>
            <View style={styles.messageIconContainer}>
              <View style={styles.messageIcon}>
                <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
              </View>
              {unreadMessages > 0 && (
                <View style={styles.messageBadge}>
                  <Text style={styles.messageBadgeText}>{unreadMessages}</Text>
                </View>
              )}
            </View>
            <Text style={styles.messagesText}>
              {t("taskerExplore.unreadMessages", { count: unreadMessages })}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="#333" 
            />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderWaitingOnTaskCard = () => (
    <View style={styles.waitingCard}>
      <Text style={styles.waitingTitle}>{t("taskerExplore.waitingOnTask")}</Text>
      <Text style={styles.waitingDescription}>
        {t("taskerExplore.waitingDescription")}
      </Text>
      <TouchableOpacity 
        style={styles.bidSentButton}
        onPress={() => navigation.navigate("MyTasks", { targetTab: "bidSent" })}
      >
        <Text style={styles.bidSentButtonText}>{t("taskerExplore.bidSent")}</Text>
      </TouchableOpacity>
      <Text style={styles.activeDescription}>{t("taskerExplore.activeDescription")}</Text>
      <TouchableOpacity 
        style={styles.activeButton}
        onPress={() => navigation.navigate("MyTasks", { targetTab: "active" })}
      >
        <Text style={styles.activeButtonText}>{t("taskerExplore.active")}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchSection = () => (
    <View style={styles.searchSection}>
      <Text style={styles.searchTitle}>{t("taskerExplore.searchForTasks")}</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={t("taskerExplore.searchPlaceholder")}
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
        textAlign={isRTL ? "right" : "left"}
      />
      <Text style={styles.filterLabel}>{t("taskerExplore.filterBy")}</Text>
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
            <Text style={styles.clearFilterText}>{t("taskerExplore.clear")}</Text>
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
        contentContainerStyle={filteredTasks.length === 0 ? styles.emptyScrollContainer : { paddingBottom: 40 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#000000"
            colors={["#000000"]}
            progressBackgroundColor="#ffffff"
            progressViewOffset={60}
          />
        }
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
            <View style={styles.notificationIconContainer}>
              <Ionicons name="notifications-outline" size={24} color="#215433" />
              {(unreadMessages > 0 || unreadNotifications > 0) && <View style={styles.headerNotificationDot} />}
            </View>
          </TouchableOpacity>
          <View style={{ width: 24 }} />
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t("taskerExplore.greeting", { name: currentUser?.name || "Tariq" })}</Text>
            <Text style={styles.welcomeText}>{t("taskerExplore.welcomeText")}</Text>
          </View>
        </View>

        {/* Verification or Messages Card */}
        {!currentUser?.isVerified ? renderVerificationCard() : renderUnreadMessagesCard()}

        {/* Waiting on Task Card */}
        {renderWaitingOnTaskCard()}

        {/* Search Section */}
        {renderSearchSection()}

        {/* Task Cards */}
        {loading ? (
          <ActivityIndicator size="large" color="#000000" style={styles.loading} />
        ) : filteredTasks.length === 0 ? (
          <EmptyState 
            title={t("taskerExplore.noTasksAvailable")} 
            subtitle={t("taskerExplore.noTasksSubtitle")}
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
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 20 : 80,
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
    [I18nManager.isRTL ? "left" : "right"]: -2,
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  welcomeText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#666",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  verificationCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  verificationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  verificationText: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 16,
    color: "#215433",
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  messagesCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  messagesContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  messageIconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  messageIconContainer: {
    position: "relative",
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#215433",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBadge: {
    position: "absolute",
    top: -2,
    [I18nManager.isRTL ? "left" : "right"]: -2,
    backgroundColor: "#FF0000",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  messageBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "InterBold",
  },
  messagesText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  waitingCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  waitingTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#414141",
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  waitingDescription: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#414141",
    marginBottom: 16,
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  filterLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
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
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: I18nManager.isRTL ? 0 : 8,
    marginLeft: I18nManager.isRTL ? 8 : 0,
  },
  filterChipActive: {
    backgroundColor: "#215433",
    borderColor: "#215433",
  },
  filterChipText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215433",
    marginLeft: I18nManager.isRTL ? 0 : 6,
    marginRight: I18nManager.isRTL ? 6 : 0,
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
    marginLeft: I18nManager.isRTL ? 0 : 6,
    marginRight: I18nManager.isRTL ? 6 : 0,
  },
  taskCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  taskTags: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    marginBottom: 12,
    gap: 8,
    alignItems: "center",
    flexWrap: Platform.OS === "android" ? "wrap" : "nowrap",
  },
  tag: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexShrink: Platform.OS === "android" ? 1 : 0,
    maxWidth: Platform.OS === "android" ? "48%" : "100%",
    minWidth: 0,
  },
  tagText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#215433",
    marginLeft: I18nManager.isRTL ? 0 : 4,
    marginRight: I18nManager.isRTL ? 4 : 0,
    flexShrink: 1,
  },
  budgetTag: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexShrink: Platform.OS === "android" ? 1 : 0,
    maxWidth: Platform.OS === "android" ? "48%" : "100%",
    minWidth: 0,
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
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  readMoreLink: {
    color: "#0066cc",
    textDecorationLine: "underline",
    fontFamily: "Inter",
    fontSize: 14,
    marginTop: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
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