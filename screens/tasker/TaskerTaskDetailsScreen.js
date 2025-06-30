import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  I18nManager,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons"; // ✅ icon package
import { useNavigation } from "@react-navigation/native"; // ✅ for back navigation
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth"; // or your actual path


const { width } = Dimensions.get("window");

export default function TaskDetailsScreen({ route }) {
  const { task } = route.params;
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");

  const handleBid = async () => {
    if (!bidAmount || !message) {
      Alert.alert(t("taskerTaskDetails.errorTitle"), t("taskerTaskDetails.fillFields"));
      return;
    }
  
    try {
      const user = await fetchCurrentUser();
  
      const res = await axios.post("https://task-kq94.onrender.com/api/bids", {
        taskId: task._id,
        taskerId: user._id,
        amount: Number(bidAmount),
        message,
      });
  
      console.log("✅ Bid response:", res.data);
  
      Alert.alert(
        t("taskerTaskDetails.successTitle"),
        t("taskerTaskDetails.bidSent"),
        [{ text: "OK", onPress: () => navigation.goBack() }] // ✅ Go back after alert dismiss
      );
  
      setBidAmount("");
      setMessage("");
    } catch (err) {
      console.error("❌ Bid error:", err.message);
      Alert.alert("Error", "Something went wrong while submitting the bid.");
    }
  };
  
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#213729" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        {task.images?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
            {task.images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
        )}

        <Text style={styles.title}>{task.title}</Text>

        <Text style={styles.label}>{t("taskerTaskDetails.location")}</Text>
        <Text style={styles.text}>{task.location}</Text>

        <Text style={styles.label}>{t("taskerTaskDetails.price")}</Text>
        <Text style={styles.text}>{task.budget} SAR</Text>

        <Text style={styles.label}>{t("taskerTaskDetails.enterBid")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("taskerTaskDetails.bidAmount")}
          value={bidAmount}
          onChangeText={setBidAmount}
          keyboardType="numeric"
          textAlign={I18nManager.isRTL ? "right" : "left"}
          placeholderTextColor="#999"
        />

        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={t("taskerTaskDetails.bidMessage")}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={150}
          textAlignVertical="top"
          textAlign={I18nManager.isRTL ? "right" : "left"}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.button} onPress={handleBid}>
          <Text style={styles.buttonText}>{t("taskerTaskDetails.submitBid")}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  backButton: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  container: {
    backgroundColor: "#ffffff",
    padding: 24,
    paddingBottom: 60,
  },
  imageRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  image: {
    width: width * 0.7,
    height: 160,
    borderRadius: 12,
    marginRight: 14,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  label: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432",
    marginBottom: 4,
    marginTop: 18,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  text: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginBottom: 16,
  },
  textarea: {
    height: 120,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
});
