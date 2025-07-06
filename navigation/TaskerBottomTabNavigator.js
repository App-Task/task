import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../services/authStorage";
import { useFocusEffect } from "@react-navigation/native";

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

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadMessages();
    }, [])
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#c1ff72",
        tabBarInactiveTintColor: "#213729",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#eee",
          height: 70,
          paddingBottom: 10,
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
        name="Notifications"
        component={TaskerNotificationsScreen}
        options={{ tabBarLabel: t("TaskBottomNav.notifications") }}
      />
      <Tab.Screen
        name="Profile"
        component={TaskerProfileScreen}
        options={{ tabBarLabel: t("TaskBottomNav.profile") }}
      />
    </Tab.Navigator>
  );
}
