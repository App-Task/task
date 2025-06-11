import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getToken } from "../../services/authStorage";

export default function TaskerMessagesScreen({ navigation }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);

  const fetchConversations = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(
        "https://task-kq94.onrender.com/api/messages/conversations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations:", err.message);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("Chat", {
          name: item.name,
          otherUserId: item.otherUserId,
        })
      }
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
        <Text style={styles.preview} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      <View style={styles.rightGroup}>
        <Text style={styles.time}>{item.time}</Text>
        {/* Uncomment when you add unread logic */}
        {/* item.unread && <View style={styles.unreadDot} /> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("taskerMessages.title")}</Text>

      {conversations.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 40, color: "#888" }}>
          {t("taskerMessages.empty")}
        </Text>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.otherUserId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
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
