import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getToken } from "../../services/authStorage";
import { useFocusEffect } from "@react-navigation/native";

export default function TaskerMessagesScreen({ navigation }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);


  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = await getToken();
  
      if (!token) {
        setConversations([]); // clear conversations on logout
        return;
      }
  
      const res = await axios.get("https://task-kq94.onrender.com/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const sorted = res.data.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
  
      setConversations(sorted);
    } catch (err) {
      console.error("Failed to load conversations:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };
  
  

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const renderItem = ({ item }) => {
    const unread = item.unreadCount || 0;
    let badgeText = "";
    if (unread === 1) badgeText = "+1";
    else if (unread === 2) badgeText = "+2";
    else if (unread > 2 && unread <= 5) badgeText = `+${unread}`;
    else if (unread > 5) badgeText = "5+";

    const isUnread = unread > 0;

    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.unreadCard]}
        onPress={() =>
          navigation.navigate("Chat", {
            name: item.name,
            otherUserId: item.otherUserId,
          })
        }
      >
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name || "Unnamed User"}</Text>
            <Text style={styles.message} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>

          <View style={styles.rightSide}>
            <Text style={styles.time}>{item.time}</Text>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{badgeText}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("taskerMessages.title")}</Text>

      {loading && conversations.length === 0 ? (
        <ActivityIndicator size="large" color="#213729" style={{ marginTop: 40 }} />
      ) : conversations.length === 0 ? (
        <Text style={styles.empty}>{t("taskerMessages.empty")}</Text>
      ) : (
        <FlatList
  data={conversations}
  keyExtractor={(item) => item.otherUserId}
  renderItem={renderItem}
  contentContainerStyle={{ paddingBottom: 40 }}
  showsVerticalScrollIndicator={false}
  refreshing={refreshing}          // ✅ enables pull-to-refresh spinner
  onRefresh={handleRefresh}        // ✅ trigger logic on swipe
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
  title: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#213729",
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  message: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  time: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginBottom: 6,
  },
  rightSide: {
    alignItems: "flex-end",
    marginLeft: 10,
  },
  unreadBadge: {
    backgroundColor: "#213729",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 12,
  },
  empty: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
});
