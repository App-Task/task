import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

// Placeholder screens
import ExploreTasksScreen from "../screens/tasker/ExploreTasksScreen";
import TaskerMyTasksScreen from "../screens/tasker/MyTasksScreen";
import TaskerMessagesScreen from "../screens/tasker/MessagesScreen";
import TaskerNotificationsScreen from "../screens/tasker/NotificationsScreen";
import TaskerProfileScreen from "../screens/tasker/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function TaskerBottomTabNavigator() {
  const { t } = useTranslation();

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
        tabBarIcon: ({ color, size }) => {
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
        options={{ tabBarLabel: t("tabs.explore") }}
      />
      <Tab.Screen
        name="MyTasks"
        component={TaskerMyTasksScreen}
        options={{ tabBarLabel: t("tabs.myTasks") }}
      />
      <Tab.Screen
        name="Messages"
        component={TaskerMessagesScreen}
        options={{ tabBarLabel: t("tabs.messages") }}
      />
      <Tab.Screen
        name="Notifications"
        component={TaskerNotificationsScreen}
        options={{ tabBarLabel: t("tabs.notifications") }}
      />
      <Tab.Screen
        name="Profile"
        component={TaskerProfileScreen}
        options={{ tabBarLabel: t("tabs.profile") }}
      />
    </Tab.Navigator>
  );
}
