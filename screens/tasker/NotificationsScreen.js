import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  I18nManager,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInRight } from "react-native-reanimated";
import axios from "axios";
import { getToken } from "../../services/authStorage"; // adjust if path differs
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import i18n from "i18next";

export default function TaskerNotificationsScreen({ navigation, setUnreadNotifications }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Move this outside useFocusEffect
  const fetchAndHandleNotifications = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const res = await axios.get("https://task-kq94.onrender.com/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allNotifs = res.data;
      const unread = allNotifs.filter((n) => !n.isRead).length;

      setNotifications(allNotifs);
      setUnreadCount(unread);
      setLoading(false);

      await axios.patch("https://task-kq94.onrender.com/api/notifications/mark-read", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadCount(0);
      if (setUnreadNotifications) setUnreadNotifications(0);
    } catch (err) {
      console.error("❌ Notification fetch/mark error:", err.message);
      setLoading(false);
    }
  };

  // ✅ Refresh handler for swipe-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAndHandleNotifications();
    setRefreshing(false);
  };

  // ✅ Triggers on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchAndHandleNotifications();
    }, [])
  );

  // ✅ Listen for language changes
  useEffect(() => {
    const languageChangeHandler = () => {
      fetchAndHandleNotifications();
    };
    
    i18n.on('languageChanged', languageChangeHandler);
    
    return () => {
      i18n.off('languageChanged', languageChangeHandler);
    };
  }, []);


  const translateNotification = (text) => {
    if (!text) return '';
    
    // Check if it's a translation key
    if (text.includes('notification.')) {
      // Handle messages with parameters (format: "key|param")
      if (text.includes('|')) {
        const [key, param] = text.split('|');
        const translatedParam = param === 'someone' ? t('notification.someone') : param;
        return t(key, { name: translatedParam, title: translatedParam });
      }
      // Handle simple translation keys
      return t(text);
    }
    
    // Return original text if not a translation key
    return text;
  };

  const renderItem = ({ item }) => (
    <Animated.View
      entering={FadeInRight.duration(400)}
      style={[
        styles.card,
        !item.isRead && styles.unreadCard, // ✅ Add unread style if needed
      ]}
    >
      <Text style={styles.message}>
        {item.type === "message" ? translateNotification(item.message) : `${translateNotification(item.title)}: ${translateNotification(item.message)}`}
      </Text>
  
      <Text style={styles.time}>
        {new Date(item.createdAt).toLocaleString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short",
        })}
      </Text>
    </Animated.View>
  );
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("taskerNotifications.title")}</Text>

      {loading ? (
        <ActivityIndicator color="#213729" size="large" style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <Text style={styles.empty}>{t("taskerNotifications.empty")}</Text>
      ) : (
        <FlatList
  data={notifications}
  keyExtractor={(item) => item._id}
  renderItem={renderItem}
  contentContainerStyle={{ paddingBottom: 40 }}
  showsVerticalScrollIndicator={false}
  refreshing={refreshing}          // ✅ enables spinner on pull
  onRefresh={handleRefresh}        // ✅ trigger refresh handler
/>

      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  empty: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 80,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
  },
  message: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#213729",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  time: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#999",
    textAlign: I18nManager.isRTL ? "left" : "right",
  },
  unreadCard: {
    backgroundColor: "#e6f2e6", // light green tint for unread
  },
  
});
