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

  // Helper function to get category translation
  const getCategoryLabel = (categoryKey) => {
    const categoryMap = {
      "nearest": "nearestToYou",
      "cleaning": "cleaning",
      "shopping": "shopping",
      "handyman": "handyman",
      "moving": "moving",
      "ikea": "furniture",
      "yardwork": "yardwork",
      "dogwalking": "dogWalking",
      "other": "other",
    };
    
    const translationKeys = {
      "nearestToYou": t("taskerExplore.nearestToYou"),
      "cleaning": t("clientPostTask.categories.cleaning"),
      "shopping": t("clientPostTask.categories.shopping"),
      "handyman": t("clientPostTask.categories.handyman"),
      "moving": t("clientPostTask.categories.moving"),
      "furniture": t("clientPostTask.categories.furniture"),
      "yardwork": t("clientPostTask.categories.yardwork"),
      "dogWalking": t("clientPostTask.categories.dogWalking"),
      "other": t("clientPostTask.categories.other"),
    };
    
    const key = categoryMap[categoryKey];
    let translated = translationKeys[key];
    
    // Check if translation failed and returned the key
    const expectedKey = categoryKey === "nearest" ? "taskerExplore.nearestToYou" : `clientPostTask.categories.${key}`;
    if (translated === expectedKey) {
      // Fallback to hardcoded values
      const fallbackMap = {
        "furniture": i18n.language === "ar" ? "تركيب الأثاث" : "Furniture Assembly",
        "shopping": i18n.language === "ar" ? "التسوق والتوصيل" : "Shopping & Delivery",
        "yardwork": i18n.language === "ar" ? "أعمال الحديقة" : "Yardwork Services",
        "dogWalking": i18n.language === "ar" ? "تمشية الكلاب" : "Dog Walking",
      };
      return fallbackMap[key] || translated;
    }
    
    return translated;
  };

  const filterOptions = [
    { id: "nearest", label: getCategoryLabel("nearest"), icon: "location-outline" },
    { id: "cleaning", label: getCategoryLabel("cleaning"), icon: "water-outline" },
    { id: "shopping", label: getCategoryLabel("shopping"), icon: "bag-outline" },
    { id: "handyman", label: getCategoryLabel("handyman"), icon: "hammer-outline" },
    { id: "moving", label: getCategoryLabel("moving"), icon: "car-outline" },
    { id: "ikea", label: getCategoryLabel("ikea"), icon: "build-outline" },
    { id: "yardwork", label: getCategoryLabel("yardwork"), icon: "leaf-outline" },
    { id: "dogwalking", label: getCategoryLabel("dogwalking"), icon: "walk-outline" },
    { id: "other", label: getCategoryLabel("other"), icon: "ellipsis-horizontal-outline" },
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

  const getCategoryTranslation = (category) => {
    if (!category) return t("clientPostTask.categories.other");
    
    const categoryLower = category.toLowerCase();
    
    // Map database categories to translation keys
    const categoryMap = {
      "cleaning": "cleaning",
      "shopping & delivery": "shopping",
      "handyman": "handyman",
      "moving": "moving",
      "ikea assembly": "furniture",
      "yardwork services": "yardwork",
      "dog walking": "dogWalking",
      "other": "other"
    };
    
    const categoryKey = categoryMap[categoryLower];
    if (categoryKey) {
      const translationKey = `clientPostTask.categories.${categoryKey}`;
      const translated = t(translationKey);
      
      // If translation returns the key itself, it means the key wasn't found
      if (translated === translationKey) {
        console.warn(`Translation key not found: ${translationKey}`);
        // Fallback to direct lookup in translation object
        return categoryKey === "furniture" ? (i18n.language === "ar" ? "تركيب الأثاث" : "Furniture Assembly") :
               categoryKey === "shopping" ? (i18n.language === "ar" ? "التسوق والتوصيل" : "Shopping & Delivery") :
               category;
      }
      
      return translated;
    }
    return category;
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
        onPress={() => navigation.navigate("TaskerTaskDetails", { task })}
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
            <Text style={styles.tagText}>{getCategoryTranslation(task.category)}</Text>
          </View>
          <View style={styles.budgetTag}>
            <Text style={styles.budgetText}>{t("taskerExplore.clientBudget", { budget: task.budget || "5" })}</Text>
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
            if (currentUser && !currentUser.isVerified) {
              setShowVerificationPopup(true);
            } else {
              navigation.navigate("TaskerTaskDetails", { task });
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
        <Ionicons name="hourglass-outline" size={24} color="#215433" />
        <Text style={styles.verificationText}>{t("taskerExplore.pendingVerification")}</Text>
        <Ionicons 
          name={I18nManager.isRTL ? "chevron-back-outline" : "chevron-forward-outline"} 
          size={20} 
          color="#215433" 
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
        <View style={styles.chatIconContainer}>
          <Ionicons name="chatbubble-outline" size={24} color="#215433" />
          {unreadMessages > 0 && <View style={styles.notificationDot} />}
        </View>
        <Text style={styles.messagesText}>{t("taskerExplore.unreadMessages", { count: unreadMessages })}</Text>
        <Ionicons 
          name={I18nManager.isRTL ? "chevron-back-outline" : "chevron-forward-outline"} 
          size={20} 
          color="#215433" 
        />
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
        textAlign={I18nManager.isRTL ? "right" : "left"}
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
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t("taskerExplore.greeting", { name: currentUser?.name || "Tariq" })}</Text>
            <Text style={styles.welcomeText}>{t("taskerExplore.welcomeText")}</Text>
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
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  verificationContent: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    padding: 16,
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
  },
  messagesContent: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
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
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
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
  },
  tag: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
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
    marginLeft: I18nManager.isRTL ? 0 : 4,
    marginRight: I18nManager.isRTL ? 4 : 0,
  },
  budgetTag: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
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