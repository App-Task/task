import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import useUnreadNotifications from "../../hooks/useUnreadNotifications";
import axios from "axios";
import { getToken } from "../../services/authStorage";

export default function ClientHomeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const unreadCount = useUnreadNotifications();
  const [userName, setUserName] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Function to navigate to Tasks tab with specific targetTab
  const navigateToTasksTab = (targetTab) => {
    navigation.navigate("Tasks", { targetTab, refreshTasks: true });
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

  const loadUserData = async () => {
    try {
      const userName = await SecureStore.getItemAsync("userName");
      setUserName(userName || "");
      
      // For now, set a mock unread message count
      // In a real app, you'd fetch this from your messages API
      setUnreadMessages(unreadCount || 0);
      
      // Fetch unread notifications
      await fetchUnreadNotifications();
    } catch (err) {
      console.error("❌ Failed to load user data:", err.message);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {I18nManager.isRTL ? (
          <>
            {/* Notifications Icon - Left side in RTL */}
            <TouchableOpacity 
              style={styles.notificationIcon}
              onPress={() => navigation.navigate("Notifications")}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons name="notifications-outline" size={24} color="#000" />
                {(unreadMessages > 0 || unreadNotifications > 0) && <View style={styles.headerNotificationDot} />}
              </View>
            </TouchableOpacity>
            
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{t("clientHome.greeting", { name: userName || t("clientHome.defaultName") })}</Text>
              <Text style={styles.subtitle}>{t("clientHome.subtitle")}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{t("clientHome.greeting", { name: userName || t("clientHome.defaultName") })}</Text>
              <Text style={styles.subtitle}>{t("clientHome.subtitle")}</Text>
            </View>
            
            {/* Notifications Icon - Right side in LTR */}
            <TouchableOpacity 
              style={styles.notificationIcon}
              onPress={() => navigation.navigate("Notifications")}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons name="notifications-outline" size={24} color="#000" />
                {(unreadMessages > 0 || unreadNotifications > 0) && <View style={styles.headerNotificationDot} />}
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Messages Section */}
        <TouchableOpacity 
          style={styles.messagesCard}
          onPress={() => navigation.navigate("Messages")}
        >
          <View style={styles.messagesContent}>
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
              {t("clientHome.messages", { count: unreadMessages })}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="#333" 
            />
          </View>
        </TouchableOpacity>

        {/* Need something done? Section */}
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>{t("clientHome.needSomethingDone")}</Text>
          <Text style={styles.cardDescription}>
            {t("clientHome.needSomethingDoneDesc")}
          </Text>
          <TouchableOpacity 
            style={styles.postTaskButton}
            onPress={() => navigation.navigate("ClientHome", { screen: "Post" })}
          >
            <Text style={styles.postTaskButtonText}>{t("clientHome.postTaskBtn")}</Text>
          </TouchableOpacity>
        </View>

        {/* Waiting on a Task? Section */}
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>{t("clientHome.waitingOnTask")}</Text>
          <Text style={styles.cardDescription}>
            {t("clientHome.waitingOnTaskDesc")}
          </Text>
          <TouchableOpacity 
            style={styles.pendingButton}
            onPress={() => navigateToTasksTab("Pending")}
          >
            <Text style={styles.pendingButtonText}>{t("clientHome.pendingTasks")}</Text>
          </TouchableOpacity>
          
          <Text style={styles.cardDescription}>
            {t("clientHome.tasksUnderway")}
          </Text>
          <TouchableOpacity 
            style={styles.progressButton}
            onPress={() => navigateToTasksTab("Started")}
          >
            <Text style={styles.progressButtonText}>{t("clientHome.inProgressTasks")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
  },
  header: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 20 : 80,
    paddingHorizontal: 24,
    paddingBottom: 20,
    marginHorizontal: 0,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontFamily: "InterBold",
    color: "#215433",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  notificationIcon: {
    padding: 8,
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
  content: {
    flex: 1,
  },
  messagesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 16,
  },
  messagesContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    direction: "ltr",
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
  actionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "InterBold",
    color: "#333",
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  postTaskButton: {
    backgroundColor: "#215433",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  postTaskButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "InterBold",
  },
  pendingButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#215433",
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  pendingButtonText: {
    color: "#215433",
    fontSize: 16,
    fontFamily: "InterBold",
  },
  progressButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#215433",
    paddingVertical: 12,
    alignItems: "center",
  },
  progressButtonText: {
    color: "#215433",
    fontSize: 16,
    fontFamily: "InterBold",
  },
});