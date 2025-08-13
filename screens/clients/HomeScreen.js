import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  I18nManager,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInRight } from "react-native-reanimated";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import useUnreadNotifications from "../../hooks/useUnreadNotifications";
export default function ClientHomeScreen() {
  const navigation = useNavigation(); // ✅ correctly grabs parent stack navigation
  const { t } = useTranslation();
  const unreadCount = useUnreadNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [userName, setUserName] = useState("");

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const userId = await SecureStore.getItemAsync("userId");
      const userName = await SecureStore.getItemAsync("userName");

      if (!userId) {
        throw new Error("User not logged in");
      }

      setUserName(userName || "");

      const res = await fetch(`https://task-kq94.onrender.com/api/tasks/user/${userId}`);
      const data = await res.json();

      setTasks(data);
    } catch (err) {
      console.error("❌ Failed to fetch tasks:", err.message);
      Alert.alert(t("clientHome.errorTitle"), t("clientHome.loadTasksError"));
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );
  

  const handleRefresh = () => {
    loadData(true);
  };
  const renderTask = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("TaskDetails", { task: item })}
    >
      <Animated.View entering={FadeInRight.duration(500)} style={styles.taskItem}>
        {/* ✅ TOP ROW: Date above Status Badge */}
        <View style={styles.taskTopRow}>
          <View style={styles.badgeAndDate}>
            <View style={styles.taskDateWrapper}>
              <Text style={styles.taskDate}>
                {new Date(item.createdAt).toLocaleDateString(
                  I18nManager.isRTL ? "ar-SA" : "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}{" "}
                •{" "}
                {new Date(item.createdAt).toLocaleTimeString(
                  I18nManager.isRTL ? "ar-SA" : "en-GB",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </Text>
            </View>

            <View
              style={[
                styles.taskStatusBadge,
                {
                  backgroundColor:
                    item.status === "Pending"
                      ? "#FFA500"
                      : item.status === "Started"
                      ? "#FFD700"
                      : item.status === "Completed"
                      ? "#38cb82"
                      : "#FF0000",
                },
              ]}
            >
              <Text style={styles.taskStatusText}>
                {t(`clientHome.status.${item.status.toLowerCase()}`)}
              </Text>
            </View>
          </View>
        </View>
  
        {/* ✅ Divider Line Above Title */}
        <View style={styles.taskDivider} />

        {/* ✅ TASK TITLE */}
        <Text style={styles.taskTitle}>{item.title}</Text>

  
        {/* ✅ VIEW DETAILS LINK */}
        <Text style={styles.viewDetails}>{t("clientHome.viewDetails")}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
  
  

  return (
    <View style={{ flex: 1 }}>
      {/* 🔔 Notifications button */}
      <View style={styles.notificationsIcon}>
  <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
    <Ionicons name="notifications-outline" size={24} color="#213729" />
    {unreadCount > 0 && (
      <View style={styles.notificationDot}>

        <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
</View>

  
      <View style={styles.container}>
      <Text style={styles.hello}>
        {t("clientHome.greeting", { name: userName || t("clientHome.defaultName") })}
      </Text>
      <Text style={styles.sub}>{t("clientHome.subtitle")}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ClientHome", { screen: "Post" })}
      >
        <Text style={styles.buttonText}>+ {t("clientHome.postTaskBtn")}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t("clientHome.yourTasks")}</Text>

      {loading ? (
        <ActivityIndicator color="#213729" size="large" />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t("clientHome.noTasks")}</Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          style={{ width: "100%" }}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </View>
  </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 120,
    paddingHorizontal: 24,
  },
  hello: {
    fontSize: 32,
    fontFamily: "InterBold",
    color: "#3B5C48",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  sub: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Inter",
    marginTop: 6,
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  button: {
    backgroundColor: "#2E4A3A",
    paddingVertical: 14,
    borderRadius: 50, // full pill
    alignItems: "center",
    marginBottom: 30,
  },
  
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#213729",
    marginBottom: 10,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  taskItem: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdcdc", // lighter gray border
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1, // Android light shadow
    alignItems: "flex-start",
  },
  
  
  taskTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeAndDate: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskDate: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Inter",
    textAlign: "left",
    alignSelf: "flex-start",
  },
  taskDateWrapper: {
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
  },
  
  taskStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  taskStatusText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 12,
  },
  viewDetails: {
    color: "#213729", // ✅ same as title color
    fontSize: 13,
    fontFamily: "Inter",
    marginTop: 4,
    textDecorationLine: "underline", // ✅ underlined
    alignSelf: "flex-start",
    textAlign: "left",
  },
  taskDivider: {
    height: 2,
    backgroundColor: "#e0e0e0", // ✅ light gray line
    marginVertical: 6,
  },
  
  
  
  taskTitle: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
    textAlign: "left",
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "InterBold",
  },
  emptyText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
  notificationsIcon: {
    position: "absolute",
    top: 65, // ⬅️ Increased from 30 to 65
    right: 24,
    zIndex: 10,
  },

  notificationDot: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#c00",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  taskTextWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  
  taskBadgeWrapper: {
    justifyContent: "center",
    alignItems: "flex-end",
    width: 100,
  },
  
  taskStatusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  
  
  
});
