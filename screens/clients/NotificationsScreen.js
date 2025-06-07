import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";

export default function NotificationsScreen() {
  const { t } = useTranslation();

  const [notifications] = useState([
    {
      id: "1",
      title: t("clientNotifications.taskHired"),
      description: t("clientNotifications.taskHiredDesc"),
      time: "2h ago",
    },
    {
      id: "2",
      title: t("clientNotifications.newMessage"),
      description: t("clientNotifications.newMessageDesc"),
      time: "4h ago",
    },
    {
      id: "3",
      title: t("clientNotifications.paymentSent"),
      description: t("clientNotifications.paymentSentDesc"),
      time: "1d ago",
    },
  ]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc}>{item.description}</Text>
      <Text style={styles.cardTime}>{item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>{t("clientNotifications.title")}</Text>

      {notifications.length === 0 ? (
        <Text style={styles.empty}>{t("clientNotifications.none")}</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
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
