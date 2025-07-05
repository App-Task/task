import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getToken } from "../../services/authStorage";
import * as SecureStore from "expo-secure-store";

import { SafeAreaView } from "react-native-safe-area-context";

// ... existing imports
import { ActivityIndicator } from "react-native"; // NEW

export default function ChatScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { name, otherUserId } = route.params;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [sending, setSending] = useState(false); // NEW

  const fetchMessages = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `https://task-kq94.onrender.com/api/messages/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(res.data.reverse());
    } catch (err) {
      console.error("Error fetching messages:", err.message);
    }
  };

  const markAsRead = async () => {
    try {
      const token = await getToken();
      await axios.patch(
        `https://task-kq94.onrender.com/api/messages/mark-read/${otherUserId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Error marking messages as read:", err.message);
    }
  };
  

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true); // NEW

    try {
      const token = await getToken();
      const res = await axios.post(
        `https://task-kq94.onrender.com/api/messages`,
        {
          receiver: otherUserId,
          text: message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setMessages((prev) => [
        {
          ...res.data,
          sender: currentUserId,
          timestamp,
          status: "✓",
        },
        ...prev,
      ]);
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err.message);
    } finally {
      setSending(false); // NEW
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const id = await SecureStore.getItemAsync("userId");
      setCurrentUserId(id);
  
      setTimeout(async () => {
        await markAsRead();
        await fetchMessages();
      }, 200);
  
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    };
  
    initialize();
  }, []);
  

  const renderItem = ({ item }) => {
    const sender = typeof item.sender === "object" ? item.sender : {};
    const senderId = sender._id || item.sender;
    const isMine = senderId?.toString() === currentUserId?.toString();

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.rowRight : styles.rowLeft,
        ]}
      >
        {!isMine && (
          <Image
            source={
              sender.profileImage
                ? { uri: sender.profileImage }
                : require("../../assets/images/profile.png")
            }
            style={styles.avatar}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isMine ? styles.me : styles.other,
            isMine ? { borderTopRightRadius: 0 } : { borderTopLeftRadius: 0 },
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {item.timestamp || ""} {isMine && (item.status || "✓")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#213729" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("clientChat.chatWith", { name })}
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.chatBox}
          inverted
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            style={styles.input}
            placeholder={t("clientChat.placeholder")}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              sending && { backgroundColor: "#888" },
            ]}
            onPress={sendMessage}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#213729",
  },
  chatBox: {
    padding: 20,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 14,
    maxWidth: "100%",
  },
  rowLeft: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  rowRight: {
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#ddd",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  me: {
    backgroundColor: "#c1ff72",
  },
  other: {
    backgroundColor: "#e8e8e8",
  },
  messageText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#213729",
    lineHeight: 20,
  },
  timestamp: {
    fontFamily: "Inter",
    fontSize: 11,
    color: "#999",
    marginTop: 6,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontFamily: "Inter",
    backgroundColor: "#f9f9f9",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#213729",
    padding: 10,
    borderRadius: 30,
    minWidth: 42,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
});
