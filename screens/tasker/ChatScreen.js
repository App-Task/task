import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  I18nManager,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getToken } from "../../services/authStorage";

import { SafeAreaView } from "react-native-safe-area-context";


const { width } = Dimensions.get("window");

export default function ChatScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { name, otherUserId } = route.params;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

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
      console.error("❌ Error loading messages:", err.message);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      const token = await getToken();
      const res = await axios.post(
        `https://task-kq94.onrender.com/api/messages`,
        {
          receiver: otherUserId,
          text: input.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newMessage = {
        ...res.data,
        sender: "me",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [newMessage, ...prev]);
      setInput("");
    } catch (err) {
      console.error("❌ Error sending message:", err.message);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe =
    item.sender === "me" || // newly sent
    item.sender?._id === route.params.currentUserId || // fetched from API
    item.sender === route.params.currentUserId; // fallback if already just ID
  

    return (
      <View
        style={[
          styles.bubble,
          isMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.time}>
          {item.time ||
            new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
  
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#213729"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity onPress={() => alert(t("clientChat.reported"))}>
          <Ionicons name="alert-circle-outline" size={24} color="#213729" />
        </TouchableOpacity>
      </View>

      {/* Chat */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageContainer}
        inverted
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t("clientChat.placeholder")}
          placeholderTextColor="#aaa"
          value={input}
          onChangeText={setInput}
          textAlign={I18nManager.isRTL ? "right" : "left"}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      </View>
  </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#213729",
  },
  messageContainer: {
    padding: 20,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: width * 0.7,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  myMessage: {
    backgroundColor: "#213729",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#f1f1f1",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#fff",
    fontFamily: "Inter",
    fontSize: 15,
  },
  time: {
    color: "#ccc",
    fontSize: 11,
    marginTop: 4,
    fontFamily: "Inter",
    textAlign: I18nManager.isRTL ? "left" : "right",
  },
  inputRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 30,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter",
    color: "#333",
  },
  sendBtn: {
    backgroundColor: "#213729",
    marginLeft: 10,
    padding: 10,
    borderRadius: 30,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  
});
