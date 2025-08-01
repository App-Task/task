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
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";



export default function DocumentsScreen({ navigation, route }) {
  const fromRegister = route?.params?.fromRegister || false; // 👈 Detect if came from registration
  const { t } = useTranslation();
  const getMimeType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'pdf': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  };
  
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  

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
  
      // 👇 Confirmation alert
      Alert.alert(
        t("taskerDocuments.confirmTitle"),
        t("taskerDocuments.confirmMessage"),
        [
          {
            text: t("taskerDocuments.no"),
            style: "cancel",
          },
          {
            text: t("taskerDocuments.yes"),
            onPress: async () => {
              setUploading(true); // show loading popup
  
              try {
                const formData = new FormData();
                formData.append("userId", user._id);
                const fileUri = file.uri;
                const fileInfo = await FileSystem.getInfoAsync(fileUri);
                if (!fileInfo.exists) throw new Error("File not found");
  
                const fileBlob = {
                  uri: fileUri,
                  name: file.name || `upload-${Date.now()}`,
                  type: file.mimeType || getMimeType(file.name),
                };
  
                formData.append("file", fileBlob); // ✅ must match uploadCloud.single("file")

                const response = await axios.post(
                  "https://task-kq94.onrender.com/api/documents/upload-file", // ✅ correct route
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
                  console.error("❌ Upload succeeded but response is missing 'path':", response.data);
                  throw new Error("Upload succeeded but no document URL was returned.");
                }
                
                // ✅ Save to MongoDB via PATCH
                await axios.patch(
                  `https://task-kq94.onrender.com/api/documents/update/${user._id}`,
                  { documentUrl: uploadedPath },
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                
                // ✅ Show in UI
                setDocuments((prev) => [
                  ...prev,
                  { id: Date.now().toString(), name: uploadedPath.split("/").pop() },
                ]);
                

  
                Alert.alert(
                  t("taskerDocuments.uploadedTitle"),
                  t("taskerDocuments.uploadedMessage")
                );
              } catch (err) {
                console.error("❌ Upload error:", err.response?.data || err.message);
                Alert.alert("Upload Failed", "Could not upload document. Please try again.");
              } finally {
                setUploading(false); // hide loading popup
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error("❌ Picker error:", err.message);
    }
  };
  

  const fetchDocuments = async () => {
    try {
      const user = await fetchCurrentUser();
      setDocuments(
        (user.documents || []).map((doc, index) => ({
          id: index.toString(),
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
    {/* Back Button Only */}
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
      name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
      size={30}
      color="#213729"
    />
  </TouchableOpacity>
</View>

{/* Title + Description BELOW the arrow */}
<Text style={styles.finalTitle}>Final Check!</Text>
<Text style={styles.finalDesc}>
  For verification, please upload your CPR. This keeps your account and our platform secure.
</Text>



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
            {/* <TouchableOpacity onPress={() => deleteDocument(doc.id, doc.name)}>
  <Ionicons name="trash-outline" size={20} color="#999" />
</TouchableOpacity> */}


          </View>
        ))
      ) : (
        <TouchableOpacity style={styles.uploadBox} onPress={uploadDocument}>
  <Ionicons name="cloud-upload-outline" size={40} color="#999" />
  <Text style={styles.uploadBoxText}>Upload Document</Text>
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
    <Text style={styles.buttonText}>Continue to Home</Text>
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
      <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#213729" }}>
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
    borderRadius: 50,
    marginTop: 10,
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
    marginTop: 0, // no extra top margin, spacing handled by uploadBox
  },
  
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
  finalTitle: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 6,
    marginTop: 10,

  },
  finalDesc: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10, // adds consistent space before the upload box
  },
  
  uploadBox: {
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
    paddingVertical: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30, // increased spacing from title
    marginBottom: 40, // added space before submit button
  },
  
  uploadBoxText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  
});
