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

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("task_auth_token");
  
      const res = await axios.get("https://task-kq94.onrender.com/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setNotifications(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch notifications:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc}>{item.message}</Text>
      <Text style={styles.cardTime}>
        {new Date(item.createdAt).toLocaleString("en-GB", {
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
      <Text style={styles.screenTitle}>{t("clientNotifications.title")}</Text>

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
});
