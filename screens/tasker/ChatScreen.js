import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  I18nManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const initialMessages = [
  { id: "1", sender: "client", text: "Hello, can you start today?", time: "10:15 AM" },
  { id: "2", sender: "tasker", text: "Yes, I’m available after 5 PM.", time: "10:17 AM" },
];

export default function ChatScreen({ navigation }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      sender: "tasker",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.bubble,
        item.sender === "tasker" ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.time}>{item.time}</Text>
    </View>
  );

  return (
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
        <Text style={styles.title}>{t("taskerChat.title")}</Text>
        <TouchableOpacity onPress={() => alert(t("taskerChat.reported"))}>
          <Ionicons name="alert-circle-outline" size={24} color="#213729" />
        </TouchableOpacity>
      </View>

      {/* Chat */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageContainer}
        inverted
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t("taskerChat.placeholder")}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
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
});
