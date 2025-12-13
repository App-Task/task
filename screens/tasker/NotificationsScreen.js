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
import EmptyState from "../../components/EmptyState";
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
    
    const currentLang = i18n.language;
    
    // Hardcoded translations for all notification patterns
    const translations = {
      // English notifications
      "New Message": currentLang === "ar" ? "رسالة جديدة" : "New Message",
      "New Bid on Your Task": currentLang === "ar" ? "عرض جديد على مهمتك" : "New Bid on Your Task",
      "You've Been Hired!": currentLang === "ar" ? "تم توظيفك!" : "You've Been Hired!",
      "New Review": currentLang === "ar" ? "تقييم جديد" : "New Review",
      "Task Cancelled": currentLang === "ar" ? "تم إلغاء المهمة" : "Task Cancelled",
      "Task Completed": currentLang === "ar" ? "تم إنجاز المهمة" : "Task Completed",
      "Verification Status": currentLang === "ar" ? "حالة التحقق" : "Verification Status",
      "Your documents were approved. You're now verified!": currentLang === "ar" ? "تم الموافقة على مستنداتك. أنت الآن معتمد!" : "Your documents were approved. You're now verified!",
      "Your documents were declined. Please re-upload to get verified.": currentLang === "ar" ? "تم رفض مستنداتك. يرجى إعادة التحميل للحصول على الاعتماد." : "Your documents were declined. Please re-upload to get verified.",
      
      // Arabic notifications  
      "رسالة جديدة": currentLang === "ar" ? "رسالة جديدة" : "New Message",
      "عرض جديد على مهمتك": currentLang === "ar" ? "عرض جديد على مهمتك" : "New Bid on Your Task",
      "تم توظيفك!": currentLang === "ar" ? "تم توظيفك!" : "You've Been Hired!",
      "تقييم جديد": currentLang === "ar" ? "تقييم جديد" : "New Review",
      "تم إلغاء المهمة": currentLang === "ar" ? "تم إلغاء المهمة" : "Task Cancelled",
      "تم إنجاز المهمة": currentLang === "ar" ? "تم إنجاز المهمة" : "Task Completed",
      "حالة التحقق": currentLang === "ar" ? "حالة التحقق" : "Verification Status",
      "تم الموافقة على مستنداتك. أنت الآن معتمد!": currentLang === "ar" ? "تم الموافقة على مستنداتك. أنت الآن معتمد!" : "Your documents were approved. You're now verified!",
      "تم رفض مستنداتك. يرجى إعادة التحميل للحصول على الاعتماد.": currentLang === "ar" ? "تم رفض مستنداتك. يرجى إعادة التحميل للحصول على الاعتماد." : "Your documents were declined. Please re-upload to get verified."
    };
    
    // Check for exact matches first
    if (translations[text]) {
      return translations[text];
    }
    
    // Handle messages with parameters (like "New message from John")
    for (const [key, value] of Object.entries(translations)) {
      if (text.startsWith(key) && key.length < text.length) {
        const param = text.substring(key.length);
        return value + param;
      }
    }
    
    // Handle translation keys (fallback)
    if (text.includes('notification.')) {
      if (text.includes('|')) {
        const [key, param] = text.split('|');
        const translatedParam = param === 'someone' ? (currentLang === "ar" ? "شخص ما" : "someone") : param;
        return t(key, { name: translatedParam, title: translatedParam });
      }
      return t(text);
    }
    
    // Return original text if no translation found
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
        {new Date(item.createdAt).toLocaleString("en-GB", {
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
<Text style={styles.title}>{t("taskerNotifications.title")}</Text>

      {loading ? (
        <ActivityIndicator color="#213729" size="large" style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <EmptyState 
          title={t("taskerNotifications.emptyTitle")} 
          subtitle={t("taskerNotifications.emptySubtitle")}
        />
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
    paddingTop: 90,          // match messages screen
    paddingHorizontal: 24,   // match messages screen
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 28,            // larger, like messages screen
    color: "#215432",        // dark green
    marginBottom: 20,
    textAlign: "left",       // left aligned (consistent)
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
