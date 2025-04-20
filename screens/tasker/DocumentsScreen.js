import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

export default function DocumentsScreen() {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState([
    { id: "1", name: "ID Card.pdf" },
    { id: "2", name: "Work Permit.jpg" },
  ]);

  const uploadDocument = () => {
    // Placeholder: replace with real file picker
    Alert.alert(t("documents.uploadedTitle"), t("documents.uploadedMessage"));
    setDocuments((prev) => [
      ...prev,
      { id: Date.now().toString(), name: `New Document ${prev.length + 1}.pdf` },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t("documents.title")}</Text>

      {documents.map((doc) => (
        <View key={doc.id} style={styles.card}>
          <Ionicons name="document-outline" size={20} color="#215432" />
          <Text style={styles.docName}>{doc.name}</Text>
        </View>
      ))}

      {documents.length === 0 && (
        <Text style={styles.empty}>{t("documents.empty")}</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={uploadDocument}>
        <Text style={styles.buttonText}>{t("documents.uploadBtn")}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 30,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  card: {
    backgroundColor: "#f1f1f1",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: 10,
  },
  docName: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#213729",
    flexShrink: 1,
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
