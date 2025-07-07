import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  I18nManager,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { getToken } from "../../services/authStorage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";


const { width } = Dimensions.get("window");

export default function TaskerChatScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { name, otherUserId } = route.params;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [sending, setSending] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name,
      headerShown: true,
      headerStyle: {
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTitleStyle: {
        fontFamily: "InterBold",
        fontSize: 18,
        color: "#213729",
      },
      headerTintColor: "#213729",
      headerRight: () => (
        <TouchableOpacity
          onPress={() => alert(t("clientChat.reported"))}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="alert-circle-outline" size={24} color="#213729" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, name]);

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
    if (!message.trim()) return;
    setSending(true);
    try {
      const token = await getToken();
      const res = await axios.post(
        `https://task-kq94.onrender.com/api/messages`,
        {
          receiver: otherUserId,
          text: message.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newMessage = {
        ...res.data,
        sender: currentUserId,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "✓",
      };

      setMessages((prev) => [newMessage, ...prev]);
      setMessage("");
    } catch (err) {
      console.error("❌ Error sending message:", err.message);
    } finally {
      setSending(false);
    }
  };

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
         <View style={styles.avatar}>
         <Text style={styles.avatarLetter}>
           {sender?.name?.charAt(0)?.toUpperCase() || "?"}
         </Text>
       </View>
       
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
            {item.timestamp ||
              new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
            {isMine && (item.status || "✓")}
          </Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const initialize = async () => {
      const id = await SecureStore.getItemAsync("userId");
      setCurrentUserId(id);
      setTimeout(fetchMessages, 200);
      setInterval(fetchMessages, 5000);
    };
    initialize();
  }, []);

  return (
   
<SafeAreaView style={styles.safeArea}>
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1 }}
    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // adjust if needed
  >
    <View style={styles.container}>
      {/* Messages and Input here */}
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
    backgroundColor: "#315052", // or any other plain color you like
    justifyContent: "center",
    alignItems: "center",
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
  avatarLetter: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 30,
  },
  
});
