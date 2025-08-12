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
    <View style={[styles.card, !item.isRead && styles.unreadCard]}>
      <Text style={styles.cardTitle}>{translateNotification(item.title)}</Text>
      <Text style={styles.cardDesc}>{translateNotification(item.message)}</Text>
      <Text style={styles.cardTime}>
        {new Date(item.createdAt).toLocaleString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short",
        })}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
<View style={styles.header}>
  <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
    <Ionicons
      name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
      size={24}
      color="#213729"
    />
  </TouchableOpacity>
  <Text style={styles.title}>{t("clientNotifications.title")}</Text>
  <View style={{ width: 24 }}></View>
  </View>

      {loading ? (
        <ActivityIndicator size="large" color="#315052" style={{ marginTop: 30 }} />
      ) : notifications.length === 0 ? (
        <Text style={styles.empty}>{t("clientNotifications.none")}</Text>
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
    color: "#213729",
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
    color: "#213729",
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
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#213729",
    textAlign: "center",
    flex: 1,
  },

  unreadCard: {
    backgroundColor: "#e6f7e8", // subtle green for unread
  },
  

});
