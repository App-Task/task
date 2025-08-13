import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { getToken } from "../services/authStorage";
import { useFocusEffect } from "@react-navigation/native";


import ClientHomeScreen from "../screens/clients/HomeScreen";
import { useTranslation } from "react-i18next";
import PostTaskScreen from "../screens/clients/PostTaskScreen";
import ProfileScreen from "../screens/clients/ProfileScreen";
import MyTasksScreen from "../screens/clients/MyTasksScreen";
import MessagesScreen from "../screens/clients/MessagesScreen";
import NotificationsScreen from "../screens/clients/NotificationsScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadMessages = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("https://task-kq94.onrender.com/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const totalUnread = res.data.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error("❌ Failed to fetch unread messages", err.message);
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
            case "Home":
              icon = "home-outline";
              break;
            case "Post":
              icon = "add-circle-outline";
              break;
            case "Tasks":
              icon = "clipboard-outline";
              break;
            case "Messages":
              icon = "chatbubble-outline";
              break;
            case "Notifications":
              icon = "notifications-outline";
              break;
            case "Profile":
              icon = "person-outline";
              break;
            default:
              icon = "ellipse-outline";
          }

          return <Ionicons name={icon} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={ClientHomeScreen} options={{ title: t("TaskBottomNav.explore") }} />
      <Tab.Screen name="Tasks" component={MyTasksScreen} options={{ title: t("TaskBottomNav.myTasks") }} />
      <Tab.Screen name="Post" component={PostTaskScreen} options={{ title: t("clientHome.postTaskBtn") }} />
      <Tab.Screen
  name="Messages"
  component={MessagesScreen}
  options={{
    title: t("TaskBottomNav.messages"),
    tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : unreadCount) : null,
    tabBarBadgeStyle: {
      backgroundColor: "#213729",
      color: "#fff",
      fontSize: 11,
      fontFamily: "InterBold",
    },
  }}
/>






      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t("TaskBottomNav.profile") }} />
    </Tab.Navigator>
  );
}
