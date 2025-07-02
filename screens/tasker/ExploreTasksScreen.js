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

const JOB_TYPES = ["Cleaning", "Moving", "Delivery", "Repairs"];

export default function ExploreTasksScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobType, setJobType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);


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
      console.log("👤 CURRENT USER:", user);
      if (!user.isVerified) {
        setShowVerifyBanner(true);
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
      const res = await axios.get("https://task-kq94.onrender.com/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
      setFilteredTasks(res.data);
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
      {item.images?.length > 0 && (
        <Image source={{ uri: item.images[0] }} style={styles.image} />
      )}
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.sub}>
          {t("taskerExplore.location")}: {item.location}
        </Text>
        <Text style={styles.sub}>
          {t("taskerExplore.price")}: {item.budget} SAR
        </Text>
        <Text style={styles.sub}>{t("taskerExplore.bids")}: 0</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate("TaskerTaskDetails", { task: item })
          }
        >
          <Text style={styles.buttonText}>{t("taskerExplore.viewDetails")}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("taskerExplore.header")}</Text>

      {showVerifyBanner && (
  <View style={styles.verifyBanner}>
    <Text style={styles.verifyText}>
      You must be verified to explore and bid on tasks.
    </Text>
  </View>
)}


      <Text style={styles.label}>Search by job title</Text>
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.filterText}>
          {jobType ? `Filter: ${jobType}` : "Filter by job type"}
        </Text>
      </TouchableOpacity>



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
                <Text style={styles.optionText}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.optionItem, { borderTopWidth: 1, borderColor: "#ddd" }]}
              onPress={() => {
                setJobType(null);
                setShowModal(false);
              }}
            >
              <Text style={[styles.optionText, { color: "red" }]}>Clear Filter</Text>
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
    height: 44,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 10,
    fontFamily: "Inter",
    color: "#213729",
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
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 2,
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
    fontSize: 18,
    color: "#213729",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
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
  
});
