import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
  ActivityIndicator,
  TextInput, // ✅ Add this
} from "react-native";

import { useTranslation } from "react-i18next";
import axios from "axios";
import { getToken } from "../../services/authStorage";
import EmptyState from "../../components/EmptyState";
import { useFocusEffect } from "@react-navigation/native";

export default function MessagesScreen({ navigation }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);      // ✅ NEW
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");


  const fetchConversations = async (fromRefresh = false) => {
    try {
      if (fromRefresh) setRefreshing(true);
      else setLoading(true);
  
      const token = await getToken();
      const res = await axios.get(
        "https://task-kq94.onrender.com/api/messages/conversations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      const sorted = res.data.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      setConversations(sorted);
    } catch (err) {
      console.error("Failed to load conversations:", err.message);
    } finally {
      if (fromRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };
  

  useFocusEffect(
    useCallback(() => {
      fetchConversations(false); // 👈 first-time load
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
        style={styles.card}
        onPress={() =>
          navigation.navigate("Chat", {
            name: item.name,
            otherUserId: item.otherUserId,
          })
        }
      >
        <View style={styles.row}>
  <View style={styles.avatar} /> 
  <View style={{ flex: 1 }}>
    <Text style={styles.name}>{item.name || "Test User"}</Text>
    <Text style={styles.message} numberOfLines={1}>
      {item.lastMessage || "It is a long established fact that a reader..."}
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
      <Text style={styles.title}>{t("clientMessages.title")}</Text>
      <View style={styles.searchBar}>
  <TextInput
    style={styles.searchInput}
    placeholder={t("clientMessages.search")}
    placeholderTextColor="#777"
    value={searchQuery}
    onChangeText={(text) => setSearchQuery(text)}
  />
</View>



      {loading && conversations.length === 0 ? (
        <ActivityIndicator size="large" color="#215433" style={{ marginTop: 40 }} />
      ) : conversations.length === 0 ? (
        <EmptyState 
          title="No Messages Yet" 
          subtitle="Start conversations with taskers by posting tasks and accepting bids!"
        />
      ) : (
<FlatList
  data={conversations.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )}
  keyExtractor={(item) => item.otherUserId}
  renderItem={renderItem}
  contentContainerStyle={{ paddingBottom: 40 }}
  showsVerticalScrollIndicator={false}
  refreshing={refreshing}          // ✅ enable pull-down indicator
  onRefresh={() => fetchConversations(true)} // 👈 explicitly mark as refresh
/>


      )}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
    paddingTop: 90,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 28, // ✅ larger like screenshot
    color: "#215432", // ✅ dark green
    marginBottom: 20,
    textAlign: "left", // ✅ left aligned
  },
  
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  message: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
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
    backgroundColor: "#215433",
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
  refreshIconContainer: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: -10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c1ff72", // ✅ lime green avatar
    marginRight: 10,
  },

  searchBar: {
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: {
    color: "#000",
    fontFamily: "Inter",
    fontSize: 14,
  },
  
  
});
