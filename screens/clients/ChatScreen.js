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


export default function ChatScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { name, otherUserId } = route.params;

  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");

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

  const sendMessage = async () => {
    if (!message.trim()) return;

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
          status: "delivered",
        },
        ...prev,
      ]);

      setMessage("");
      setIsTyping(false);
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const id = await SecureStore.getItemAsync("user_id");
      setCurrentUserId(id);
  
      // ✅ wait until currentUserId is set, then fetch messages
      setTimeout(fetchMessages, 100);
      setInterval(fetchMessages, 5000);
    };
  
    initialize();
  }, []);
  
  const renderItem = ({ item }) => {
    // ✅ Safely extract sender ID whether it's a string or an object
    const senderId =
      typeof item.sender === "string" ? item.sender : item.sender?._id;
  
    // ✅ Compare consistently using string form
    const isMine = senderId?.toString() === currentUserId?.toString();
  
    return (
      <View style={[styles.messageRow, isMine ? styles.rowRight : styles.rowLeft]}>
        {!isMine && (
          <Image
            source={require("../../assets/images/profile.png")}
            style={styles.avatar}
          />
        )}
        <View style={[styles.messageBubble, isMine ? styles.me : styles.other]}>
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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#213729" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("clientChat.chatWith", { name })}
        </Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.chatBox}
        inverted
      />

      {isTyping && (
        <Text style={styles.typingIndicator}>
          {t("clientChat.typing", { name })}
        </Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            setIsTyping(true);
          }}
          style={styles.input}
          placeholder={t("clientChat.placeholder")}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
</SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
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
    marginBottom: 12,
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  rowRight: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 20,
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
  },
  timestamp: {
    fontFamily: "Inter",
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    textAlign: "right",
  },
  typingIndicator: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#999",
    marginLeft: 20,
    marginBottom: 5,
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
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
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  
});
