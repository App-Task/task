import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  I18nManager,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
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
import { fetchCurrentUser } from "../../services/auth";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
import * as Location from "expo-location"; // ✅ NEW (import)

// --------------------------
const JOB_TYPES = [
  "Handyman",
  "Moving",
  "IKEA assembly",
  "Cleaning",
  "Shopping & Delivery",
  "Yardwork Services",
  "Dog Walking",
  "Other",
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

// ✅ NEW (helpers: haversine & safe task coords)
const toRad = (v) => (v * Math.PI) / 180;
const haversineKm = (a, b) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Tries multiple shapes: task.latitude/longitude, task.location.{latitude,longitude}, task.location.coords.{latitude,longitude}
const getTaskCoords = (task) => {
  const c1 =
    typeof task.latitude === "number" && typeof task.longitude === "number"
      ? { lat: task.latitude, lon: task.longitude }
      : null;

  const loc = task.location;
  const c2 =
    loc &&
    typeof loc.latitude === "number" &&
    typeof loc.longitude === "number"
      ? { lat: loc.latitude, lon: loc.longitude }
      : null;

  const coords = loc?.coords;
  const c3 =
    coords &&
    typeof coords.latitude === "number" &&
    typeof coords.longitude === "number"
      ? { lat: coords.latitude, lon: coords.longitude }
      : null;

  return c1 || c2 || c3 || null;
};

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
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
// ✅ NEW (sorting state + device coords)
const [sortMode, setSortMode] = useState("none");
const [userCoords, setUserCoords] = useState(null);
const [locLoading, setLocLoading] = useState(false);


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

  const fetchTasks = async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
      if (!user.isVerified) {
        setShowVerifyBanner(true);
        setTasks([]);
        setFilteredTasks([]);
        setLoading(false);
        return;
      }

      if (
        !user.name ||
        !user.gender ||
        !user.location ||
        !user.experience ||
        !user.skills ||
        !user.about
      ) {
        setShowVerifyBanner("incomplete");
        setTasks([]);
        setFilteredTasks([]);
        setLoading(false);
        return;
      }

      setShowVerifyBanner(false);

      const token = await getToken();

      // Get current user data
      const userRes = await axios.get(
        "https://task-kq94.onrender.com/api/auth/me",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const currentUserId = userRes.data._id;
      setUserId(currentUserId);

      // Get all tasks
      const taskRes = await axios.get(
        "https://task-kq94.onrender.com/api/tasks",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const allTasks = taskRes.data;

      // Get all bids made by this tasker
      const bidRes = await axios.get(
        `https://task-kq94.onrender.com/api/bids/tasker/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const bidTaskIds = bidRes.data.map((bid) =>
        typeof bid.taskId === "object" ? bid.taskId._id : bid.taskId
      );

      // Exclude tasks already bid on
      const availableTasks = allTasks.filter(
        (task) => !bidTaskIds.includes(task._id)
      );

      // ✅ NEW (precompute hasCoords to speed later filtering)
      const enriched = availableTasks.map((t) => ({
        ...t,
        __coords: getTaskCoords(t), // null or {lat,lon}
      }));

      setTasks(enriched);
      setFilteredTasks(enriched);
    } catch (err) {
      console.error("❌ Error fetching tasks:", err?.message);
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
      return () => {};
    }, [])
  );

  useEffect(() => {
    filterTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, jobType, tasks, sortMode, userCoords]);

  // ✅ NEW (ask for location only when user enables "nearest")
  const ensureLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("common.permissionRequired") || "Permission required",
          t("common.locationExplain") ||
            "We need your location to sort tasks by nearest."
        );
        setSortMode("none");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserCoords({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
    } catch (e) {
      console.log("Location error:", e);
      Alert.alert(
        t("common.locationError") || "Location error",
        t("common.locationTryAgain") ||
          "Could not get your location. Try again later."
      );
      setSortMode("none");
    } finally {
      setLocLoading(false);
    }
  };

  const filterTasks = () => {
    let result = tasks.filter(
      (task) => task.status === "Pending" && task.userId !== userId
    );

    if (searchQuery.trim()) {
      const text = searchQuery.toLowerCase();
      result = result.filter((task) => task.title?.toLowerCase().includes(text));
    }

    if (jobType) {
      result = result.filter((task) => task.category === jobType);
    }

    // ✅ NEW (compute & sort by nearest if enabled and coords exist)
    if (sortMode === "nearest" && userCoords) {
      result = result
        .map((task) => {
          const c = task.__coords || getTaskCoords(task);
          if (!c) return { ...task, __distanceKm: null };
          const d = haversineKm(userCoords, c);
          return { ...task, __distanceKm: d };
        })
        .sort((a, b) => {
          // Tasks with distance first, sorted ascending; then those without coords
          const da = a.__distanceKm;
          const db = b.__distanceKm;
          if (da == null && db == null) return 0;
          if (da == null) return 1;
          if (db == null) return -1;
          return da - db;
        });
    } else {
      // remove any stale distance when not sorting by nearest
      result = result.map((t) => ({ ...t, __distanceKm: undefined }));
    }

    setFilteredTasks(result);
  };

  const renderTask = ({ item }) => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderText}>
          {t("taskerExplore.posted")}:
          {" " +
            new Date(item.createdAt).toLocaleDateString(
              I18nManager.isRTL ? "ar-SA" : "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )}
          {" • " +
            new Date(item.createdAt).toLocaleTimeString(
              I18nManager.isRTL ? "ar-SA" : "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
        </Text>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.title}>{item.title}</Text>

        {/* ✅ NEW (distance pill if available) */}
        {typeof item.__distanceKm === "number" && (
          <View style={styles.distancePill}>
            <Ionicons name="location-outline" size={14} color="#213729" />
            <Text style={styles.distanceText}>
              {item.__distanceKm.toFixed(1)} km
            </Text>
          </View>
        )}

        <Text
          style={styles.viewDetails}
          onPress={() => navigation.navigate("TaskerTaskDetails", { task: item })}
        >
          {t("taskerExplore.viewDetails")}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTexts}>
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
              onPress={() => Linking.openURL("mailto:Task.team.bh@gmail.com")}
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
            <Text
              style={{
                color: "#fff",
                fontFamily: "InterBold",
                textAlign: "center",
              }}
            >
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

      {/* ✅ NEW (tiny chips to show active filters/sort) */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {jobType && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{jobType}</Text>
          </View>
        )}
        {sortMode === "nearest" && (
          <View style={[styles.chip, { backgroundColor: "#e8f4ec", borderColor: "#c9e5d3" }]}>
            <Ionicons name="navigate-outline" size={14} color="#213729" />
            <Text style={[styles.chipText, { marginLeft: 4 }]}>
              {locLoading ? (t("common.loading") || "Loading…") : (t("taskerExplore.nearest") || "Nearest")}
            </Text>
          </View>
        )}
      </View>

      {/* Filter / Sort Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <View style={styles.modalSheet}>
            {/* Job Type */}
            {JOB_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.optionItem}
                onPress={() => {
                  setJobType(type);
                  setShowModal(false);
                }}
              >
                <Text style={styles.optionText}>
                  {t(`taskerExplore.jobTypes.${type.toLowerCase()}`) || type}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 10 }} />

            {/* ✅ NEW (Sort by nearest toggle) */}
            <TouchableOpacity
              style={[styles.optionItem, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
              onPress={async () => {
                if (sortMode === "nearest") {
                  setSortMode("none");
                  setShowModal(false);
                  return;
                }
                setSortMode("nearest");
                setShowModal(false);
                if (!userCoords) await ensureLocation();
              }}
            >
              <Text style={[styles.optionText, { fontFamily: "InterBold" }]}>
                {t("taskerExplore.sortNearest") || "Sort by nearest"}
              </Text>
              <Ionicons
                name={sortMode === "nearest" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color="#213729"
              />
            </TouchableOpacity>

            {/* Clear filters */}
            <TouchableOpacity
              style={[styles.optionItem, { borderTopWidth: 1, borderColor: "#ddd" }]}
              onPress={() => {
                setJobType(null);
                setSortMode("none"); // ✅ NEW
                setShowModal(false);
              }}
            >
              <Text style={[styles.optionText, { color: "red" }]}>
                {t("taskerExplore.clearFilter")}
              </Text>
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
  searchInput: {
    height: 48,
    backgroundColor: "#213729",
    borderRadius: 30,
    paddingHorizontal: 18,
    fontSize: 15,
    marginBottom: 12, // a bit tighter to fit chips
    fontFamily: "Inter",
    color: "#ffffff",
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
    marginBottom: 20,
    marginHorizontal: 2,
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
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  cardHeader: {
    backgroundColor: "#213729",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cardHeaderText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 12,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
    marginTop: 4,
  },
  viewDetails: {
    color: "#213729",
    fontFamily: "InterBold",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  headerRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTexts: {
    flex: 1,
    alignItems: I18nManager.isRTL ? "flex-end" : "flex-start",
  },
  greeting: {
    fontFamily: "InterBold",
    fontSize: 26,
    color: "#213729",
    marginTop: 30,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  subGreeting: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#666",
    textAlign: I18nManager.isRTL ? "right" : "left",
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
  contactLink: {
    color: "blue",
    textDecorationLine: "underline",
  },
  // ✅ NEW (distance pill + chips)
  distancePill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#dfe7e1",
    backgroundColor: "#f4f8f5",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  distanceText: {
    color: "#213729",
    fontFamily: "Inter",
    fontSize: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#e3e3e3",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#fafafa",
    flexDirection: "row",
    alignItems: "center",
  },
  chipText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#213729",
  },
});
