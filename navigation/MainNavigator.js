import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/common/SplashScreen";
import WelcomeScreen from "../screens/common/WelcomeScreen";
import LoginScreen from "../screens/common/LoginScreen";
import RegisterScreen from "../screens/common/RegisterScreen";
import BottomTabNavigator from "./BottomTabNavigator"; // Tab layout for Client side
import TaskDetailsScreen from "../screens/clients/TaskDetailsScreen";
import EditTaskScreen from "../screens/clients/EditTaskScreen";
import ViewBidsScreen from "../screens/clients/ViewBidsScreen";
import ChatScreen from "../screens/clients/ChatScreen";
import EditProfileScreen from "../screens/clients/EditProfileScreen";
import ChangePasswordScreen from "../screens/clients/ChangePasswordScreen";
import MyPaymentsScreen from "../screens/clients/MyPaymentsScreen";
import PaymentMethodsScreen from "../screens/clients/PaymentMethodsScreen";

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash" // ✅ Start at splash for full onboarding flow
      screenOptions={{ headerShown: false }}
    >
      {/* Onboarding & Auth */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Full client-side app after login */}
      <Stack.Screen name="ClientHome" component={BottomTabNavigator} />
      <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
      <Stack.Screen name="EditTask" component={EditTaskScreen} />
      <Stack.Screen name="ViewBids" component={ViewBidsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="MyPayments" component={MyPaymentsScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    </Stack.Navigator>
  );
}
