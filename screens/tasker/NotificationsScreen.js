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

export default function TaskerNotificationsScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await getToken();
        const res = await axios.get("https://task-kq94.onrender.com/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch tasker notifications:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => (
    <Animated.View entering={FadeInRight.duration(400)} style={styles.card}>
      <Text style={styles.message}>
        {item.title}: {item.message}
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
});
