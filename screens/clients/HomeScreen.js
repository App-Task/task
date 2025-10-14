import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  Alert,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
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
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hi {userName || "Tariq"},</Text>
          <Text style={styles.subtitle}>Welcome to TASK!</Text>
        </View>
        
        {/* Notifications Icon */}
        <TouchableOpacity 
          style={styles.notificationIcon}
          onPress={() => navigation.navigate("Notifications")}
        >
          <View style={styles.notificationIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {(unreadMessages > 0 || unreadNotifications > 0) && <View style={styles.headerNotificationDot} />}
          </View>
        </TouchableOpacity>
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
              {unreadMessages > 0 ? `${unreadMessages} unread messages` : "0 unread messages"}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#333" />
          </View>
        </TouchableOpacity>

        {/* Need something done? Section */}
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Need something done?</Text>
          <Text style={styles.cardDescription}>
            Have something on your to-do list? Post a task and let Taskers handle it reliably with competitive offers
          </Text>
          <TouchableOpacity 
            style={styles.postTaskButton}
            onPress={() => navigation.navigate("ClientHome", { screen: "Post" })}
          >
            <Text style={styles.postTaskButtonText}>Post a Task</Text>
          </TouchableOpacity>
        </View>

        {/* Waiting on a Task? Section */}
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Waiting on a Task?</Text>
          <Text style={styles.cardDescription}>
            Waiting for Taskers to bid on your tasks? Check Pending tasks for updates
          </Text>
          <TouchableOpacity 
            style={styles.pendingButton}
            onPress={() => navigateToTasksTab("Pending")}
          >
            <Text style={styles.pendingButtonText}>Pending Tasks</Text>
          </TouchableOpacity>
          
          <Text style={styles.cardDescription}>
            Tasks underway? Tap to check their progress
          </Text>
          <TouchableOpacity 
            style={styles.progressButton}
            onPress={() => navigateToTasksTab("Started")}
          >
            <Text style={styles.progressButtonText}>In Progress Tasks</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontFamily: "InterBold",
    color: "#215433",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
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
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4444",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  messagesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#215433",
    marginBottom: 20,
    padding: 16,
  },
  messagesContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageIconContainer: {
    position: "relative",
    marginRight: 12,
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
    right: -2,
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
  },
  actionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
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
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
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