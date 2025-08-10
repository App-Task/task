import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  I18nManager,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import axios from "axios";
import { getToken } from "../../services/authStorage";
import { fetchCurrentUser } from "../../services/auth"; // ✅ make sure path is correct
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";





const JOB_TYPES = [
  "Handyman",
  "Moving",
  "IKEA assembly",
  "Cleaning",
  "Shopping & Delivery",
  "Yardwork Services",
  "Dog Walking",
  "Other"
];


const formatDateTime = (isoString, isRTL = false) => {
  const date = new Date(isoString);
  return date.toLocaleString(isRTL ? "ar-SA" : "en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};


export default function ExploreTasksScreen({ navigation, route }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobType, setJobType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);



  // Scroll animation logic
  const scrollY = useSharedValue(0);
  const showAnimation = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      if (currentY < scrollY.value) {
        showAnimation.value = true;
      } else {
        showAnimation.value = false;
      }
      scrollY.value = currentY;
    },
  });

  const animationStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showAnimation.value ? 1 : 0, { duration: 300 }),
      transform: [
        {
          translateY: withTiming(showAnimation.value ? 0 : -20, {
            duration: 300,
          }),
        },
      ],
    };
  });
  const [userId, setUserId] = useState(null);

  const fetchTasks = async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user); // ✅ Store user info
      console.log("👤 CURRENT USER:", user);
      if (!user.isVerified) {
        setShowVerifyBanner(true);
        setTasks([]);
        setFilteredTasks([]);
        setLoading(false);
        return;
      }

      if (
        !user.name || !user.gender || !user.location ||
        !user.experience || !user.skills || !user.about
      ) {
        setShowVerifyBanner("incomplete");
        setTasks([]);
        setFilteredTasks([]);
        setLoading(false);
        return;
      }
      
  
      setShowVerifyBanner(false); // ✅ Hide if verified
  
      const token = await getToken();
  
      // Get current user data
      const userRes = await axios.get("https://task-kq94.onrender.com/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentUserId = userRes.data._id;
      setUserId(currentUserId);
  
      // Get all tasks
const taskRes = await axios.get("https://task-kq94.onrender.com/api/tasks", {
  headers: { Authorization: `Bearer ${token}` },
});
const allTasks = taskRes.data;

// 🔁 Get all bids made by this tasker
const bidRes = await axios.get(`https://task-kq94.onrender.com/api/bids/tasker/${user._id}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const bidTaskIds = bidRes.data.map((bid) =>
  typeof bid.taskId === "object" ? bid.taskId._id : bid.taskId
);

// ✅ Exclude tasks already bid on
const availableTasks = allTasks.filter(
  (task) => !bidTaskIds.includes(task._id)
);

setTasks(availableTasks);
setFilteredTasks(availableTasks);

    } catch (err) {
      console.error("❌ Error fetching tasks:", err.message);
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
      return () => {}; // clean-up if needed
    }, [])
  );
  

  

  useEffect(() => {
    filterTasks();
  }, [searchQuery, jobType, tasks]);

  const filterTasks = () => {
    let result = tasks.filter(
      (task) => task.status === "Pending" && task.userId !== userId
    );
  
    if (searchQuery.trim()) {
      const text = searchQuery.toLowerCase();
      result = result.filter((task) =>
        task.title?.toLowerCase().includes(text)
      );
    }
  
    if (jobType) {
      result = result.filter((task) => task.category === jobType);
    }
  
    setFilteredTasks(result);
  };
  
  const renderTask = ({ item }) => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.card}>
  {/* ✅ Green Header */}
  <View style={styles.cardHeader}>
    <Text style={styles.cardHeaderText}>
      {t("taskerExplore.posted")}: {new Date(item.createdAt).toLocaleDateString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
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
  </View>

  {/* ✅ Card Body */}
  <View style={styles.cardBody}>
    <Text style={styles.title}>{item.title}</Text>

    {/* ✅ View Details (Underlined) */}
    <Text
      style={styles.viewDetails}
      onPress={() =>
        navigation.navigate("TaskerTaskDetails", { task: item })
      }
    >
      {t("taskerExplore.viewDetails")}
    </Text>
  </View>
</Animated.View>

  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
  <View>
    <Text style={styles.greeting}>
      {t("taskerExplore.greeting", { name: currentUser?.name || "Tasker" })}
    </Text>
    <Text style={styles.subGreeting}>{t("taskerExplore.subGreeting")}</Text>
  </View>

  <TouchableOpacity onPress={() => setShowModal(true)}>
  <Ionicons name="filter-outline" size={26} color="#213729" />
</TouchableOpacity>

</View>


{showVerifyBanner === true && (
  <View style={styles.verifyBanner}>
    <Text style={styles.verifyText}>
      {t("taskerExplore.verifyPending")}{" "}
      <Text
        style={styles.contactLink}
        onPress={() =>
          Linking.openURL("mailto:Task.team.bh@gmail.com")
        }
      >
        {t("taskerExplore.contactUs")}
      </Text>
    </Text>
  </View>
)}


{showVerifyBanner === "incomplete" && (
  <View style={styles.verifyBanner}>
    <Text style={styles.verifyText}>
      {t("taskerExplore.incompleteProfile")}
    </Text>
    <TouchableOpacity
onPress={() => navigation.navigate("EditTaskerProfile")}
style={{
        marginTop: 10,
        backgroundColor: "#213729",
        paddingVertical: 10,
        borderRadius: 20,
        paddingHorizontal: 18,
      }}
    >
      <Text style={{ color: "#fff", fontFamily: "InterBold", textAlign: "center" }}>
        {t("taskerExplore.finishProfile")}
      </Text>
    </TouchableOpacity>
  </View>
)}


<TextInput
  value={searchQuery}
  onChangeText={setSearchQuery}
  style={styles.searchInput}
  placeholder={t("taskerExplore.searchPlaceholder")}
  placeholderTextColor="#ffffff"
/>




      <Modal visible={showModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalSheet}>
            {JOB_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.optionItem}
                onPress={() => {
                  setJobType(type);
                  setShowModal(false);
                }}
              >
                <Text style={styles.optionText}>{t(`taskerExplore.jobTypes.${type.toLowerCase()}`)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.optionItem, { borderTopWidth: 1, borderColor: "#ddd" }]}
              onPress={() => {
                setJobType(null);
                setShowModal(false);
              }}
            >
              <Text style={[styles.optionText, { color: "red" }]}>{t("taskerExplore.clearFilter")}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {loading ? (
        <ActivityIndicator size="large" color="#213729" />
      ) : filteredTasks.length === 0 ? (
        <Text style={styles.empty}>{t("taskerExplore.noTasks")}</Text>
      ) : (
        <Animated.FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 10,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  label: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#213729",
    marginBottom: 6,
    marginLeft: 2,
  },
  searchInput: {
    height: 48,
    backgroundColor: "#213729", // ✅ same dark green as screenshot
    borderRadius: 30,            // ✅ fully rounded edges
    paddingHorizontal: 18,
    fontSize: 15,
    marginBottom: 20,
    fontFamily: "Inter",
    color: "#ffffff",            // ✅ white text when typing
  },
  
  filterButton: {
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  filterText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#213729",
  },
  scrollAnimation: {
    backgroundColor: "#dff0d8",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 10,
  },
  scrollAnimationText: {
    color: "#213729",
    fontFamily: "Inter",
  },
  empty: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 80,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 20,        // ✅ more space between cards
    marginHorizontal: 2,     // ✅ slight spacing from screen edges
    borderWidth: 1,
    borderColor: "#dcdcdc",
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  cardBody: {
    paddingVertical: 16,    // ✅ slightly more vertical spacing
    paddingHorizontal: 18,
  },
  
  
  cardHeader: {
    backgroundColor: "#213729", // ✅ dark green like screenshot
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cardHeaderText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 12,
  },
  
  image: {
    width: "100%",
    height: 150,
  },
  info: {
    padding: 16,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
    marginTop: 4, // ✅ slight top margin for better spacing
  },
  sub: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#213729",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "InterBold",
    color: "#ffffff",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  optionItem: {
    paddingVertical: 12,
  },
  optionText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
  },

  verifyBanner: {
    backgroundColor: "#fff4e6",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  verifyText: {
    color: "#FFA500",
    fontFamily: "InterBold",
    fontSize: 14,
    textAlign: "center",
  },
  imageWrapper: {
    width: "100%",
    height: 150,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  placeholderText: {
    color: "#888",
    fontFamily: "Inter",
    fontSize: 14,
  },
  viewDetails: {
    color: "#213729",
    fontFamily: "InterBold",
    fontSize: 13,
    textDecorationLine: "underline", // ✅ underlined
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: {
    fontFamily: "InterBold",
    fontSize: 26,
    color: "#213729",
    marginTop: 30,
  },
  subGreeting: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#666",
  },
  filterIcon: {
    fontSize: 22,
    color: "#213729",
  },
  contactLink: {
    color: "blue",
    textDecorationLine: "underline",
  },
  
  
  
});