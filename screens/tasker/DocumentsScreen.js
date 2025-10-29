import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  Alert,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth";
import { getToken } from "../../services/authStorage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

export default function DocumentsScreen({ navigation, route }) {
  const fromRegister = route?.params?.fromRegister || false;
  const { t } = useTranslation();

  const getMimeType = (filename = "") => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "heic":
        return "image/heic";
      case "pdf":
        return "application/pdf";
      default:
        return "application/octet-stream";
    }
  };

  // keep both url (full path) and name for deletion + display
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ---------- NEW: unified uploader ----------
  const doUpload = async ({ uri, name, type }) => {
    const user = await fetchCurrentUser();
    const token = await getToken();

    setUploading(true);
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) throw new Error("File not found");

      const formData = new FormData();
      formData.append("userId", user._id);
      formData.append("file", {
        uri,
        name: name || `upload-${Date.now()}`,
        type: type || getMimeType(name || ""),
      });

      const response = await axios.post(
        "https://task-kq94.onrender.com/api/documents/upload-file",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedPath = response?.data?.path;
      if (!uploadedPath) {
        throw new Error("Upload succeeded but no document URL was returned.");
      }

      // save to MongoDB
      await axios.patch(
        `https://task-kq94.onrender.com/api/documents/update/${user._id}`,
        { documentUrl: uploadedPath },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // show in UI
      setDocuments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          url: uploadedPath,
          name: uploadedPath.split("/").pop(),
        },
      ]);

      Alert.alert(
        t("taskerDocuments.uploadedTitle"),
        t("taskerDocuments.uploadedMessage")
      );
    } catch (err) {
      console.error("❌ Upload error:", err.response?.data || err.message);
      Alert.alert(
        t("taskerDocuments.uploadFailedTitle"),
        t("taskerDocuments.uploadFailedMessage")
      );
    } finally {
      setUploading(false);
    }
  };

  // ---------- UPDATED: show source options ----------
  const uploadDocument = async () => {
    Alert.alert(
      t("taskerDocuments.chooseSourceTitle"),
      t("taskerDocuments.chooseSourceMessage"),
      [
        {
          text: t("taskerDocuments.takePhoto"),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                t("taskerDocuments.permissionDenied"),
                t("taskerDocuments.cameraDeniedMsg")
              );
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              allowsEditing: false,
              quality: 0.9,
            });
            if (res.canceled || !res.assets?.length) return;

            const asset = res.assets[0];
            // Fallbacks: some platforms may not return name/mimeType
            await confirmThenUpload({
              uri: asset.uri,
              name: asset.fileName || `photo-${Date.now()}.jpg`,
              type: asset.mimeType || "image/jpeg",
            });
          },
        },
        {
          text: t("taskerDocuments.chooseFromLibrary"),
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                t("taskerDocuments.permissionDenied"),
                t("taskerDocuments.libraryDeniedMsg")
              );
              return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 0.9,
            });
            if (res.canceled || !res.assets?.length) return;

            const asset = res.assets[0];
            await confirmThenUpload({
              uri: asset.uri,
              name: asset.fileName || `image-${Date.now()}.jpg`,
              type: asset.mimeType || "image/jpeg",
            });
          },
        },
        {
          text: t("taskerDocuments.uploadAFile"),
          onPress: async () => {
            try {
              const res = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
              });
              if (res.canceled || !res.assets?.length) return;

              const file = res.assets[0];
              await confirmThenUpload({
                uri: file.uri,
                name: file.name || `upload-${Date.now()}`,
                type: file.mimeType || getMimeType(file.name || ""),
              });
            } catch (e) {
              console.error("❌ Picker error:", e.message);
            }
          },
        },
        { text: t("taskerDocuments.no"), style: "cancel" },
      ]
    );
  };

  // ---------- NEW: confirmation wrapper ----------
  const confirmThenUpload = async ({ uri, name, type }) => {
    Alert.alert(
      t("taskerDocuments.confirmTitle"),
      t("taskerDocuments.confirmMessage"),
      [
        { text: t("taskerDocuments.no"), style: "cancel" },
        {
          text: t("taskerDocuments.yes"),
          onPress: () => doUpload({ uri, name, type }),
        },
      ]
    );
  };

  const fetchDocuments = async () => {
    try {
      const user = await fetchCurrentUser();
      setDocuments(
        (user.documents || []).map((doc, index) => ({
          id: index.toString(),
          url: doc,
          name: doc ? doc.split("/").pop() : "unknown",
        }))
      );
    } catch (err) {
      console.error("❌ Error fetching documents:", err.message);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const deleteDocument = async (doc) => {
    try {
      const user = await fetchCurrentUser();
      const token = await getToken();

      Alert.alert(
        t("taskerDocuments.deleteConfirmTitle"),
        t("taskerDocuments.deleteConfirmMessage"),
        [
          { text: t("taskerDocuments.no"), style: "cancel" },
          {
            text: t("taskerDocuments.yes"),
            style: "destructive",
            onPress: async () => {
              await axios.delete(
                `https://task-kq94.onrender.com/api/documents/delete/${user._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  data: { fileName: doc.name, documentUrl: doc.url },
                }
              );
              setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
            },
          },
        ]
      );
    } catch (err) {
      console.error("❌ Error deleting document:", err.response?.data || err.message);
      Alert.alert(
        t("taskerDocuments.deleteFailedTitle"),
        t("taskerDocuments.deleteFailedMessage")
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back only */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            if (fromRegister) {
              navigation.reset({
                index: 0,
                routes: [{ name: "CompleteTaskerProfile" }],
              });
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backBtn}
        >
          <Ionicons
            name={"arrow-back"}
            size={30}
            color="#215433"
          />
        </TouchableOpacity>
      </View>

      {/* Title + description */}
      <Text style={styles.finalTitle}>{t("taskerDocuments.finalTitle")}</Text>
      <Text style={styles.finalDesc}>{t("taskerDocuments.finalDesc")}</Text>
      <Text style={styles.cprRequirement}>{t("taskerDocuments.cprRequirement")}</Text>

      {/* Document List */}
      {documents.length > 0 ? (
        documents.map((doc) => (
          <View key={doc.id} style={styles.card}>
            <MaterialCommunityIcons
              name={
                doc.name?.toLowerCase()?.endsWith(".pdf")
                  ? "file-pdf-box"
                  : doc.name?.toLowerCase()?.endsWith(".jpg") ||
                    doc.name?.toLowerCase()?.endsWith(".jpeg") ||
                    doc.name?.toLowerCase()?.endsWith(".png") ||
                    doc.name?.toLowerCase()?.endsWith(".heic")
                  ? "file-image"
                  : "file-document-outline"
              }
              size={22}
              color="#215432"
            />
            <Text style={styles.docName}>{doc.name}</Text>

            {/* DELETE BUTTON */}
            <TouchableOpacity onPress={() => deleteDocument(doc)} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <TouchableOpacity style={styles.uploadBox} onPress={uploadDocument}>
          <Ionicons name="cloud-upload-outline" size={40} color="#999" />
          <Text style={styles.uploadBoxText}>
            {t("taskerDocuments.uploadDocument")}
          </Text>
        </TouchableOpacity>
      )}

      {/* Upload */}
      <TouchableOpacity style={styles.button} onPress={uploadDocument}>
        <Text style={styles.buttonText}>{t("taskerDocuments.uploadBtn")}</Text>
      </TouchableOpacity>

      {fromRegister && documents.length > 0 && (
        <TouchableOpacity
          style={[styles.button, { marginTop: 20 }]}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "TaskerHome" }],
            })
          }
        >
          <Text style={styles.buttonText}>
            {t("taskerDocuments.continueToHome")}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 60 }} />

      {uploading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              paddingVertical: 20,
              paddingHorizontal: 30,
              borderRadius: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#215433" }}>
              {t("taskerDocuments.uploading")}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "rgba(248, 246, 247)",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backBtn: {
    padding: 4,
    borderRadius: 50,
    marginTop: 10,
  },
  headerText: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#215433",
    textAlign: "center",
    flex: 1,
  },
  card: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    gap: 12,
    justifyContent: "space-between",
  },
  docName: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 15,
    color: "#215433",
    textAlign: I18nManager.isRTL ? "right" : "left",
    marginHorizontal: 8,
  },
  empty: {
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    marginTop: 60,
  },
  button: {
    backgroundColor: "#215433",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 0,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
  finalTitle: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#215433",
    marginBottom: 6,
    marginTop: 10,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  finalDesc: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  uploadBox: {
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
    paddingVertical: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  uploadBoxText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  cprRequirement: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
    lineHeight: 22,
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
    backgroundColor: "#e8f4ec",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: I18nManager.isRTL ? 0 : 4,
    borderRightWidth: I18nManager.isRTL ? 4 : 0,
    borderColor: "#215433",
  },
});
