import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  I18nManager,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import EmptyState from "../../components/EmptyState";
import i18n from "i18next";




export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);


  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("task_auth_token");
  
      const res = await axios.get("https://task-kq94.onrender.com/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setNotifications(res.data);
  
      // ✅ Mark all as read
      await axios.patch("https://task-kq94.onrender.com/api/notifications/mark-read", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
     
      
    } catch (err) {
      console.error("❌ Failed to fetch notifications:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };
  

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };
  
  

  useEffect(() => {
    fetchNotifications();
    
    // Listen for language changes and refresh notifications
    const languageChangeHandler = () => {
      fetchNotifications();
    };
    
    i18n.on('languageChanged', languageChangeHandler);
    
    return () => {
      i18n.off('languageChanged', languageChangeHandler);
    };
  }, []);

  const translateNotification = (text, type = 'title') => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const isArabic = i18n.language === "ar";
    const locale = isArabic ? "ar-SA" : "en-GB";
    
    try {
      if (isArabic) {
        // Arabic format: use Arabic locale for dates and times
        return date.toLocaleString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } else {
        return date.toLocaleString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short",
        });
      }
    } catch (error) {
      // Fallback to English if Arabic formatting fails
      return date.toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      });
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.isRead && styles.unreadCard]}>
      <Text style={styles.cardTitle}>{translateNotification(item.title)}</Text>
      <Text style={styles.cardDesc}>{translateNotification(item.message)}</Text>
      <Text style={styles.cardTime}>
        {formatDate(item.createdAt)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
<View style={styles.header}>
  <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
    <Ionicons
      name={"arrow-back"}
      size={24}
      color="#215433"
    />
  </TouchableOpacity>
  <Text style={styles.title}>{t("clientNotifications.title")}</Text>
  <View style={{ width: 24 }}></View>
  </View>

      {loading ? (
        <ActivityIndicator size="large" color="#315052" style={{ marginTop: 30 }} />
      ) : notifications.length === 0 ? (
        <EmptyState 
          title={t("clientNotifications.emptyTitle")} 
          subtitle={t("clientNotifications.emptySubtitle")}
        />
      ) : (
            <FlatList
      data={notifications}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}                // ✅ enable pull-to-refresh
      onRefresh={handleRefresh}              // ✅ trigger refresh logic
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
    paddingHorizontal: 24,
  },
  screenTitle: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#215433",
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  cardDesc: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  cardTime: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#999",
    textAlign: I18nManager.isRTL ? "left" : "right",
  },
  empty: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    direction: "ltr",
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#215433",
    textAlign: "center",
    flex: 1,
  },

  unreadCard: {
    backgroundColor: "#e6f7e8", // subtle green for unread
  },
  

});
