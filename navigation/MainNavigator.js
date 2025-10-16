import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/common/SplashScreen";
import WelcomeScreen from "../screens/common/WelcomeScreen";
import LoginScreen from "../screens/common/LoginScreen";
import RegisterScreen from "../screens/common/RegisterScreen";
import TermsAndConditionsScreen from "../screens/common/TermsAndConditionsScreen";
import PrivacyPolicyScreen from "../screens/common/PrivacyPolicyScreen";
import AboutUsScreen from "../screens/common/AboutUsScreen";
import ForgotPasswordRequest from "../screens/common/ForgotPasswordRequest";
import ForgotPasswordReset from "../screens/common/ForgotPasswordReset";


import BottomTabNavigator from "./BottomTabNavigator"; // Client-side bottom tabs
import TaskerBottomTabNavigator from "./TaskerBottomTabNavigator"; // Tasker-side bottom tabs
import TaskerEditProfileScreen from "../screens/tasker/EditProfileScreen";


import TaskDetailsScreen from "../screens/clients/TaskDetailsScreen";
import TaskDetailsViewBidsScreen from "../screens/clients/TaskDetailsViewBidsScreen";
import EditTaskScreen from "../screens/clients/EditTaskScreen";
import TaskUpdatedSuccessScreen from "../screens/clients/TaskUpdatedSuccessScreen";
import ViewBidsScreen from "../screens/clients/ViewBidsScreen";
import ChatScreen from "../screens/clients/ChatScreen";
import EditProfileScreen from "../screens/clients/EditProfileScreen";
import ChangePasswordScreen from "../screens/clients/ChangePasswordScreen";
import MyPaymentsScreen from "../screens/clients/MyPaymentsScreen";
import PaymentMethodsScreen from "../screens/clients/PaymentMethodsScreen";
import ImageViewerScreen from "../screens/clients/ImageViewerScreen"; // adjust path
import TaskerProfileScreen from "../screens/tasker/TaskerProfileScreen";
import NotificationsScreen from "../screens/clients/NotificationsScreen";
import CompleteTaskerProfileScreen from "../screens/tasker/CompleteTaskerProfileScreen";

// New Post Task Pages
import PostTaskPage1 from "../screens/clients/PostTaskPage1";
import PostTaskPage2 from "../screens/clients/PostTaskPage2";
import PostTaskPage3 from "../screens/clients/PostTaskPage3";





import DocumentsScreen from "../screens/tasker/DocumentsScreen";
import BankAccountScreen from "../screens/tasker/BankAccountScreen";
import MyReviewsScreen from "../screens/tasker/MyReviewsScreen";
import SettingsScreen from "../screens/tasker/SettingsScreen";
import TaskerTaskDetailsScreen from "../screens/tasker/TaskerTaskDetailsScreen";
import SendBidScreen from "../screens/tasker/SendBidScreen";
import EditBidScreen from "../screens/tasker/EditBidScreen";
import BidSentSuccessScreen from "../screens/tasker/BidSentSuccessScreen";
import BidUpdatedSuccessScreen from "../screens/tasker/BidUpdatedSuccessScreen";

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash" // Default to Tasker home for taskers, change as needed
      screenOptions={{ headerShown: false }}
    >
      {/* Onboarding & Auth */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} />

<Stack.Screen name="ForgotPasswordRequest" component={ForgotPasswordRequest} />
<Stack.Screen name="ForgotPasswordReset" component={ForgotPasswordReset} />
      





      {/* Client Home & Subscreens */}
      <Stack.Screen name="ClientHome" component={BottomTabNavigator} />
      <Stack.Screen name="TaskDetails" component={TaskDetailsViewBidsScreen} />
      <Stack.Screen name="TaskDetailsOnly" component={TaskDetailsScreen} />
      <Stack.Screen name="EditTask" component={EditTaskScreen} />
      <Stack.Screen name="TaskUpdatedSuccess" component={TaskUpdatedSuccessScreen} />
      <Stack.Screen name="ViewBids" component={ViewBidsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="MyPayments" component={MyPaymentsScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen
  name="ImageViewer"
  component={ImageViewerScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="TaskerProfile"
  component={TaskerProfileScreen}
  options={{ title: "Tasker Profile" }} // You can localize this if needed
/>
<Stack.Screen name="Notifications" component={NotificationsScreen} />

      {/* New Post Task Flow */}
      <Stack.Screen name="PostTaskPage1" component={PostTaskPage1} />
      <Stack.Screen name="PostTaskPage2" component={PostTaskPage2} />
      <Stack.Screen name="PostTaskPage3" component={PostTaskPage3} />


      {/* Tasker Home & Subscreens */}
{/* Tasker Home & Subscreens */}
<Stack.Screen name="CompleteTaskerProfile" component={CompleteTaskerProfileScreen} />
<Stack.Screen name="TaskerHome" component={TaskerBottomTabNavigator} />
<Stack.Screen name="Documents" component={DocumentsScreen} />
<Stack.Screen name="BankAccount" component={BankAccountScreen} />
<Stack.Screen name="Reviews" component={MyReviewsScreen} />
      <Stack.Screen name="TaskerTaskDetails" component={TaskerTaskDetailsScreen} />
      <Stack.Screen name="SendBid" component={SendBidScreen} />
      <Stack.Screen name="EditBid" component={EditBidScreen} />
      <Stack.Screen name="BidSentSuccess" component={BidSentSuccessScreen} />
      <Stack.Screen name="BidUpdatedSuccess" component={BidUpdatedSuccessScreen} />
<Stack.Screen name="Settings" component={SettingsScreen} />
<Stack.Screen name="EditTaskerProfile" component={TaskerEditProfileScreen} />

    </Stack.Navigator>
  );
}
