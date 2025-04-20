import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

const dummyConversations = [
  {
    id: "1",
    name: "Ahmed Khaled",
    lastMessage: "Can we start tomorrow?",
    time: "2:30 PM",
    unread: true,
  },
  {
    id: "2",
    name: "Mona Saeed",
    lastMessage: "Thanks for the great work!",
    time: "9:00 AM",
    unread: false,
  },
];

export default function TaskerMessagesScreen({ navigation }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setConversations(dummyConversations);
    }, 500);
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Chat", { user: item })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarInitials}>
          {item.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </Text>
      </View>

      <View style={styles.textGroup}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.preview}>{item.lastMessage}</Text>
      </View>

      <View style={styles.rightGroup}>
        <Text style={styles.time}>{item.time}</Text>
        {item.unread && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("messagess.title")}</Text>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
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
  card: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: "#c1ff72",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: I18nManager.isRTL ? 0 : 14,
    marginLeft: I18nManager.isRTL ? 14 : 0,
  },
  avatarInitials: {
    fontFamily: "InterBold",
    color: "#213729",
    fontSize: 16,
  },
  textGroup: {
    flex: 1,
  },
  name: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
    marginBottom: 4,
  },
  preview: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
  },
  rightGroup: {
    alignItems: I18nManager.isRTL ? "flex-start" : "flex-end",
  },
  time: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#c1ff72",
  },
});
