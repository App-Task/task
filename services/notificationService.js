import axios from "axios";
import { getToken } from "./authStorage";

/**
 * Update all existing notification language to match the new language
 * This translates all existing notifications to the new language
 */
export const updateNotificationLanguage = async (newLanguage) => {
  try {
    const token = await getToken();
    if (!token) {
      console.log("No token found, skipping notification language update");
      return;
    }

    const response = await axios.patch(
      "https://task-kq94.onrender.com/api/notifications/update-language",
      { language: newLanguage },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Notifications language updated successfully");
    return response.data;
  } catch (error) {
    console.error("❌ Failed to update notification language:", error.message);
    // Don't throw error to avoid blocking language change
  }
};

/**
 * Clear all notifications for the current user (keeping this for backward compatibility)
 */
export const clearAllNotifications = async () => {
  try {
    const token = await getToken();
    if (!token) {
      console.log("No token found, skipping notification clear");
      return;
    }

    const response = await axios.delete(
      "https://task-kq94.onrender.com/api/notifications/clear-all",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Notifications cleared successfully");
    return response.data;
  } catch (error) {
    console.error("❌ Failed to clear notifications:", error.message);
    // Don't throw error to avoid blocking language change
  }
};