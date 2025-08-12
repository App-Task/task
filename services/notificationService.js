import axios from "axios";
import { getToken } from "./authStorage";

/**
 * Clear all notifications for the current user
 * This is useful when changing languages to remove old notifications
 * that were in the previous language
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