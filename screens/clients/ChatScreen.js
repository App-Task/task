import React, { useState } from "react";
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

export default function ChatScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { name } = route.params;
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: t("chat.mock1"),
      sender: "other",
      timestamp: "10:02 AM",
    },
    {
      id: "2",
      text: t("chat.mock2"),
      sender: "me",
      timestamp: "10:05 AM",
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        text: message,
        sender: "me",
        timestamp,
      },
    ]);
    setMessage("");
    setIsTyping(false);
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageRow,
        item.sender === "me" ? styles.rowRight : styles.rowLeft,
      ]}
    >
      {item.sender === "other" && (
        <Image
          source={require("../../assets/images/profile.png")}
          style={styles.avatar}
        />
      )}
      <View
        style={[
          styles.messageBubble,
          item.sender === "me" ? styles.me : styles.other,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#213729" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("chat.chatWith", { name })}
        </Text>
      </View>

      <FlatList
        data={messages.slice().reverse()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatBox}
        inverted
      />

      {isTyping && (
        <Text style={styles.typingIndicator}>
          {t("chat.typing", { name })}
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
          placeholder={t("chat.placeholder")}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
});
