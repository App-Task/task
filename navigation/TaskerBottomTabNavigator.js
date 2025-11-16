import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../services/authStorage";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

// Tasker Screens
import ExploreTasksScreen from "../screens/tasker/ExploreTasksScreen";
import TaskerMyTasksScreen from "../screens/tasker/MyTasksScreen";
import TaskerMessagesScreen from "../screens/tasker/MessagesScreen";
import TaskerNotificationsScreen from "../screens/tasker/NotificationsScreen";
import TaskerProfileScreen from "../screens/tasker/ProfileScreen";
import EditProfileScreen from "../screens/tasker/EditProfileScreen";


const Tab = createBottomTabNavigator();



export default function TaskBottomNav() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0); // ✅ ADD THIS BACK
  const insets = useSafeAreaInsets();
  
  


  const { t } = useTranslation();

  const fetchUnreadMessages = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("https://task-kq94.onrender.com/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const totalUnread = res.data.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error("❌ Tasker unread fetch error:", err.message);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("https://task-kq94.onrender.com/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const unread = res.data.filter((n) => !n.isRead).length;
      setUnreadNotifications(unread);
    } catch (err) {
      console.error("❌ Failed to fetch notifications:", err.message);
    }
  };
  
  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadMessages();
      fetchUnreadNotifications(); // ✅ recheck when switching tabs
    }, [])
  );
  

useEffect(() => {
  fetchUnreadNotifications(); // ✅ runs once immediately on login
}, []);

  // Calculate bottom padding for Android to account for system navigation bar
  const bottomPadding = Platform.OS === "android" 
    ? Math.max(insets.bottom, 10) 
    : 10;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#c1ff72",
        tabBarInactiveTintColor: "#213729",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#eee",
          height: Platform.OS === "android" ? 70 + insets.bottom : 70,
          paddingBottom: bottomPadding,
          paddingTop: 5,
        },
        tabBarIcon: ({ color }) => {
          let icon;
          switch (route.name) {
            case "Explore":
              icon = "search-outline";
              break;
            case "MyTasks":
              icon = "clipboard-outline";
              break;
            case "Messages":
              icon = "chatbubble-ellipses-outline";
              break;
            case "Notifications":
              icon = "notifications-outline";
              break;
            case "Profile":
              icon = "person-outline";
              break;
          }
          return <Ionicons name={icon} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreTasksScreen}
        options={{ tabBarLabel: t("TaskBottomNav.explore") }}
      />
      <Tab.Screen
        name="MyTasks"
        component={TaskerMyTasksScreen}
        options={{ tabBarLabel: t("TaskBottomNav.myTasks") }}
      />
     


     <Tab.Screen
  name="Notifications"
  children={() => (
    <TaskerNotificationsScreen
      setUnreadNotifications={setUnreadNotifications} // ✅ pass setter
    />
  )}
  options={{
    tabBarLabel: t("TaskBottomNav.notifications"),
    tabBarBadge: unreadNotifications > 0 ? (unreadNotifications > 9 ? "9+" : unreadNotifications) : null,
    tabBarBadgeStyle: {
      backgroundColor: "#213729",
      color: "#fff",
      fontSize: 11,
      fontFamily: "InterBold",
    },
  }}
/>




<Tab.Screen
  name="Messages"
  component={TaskerMessagesScreen}
  options={{
    tabBarLabel: t("TaskBottomNav.messages"),
    tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : unreadCount) : null,
    tabBarBadgeStyle: {
      backgroundColor: "#213729",
      color: "#fff",
      fontSize: 11,
      fontFamily: "InterBold",
    },
  }}
/>


      <Tab.Screen
        name="Profile"
        component={TaskerProfileScreen}
        options={{ tabBarLabel: t("TaskBottomNav.profile") }}
      />
    </Tab.Navigator>
  );
}
