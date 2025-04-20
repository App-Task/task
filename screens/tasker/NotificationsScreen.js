import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  I18nManager,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInRight } from "react-native-reanimated";

const mockNotifications = [
  {
    id: "1",
    type: "hired",
    message: "You’ve been hired for 'Fix My AC'",
    time: "2 hrs ago",
  },
  {
    id: "2",
    type: "message",
    message: "You have a new message from Ahmed",
    time: "4 hrs ago",
  },
];

export default function TaskerNotificationsScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  }, []);

  const renderItem = ({ item }) => (
    <Animated.View entering={FadeInRight.duration(400)} style={styles.card}>
      <Text style={styles.message}>{t(`notify.types.${item.type}`)}: {item.message}</Text>
      <Text style={styles.time}>{item.time}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("notify.title")}</Text>

      {loading ? (
        <ActivityIndicator color="#213729" size="large" style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <Text style={styles.empty}>{t("notify.empty")}</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
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
