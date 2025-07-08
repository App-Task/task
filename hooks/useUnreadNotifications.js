import { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const token = await AsyncStorage.getItem("task_auth_token");
      const res = await axios.get("https://task-kq94.onrender.com/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const unread = res.data.filter((n) => !n.isRead);
      setUnreadCount(unread.length);
    } catch (err) {
      console.error("❌ Error loading unread notifications:", err.message);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return unreadCount;
}
