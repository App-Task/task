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
  Modal,
  Alert,
  I18nManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import axios from "axios";
import { getToken } from "../../services/authStorage";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function ChatScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { name, otherUserId } = route.params || {};
  
  // Handle case where required params are missing
  useEffect(() => {
    if (!otherUserId) {
      Alert.alert(
        t("common.errorTitle") || "Error",
        "Chat information is missing.",
        [{ text: t("common.ok") || "OK", onPress: () => navigation.goBack() }]
      );
    }
  }, [otherUserId]);
  const isRTL = i18n.language === "ar";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);

  // Format message date with date and time
  const formatMessageDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isArabic = i18n.language === "ar";
      const locale = isArabic ? "ar-SA" : "en-GB";
      
      if (isToday) {
        return date.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        const dateStr = date.toLocaleDateString(locale, {
          day: "2-digit",
          month: "short",
        });
        const timeStr = date.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${dateStr} ${timeStr}`;
      }
    } catch (e) {
      return "";
    }
  };

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

  const pickImage = async () => {
    try {
      const { status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need camera roll permissions to send images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error("❌ Error picking image:", err.message);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const sendMessage = async () => {
    if (!message.trim() && !selectedImage) return;
    setSending(true);
    try {
      const token = await getToken();
      
      let imageUrl = null;
      if (selectedImage) {
        // Upload image first
        const formData = new FormData();
        formData.append("image", {
          uri: selectedImage,
          type: "image/jpeg",
          name: "chat-image.jpg",
        });

        const uploadRes = await fetch(
          "https://task-kq94.onrender.com/api/upload",
          {
            method: "POST",
            headers: {
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          }
        );
        
        const uploadData = await uploadRes.json();
        if (uploadData.imageUrl) {
          imageUrl = uploadData.imageUrl;
        } else {
          throw new Error("Image upload failed");
        }
      }

      // Ensure receiver ID is valid (24 characters for MongoDB ObjectId)
      if (!otherUserId || otherUserId.length !== 24) {
        throw new Error("Invalid receiver ID");
      }

      // Prepare message data - ensure text is properly handled
      const messageData = {
        receiver: otherUserId,
      };

      // Only include text if it exists and is not empty
      if (message.trim()) {
        messageData.text = message.trim();
      } else if (imageUrl) {
        // If no text but has image, use default text
        messageData.text = "📷 Image";
      } else {
        // If neither text nor image, this shouldn't happen due to early return
        throw new Error("Message text or image required");
      }

      // Include image if available
      if (imageUrl) {
        messageData.image = imageUrl;
      }

      const res = await axios.post(
        `https://task-kq94.onrender.com/api/messages`,
        messageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
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
      setSelectedImage(null);
    } catch (err) {
      console.error("Error sending message:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || err.response?.data?.msg || err.response?.data?.details?.join(", ") || err.message || "Failed to send message";
      Alert.alert("Error", `Error sending message: ${errorMessage}`);
    } finally {
      setSending(false);
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
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(sender?.name || name || "?").charAt(0).toUpperCase()}
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
          {item.image && (
            <TouchableOpacity onPress={() => setViewingImage(item.image)}>
              <Image source={{ uri: item.image }} style={styles.messageImage} />
            </TouchableOpacity>
          )}
          {item.text && <Text style={styles.messageText}>{item.text}</Text>}
          <Text style={styles.timestamp}>
            {item.timestamp || formatMessageDate(item.createdAt)} {isMine && (item.status || "✓")}
          </Text>
        </View>
      </View>
    );
  };return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ zIndex: 1 }}>
          <Ionicons name="arrow-back" size={24} color="#215433" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("clientChat.chatWith", { name })}
        </Text>
        <View style={{ width: 24, zIndex: 1 }} />
      </View>
      <KeyboardAvoidingView
  style={styles.flex}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
>
  <View style={styles.flex}>
    <FlatList
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item) => item._id || item.id}
      contentContainerStyle={styles.chatBox}
      inverted
      keyboardShouldPersistTaps="handled"
    />

    <View>
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={24} color="#215433" />
          </TouchableOpacity>
        </View>
      )}
      <View style={[styles.inputRow, isRTL && styles.inputRowRTL]}>
        <TouchableOpacity style={[styles.attachButton, isRTL && styles.attachButtonRTL]} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color="#215433" />
        </TouchableOpacity>
        <TextInput
          value={message}
          onChangeText={setMessage}
          style={[styles.input, isRTL && styles.inputRTL]}
          placeholder={t("clientChat.placeholder")}
          placeholderTextColor="#666"
          textAlign={isRTL ? "right" : "left"}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            isRTL && styles.sendButtonRTL,
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
    </View>
  </View>
</KeyboardAvoidingView>

{/* Full Screen Image Viewer */}
{viewingImage && (
  <Modal visible={true} transparent={true} onRequestClose={() => setViewingImage(null)}>
    <View style={styles.imageViewerContainer}>
      <TouchableOpacity
        style={styles.closeImageButton}
        onPress={() => setViewingImage(null)}
      >
        <Ionicons name="close" size={30} color="#fff" />
      </TouchableOpacity>
      <Image source={{ uri: viewingImage }} style={styles.fullImage} resizeMode="contain" />
    </View>
  </Modal>
)}

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
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#eee",
    direction: "ltr",
    position: "relative",
  },
  headerTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#215433",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  chatBox: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0, // was 20 — reduce this to zero
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
    marginRight: I18nManager.isRTL ? 0 : 8,
    marginLeft: I18nManager.isRTL ? 8 : 0,
    backgroundColor: "#315052",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 30,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
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
    color: "#215433",
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
  inputRowRTL: {
    flexDirection: "row-reverse",
  },
  input: {
    flex: 1,
    fontFamily: "Inter",
    backgroundColor: "#f9f9f9",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    color: "#000",
    marginHorizontal: 8,
  },
  inputRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#215433",
    padding: 10,
    borderRadius: 30,
    minWidth: 42,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonRTL: {
    marginLeft: 0,
    marginRight: 10,
  },
  attachButton: {
    marginRight: 10,
    padding: 8,
  },
  attachButtonRTL: {
    marginRight: 0,
    marginLeft: 10,
  },
  flex: {
    flex: 1,
  },
  imagePreviewContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    position: "relative",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeImageButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: "90%",
    height: "80%",
  },
});
