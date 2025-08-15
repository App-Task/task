import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
  ActivityIndicator,
  TextInput, // ✅ added
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
  const [searchQuery, setSearchQuery] = useState("");



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
  <View style={styles.avatar} /> 
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
      <View style={styles.searchBar}>
  <TextInput
    style={styles.searchInput}
    placeholder={t("taskerMessages.searchPlaceholder")}
    placeholderTextColor="#777"
    value={searchQuery}
    onChangeText={(text) => setSearchQuery(text)}
  />
</View>


      {loading && conversations.length === 0 ? (
        <ActivityIndicator size="large" color="#213729" style={{ marginTop: 40 }} />
      ) : conversations.length === 0 ? (
<Text style={styles.empty}>{t("taskerMessages.empty")}</Text>
      ) : (
        <FlatList
        data={conversations.filter((c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        
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
    paddingTop: 90,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 28, // larger like screenshot
    color: "#215432", // dark green
    marginBottom: 20,
    textAlign: "left", // left aligned
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d6e8b0", // light green like screenshot
    backgroundColor: "#ffffff",
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

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c1ff72", // lime green
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
