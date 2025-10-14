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
import EmptyState from "../../components/EmptyState";

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
      <Text style={styles.title}>Messages</Text>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
      </View>

      {loading && conversations.length === 0 ? (
        <ActivityIndicator size="large" color="#214730" style={{ marginTop: 40 }} />
      ) : conversations.length === 0 ? (
        <EmptyState 
          title="No Messages Yet" 
          subtitle="Start conversations with clients by bidding on their tasks!"
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
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingTop: 90,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 28,
    color: "#214730",
    marginBottom: 20,
    textAlign: "left",
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
    color: "#215433",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyIllustration: {
    marginBottom: 30,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#C4D2D6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  stopwatch: {
    position: "absolute",
    right: 15,
    top: 20,
    width: 50,
    height: 50,
  },
  stopwatchFace: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#000000",
    position: "relative",
    overflow: "hidden",
  },
  stopwatchProgress: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "33%",
    height: "100%",
    backgroundColor: "#C6E265",
  },
  stopwatchButton: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  mug: {
    position: "absolute",
    left: 10,
    bottom: 15,
    width: 30,
    height: 25,
    backgroundColor: "#ffffff",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#000000",
  },
  mugHandle: {
    position: "absolute",
    right: -8,
    top: 5,
    width: 8,
    height: 12,
    borderWidth: 1,
    borderColor: "#000000",
    borderLeftWidth: 0,
    borderRadius: 0,
  },
  mugLiquid: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    height: 8,
    backgroundColor: "#8BC34A",
    borderRadius: 1,
  },
  emptyTitle: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#214730",
    textAlign: "center",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c1ff72", // lime green
    marginRight: 10,
  },

  searchBar: {
    backgroundColor: "#E0E0E0",
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
