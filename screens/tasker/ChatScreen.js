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
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { getToken } from "../../services/authStorage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";


const { width } = Dimensions.get("window");

export default function TaskerChatScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { name, otherUserId } = route.params;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  
  const isRTL = i18n.language === "ar";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ zIndex: 1 }}>
            <Ionicons name="arrow-back" size={24} color="#215433" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
          <TouchableOpacity
            onPress={() => alert(t("clientChat.reported"))}
            style={{ marginLeft: 8, zIndex: 1 }}
          >
            <Ionicons name="alert-circle-outline" size={24} color="#215433" />
          </TouchableOpacity>
        </View>
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

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

      const res = await axios.post(
        `https://task-kq94.onrender.com/api/messages`,
        {
          receiver: otherUserId,
          text: message.trim() || "📷 Image",
          image: imageUrl,
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
      setSelectedImage(null);
    } catch (err) {
      console.error("❌ Error sending message:", err.message);
      Alert.alert("Error", "Failed to send message");
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
  <FlatList
    data={messages}
    renderItem={renderItem}
    keyExtractor={(item) => item._id || item.id}
    contentContainerStyle={styles.chatBox}
    inverted
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
    <View style={[styles.inputRow, isRTL ? { flexDirection: "row-reverse" } : {}]}>
      <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
        <Ionicons name="image-outline" size={24} color="#215433" />
      </TouchableOpacity>
      <TextInput
        value={message}
        onChangeText={setMessage}
        style={[styles.input, isRTL ? { textAlign: "right", writingDirection: "rtl" } : { textAlign: "left" }]}
        placeholder={t("clientChat.placeholder")}
        placeholderTextColor="#aaa"
        placeholderTextAlign={isRTL ? "right" : "left"}
      />
      <TouchableOpacity
        style={[styles.sendButton, isRTL ? { marginRight: 10 } : { marginLeft: 10 }, sending && { backgroundColor: "#888" }]}
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
    borderBottomColor: "#eee",
    backgroundColor: "#ffffff",
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
    backgroundColor: "#215433",
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
  attachButton: {
    padding: 8,
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
