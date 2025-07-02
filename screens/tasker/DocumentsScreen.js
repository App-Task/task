import React, { useState } from "react";
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
import { fetchCurrentUser } from "../../services/auth"; // ✅ adjust path if needed
import { getToken } from "../../services/authStorage"; // ✅ adjust if needed

export default function DocumentsScreen({ navigation }) {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState([]);

  const uploadDocument = async () => {
    try {
      const user = await fetchCurrentUser();
      const token = await getToken();

      // Simulate uploading a new document
      const newDocName = `Document_${documents.length + 1}.pdf`;

      const res = await axios.post(
        "https://task-kq94.onrender.com/api/documents/upload",
        {
          userId: user._id,
          files: [newDocName], // later you can change this to actual file upload logic
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDocuments((prev) => [
        ...prev,
        { id: Date.now().toString(), name: newDocName },
      ]);
      Alert.alert(t("taskerDocuments.uploadedTitle"), t("taskerDocuments.uploadedMessage"));
    } catch (err) {
      console.error("❌ Upload error:", err.response?.data || err.message);
      Alert.alert("Upload Failed", "Could not upload document. Please try again.");
    }
  };

  const deleteDocument = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
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
            <TouchableOpacity onPress={() => deleteDocument(doc.id)}>
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
