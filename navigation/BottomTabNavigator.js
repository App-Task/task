import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import ClientHomeScreen from "../screens/clients/HomeScreen";
import PostTaskScreen from "../screens/clients/PostTaskScreen";
import ProfileScreen from "../screens/clients/ProfileScreen";
import MyTasksScreen from "../screens/clients/MyTasksScreen";
import MessagesScreen from "../screens/clients/MessagesScreen";
import NotificationsScreen from "../screens/clients/NotificationsScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
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
      <Tab.Screen name="Home" component={ClientHomeScreen} />
      <Tab.Screen name="Post" component={PostTaskScreen} />
      <Tab.Screen name="Tasks" component={MyTasksScreen} />
      <Tab.Screen
  name="Messages"
  component={MessagesScreen}
  options={{
    tabBarBadge: 2, // replace with dynamic count later
    tabBarBadgeStyle: {
      backgroundColor: "#c1ff72",
      color: "#213729",
      fontFamily: "InterBold",
      fontSize: 10,
    },
  }}
/>

<Tab.Screen
  name="Notifications"
  component={NotificationsScreen}
  options={{
    tabBarBadge: 1, // replace with real notification count later
    tabBarBadgeStyle: {
      backgroundColor: "#ff3b30", // red dot style
    },
  }}
/>

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
