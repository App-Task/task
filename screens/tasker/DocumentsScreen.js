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

export default function DocumentsScreen({ navigation }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);

  const uploadDocument = async () => {
    try {
      const user = await fetchCurrentUser();
      const token = await getToken();
  
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
  
      if (result.canceled || !result.assets?.length) return;
  
      const file = result.assets[0];
  
      console.log("📂 Picked file:", file);
  
      const formData = new FormData();
      formData.append("userId", user._id);
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name || `upload-${Date.now()}`,
      });
  
      console.log("📦 FormData prepared");
  
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
  
      console.log("✅ Upload response:", response.data);
  
      setDocuments((prev) => [
        ...prev,
        { id: Date.now().toString(), name: file.name },
      ]);
  
      Alert.alert(
        t("taskerDocuments.uploadedTitle"),
        t("taskerDocuments.uploadedMessage")
      );
    } catch (err) {
      console.error("❌ Upload error:", err.response?.data || err.message);
      Alert.alert("Upload Failed", "Could not upload document. Please try again.");
    }
  };


  const fetchDocuments = async () => {
    try {
      const user = await fetchCurrentUser();
      setDocuments(
        (user.documents || []).map((doc, index) => ({
          id: index.toString(),
          name: doc.split("/").pop(), // get just the file name
        }))
      );
    } catch (err) {
      console.error("❌ Error fetching documents:", err.message);
    }
  };
  
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  

  const deleteDocument = async (id, name) => {
    try {
      const user = await fetchCurrentUser();
      const token = await getToken();
  
      await axios.delete(
        `https://task-kq94.onrender.com/api/documents/delete/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { fileName: name }, // ✅ send fileName here
        }
      );
  
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      console.error("❌ Error deleting document:", err.response?.data || err.message);
      Alert.alert("Delete Failed", "Could not delete document.");
    }
  };
  
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#213729"
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t("taskerDocuments.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Document List */}
      {documents.length > 0 ? (
        documents.map((doc) => (
          <View key={doc.id} style={styles.card}>
            <MaterialCommunityIcons
              name={
                doc.name.endsWith(".pdf")
                  ? "file-pdf-box"
                  : doc.name.endsWith(".jpg") || doc.name.endsWith(".png")
                  ? "file-image"
                  : "file-document-outline"
              }
              size={22}
              color="#215432"
            />
            <Text style={styles.docName}>{doc.name}</Text>
            <TouchableOpacity onPress={() => deleteDocument(doc.id, doc.name)}>
              <Ionicons name="trash-outline" size={20} color="#999" />
            </TouchableOpacity>

          </View>
        ))
      ) : (
        <Text style={styles.empty}>{t("taskerDocuments.empty")}</Text>
      )}

      {/* Upload */}
      <TouchableOpacity style={styles.button} onPress={uploadDocument}>
        <Text style={styles.buttonText}>{t("taskerDocuments.uploadBtn")}</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
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
  },
  headerText: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
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
    color: "#213729",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  empty: {
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    marginTop: 60,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
});
