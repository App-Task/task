import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getTaskById, updateTaskById, deleteTaskById } from "../../services/taskService";
import { useIsFocused } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";



const { width } = Dimensions.get("window");

export default function TaskDetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { task: initialTask } = route.params;
  const [task, setTask] = useState(initialTask);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); // 👈 tracks when screen comes into focus
  const [bids, setBids] = useState([]);
  const [completing, setCompleting] = useState(false);
const [canceling, setCanceling] = useState(false);
const [previewImage, setPreviewImage] = useState(null);





  useEffect(() => {
    if (isFocused) {
      fetchTask();
    }
  }, [isFocused]);
  

  const fetchTask = async () => {
    try {
      const freshTask = await getTaskById(initialTask._id);
      setTask(freshTask);
      
  
      // 👇 Fetch latest bids
      const res = await fetch(`https://task-kq94.onrender.com/api/bids/task/${initialTask._id}`);
      const bidData = await res.json();
      setBids(bidData);
    } catch (err) {
      console.error("❌ Task fetch failed:", err.message);
      Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.loadTaskError"));
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    console.log("🟡 [Cancel Flow] User pressed 'Cancel Task'");
  
    Alert.alert(
      t("clientTaskDetails.cancelTaskConfirmTitle"),
      t("clientTaskDetails.cancelTaskConfirmMessage"),
      [
        {
          text: t("clientTaskDetails.no"),
          onPress: () => console.log("🟡 [Cancel Flow] Cancel aborted by user"),
        },
        {
          text: t("clientTaskDetails.yes"),
          onPress: () => {
            console.log("🟡 [Cancel Flow] User confirmed cancellation");
  
            SecureStore.getItemAsync("userId").then(async (clientId) => {
              console.log("🔍 Retrieved userId:", clientId);
  
              if (!clientId) {
                Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.userIdNotFound"));
                console.log("❌ No userId in SecureStore, cannot proceed");
                return;
              }
  
              try {
                setCanceling(true); // ✅ Show popup overlay
  
                const cancelPayload = { cancelledBy: clientId };
                console.log("📦 Sending cancel request with payload:", cancelPayload);
  
                const res = await fetch(
                  `https://task-kq94.onrender.com/api/tasks/${task._id}/cancel`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(cancelPayload),
                  }
                );
  
                const resultText = await res.text();
                console.log("📨 Server responded with:", res.status, resultText);
  
                if (!res.ok) {
                  console.log("❌ Cancel request failed");
                  throw new Error("Failed to cancel task");
                }
  
                setCanceling(false); // ✅ Hide popup
  
                Alert.alert(t("clientTaskDetails.taskCancelled"));
                console.log("✅ Task cancelled successfully, navigating back to task list");
  
                navigation.navigate("ClientHome", {
                  screen: "Tasks",
                  params: {
                    refreshTasks: true,
                    targetTab: "Previous",
                    subTab: "Cancelled",
                    unique: Date.now(),
                  },
                });
                
                
              } catch (err) {
                setCanceling(false); // ✅ Hide on error
                console.log("❌ Error during cancel request:", err.message);
                Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.cancelTaskError"));
              }
            });
          },
        },
      ]
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return { backgroundColor: "#4CAF50" }; // Green
      case "Pending":
        return { backgroundColor: "#FF9800" }; // Orange
      case "Started":
        return { backgroundColor: "#FFEB3B" }; // Yellow
      case "Cancelled":
        return { backgroundColor: "#F44336" }; // Red
      default:
        return { backgroundColor: "#999" }; // Grey fallback
    }
  };
  
  
// comment
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#213729" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const { title, description, location, budget, images = [] } = task;

  

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <TouchableOpacity
          style={[styles.backBtn, I18nManager.isRTL && { alignSelf: "flex-end" }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={30}
            color="#213729"
          />
        </TouchableOpacity>

<View style={styles.topContent}>
  <View style={styles.topRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subText}>{t("clientTaskDetails.offeredPrice")}: {budget} BHD</Text>
      <Text style={styles.subText}>
        {new Date(task.createdAt).toLocaleDateString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}{" "}
        • {new Date(task.createdAt).toLocaleTimeString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>

    <View style={[styles.statusBadge, getStatusStyle(task.status)]}>
      <Text style={styles.statusText}>{t(`clientHome.status.${task.status.toLowerCase()}`)}</Text>
    </View>
  </View>
</View>




<View style={styles.detailsBox}>
  <Text style={styles.detailsText}>
    <Text style={{ fontFamily: "InterBold" }}>{t("clientTaskDetails.description")}: </Text>
    {description}
  </Text>

  <Text style={[styles.detailsText, { marginTop: 12, fontFamily: "InterBold" }]}>
    {t("clientTaskDetails.images")}:
  </Text>
  <View style={styles.imageRow}>
  {images.length > 0 ? (
    images.map((img, index) => (
      <TouchableOpacity key={index} onPress={() => setPreviewImage(img)}>
        <Image source={{ uri: img }} style={styles.image} />
      </TouchableOpacity>
    ))
  ) : (
    <Text style={styles.detailsText}>{t("clientTaskDetails.noImages")}</Text>
  )}
</View>


  <Text style={[styles.detailsText, { marginTop: 12 }]}>
    <Text style={{ fontFamily: "InterBold" }}>{t("clientTaskDetails.location")}: </Text>
    {location}
  </Text>

  <Text style={[styles.detailsText, { marginTop: 12 }]}>
    <Text style={{ fontFamily: "InterBold" }}>{t("clientTaskDetails.category")}: </Text>
    {task.category || t("clientTaskDetails.notProvided")}
  </Text>

  <Text style={[styles.detailsText, { marginTop: 12 }]}>
    <Text style={{ fontFamily: "InterBold" }}>{t("clientTaskDetails.bidCount")}: </Text>
    {task.bidCount}
  </Text>

  <Text style={[styles.detailsText, { marginTop: 12 }]}>
    <Text style={{ fontFamily: "InterBold" }}>{t("clientTaskDetails.createdAt")}: </Text>
    {new Date(task.createdAt).toLocaleDateString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}
  </Text>

  {/* Actions (now inside the green box) */}
<View style={styles.actionsInside}>
  {task.status === "Pending" && (
    <>
      {bids.length > 0 ? (
        <Text style={styles.noticeInside}>
          {t("clientTaskDetails.editNotAllowed")}
        </Text>
      ) : (
        <TouchableOpacity
          style={styles.whiteButton}
          onPress={() => navigation.navigate("EditTask", { task })}
        >
          <Text style={styles.whiteButtonText}>{t("clientTaskDetails.editTask")}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.whiteButton}
        onPress={() => navigation.navigate("ViewBids", { taskId: task._id })}
      >
        <Text style={styles.whiteButtonText}>{t("clientTaskDetails.viewBids")}</Text>
      </TouchableOpacity>
    </>
  )}

  {task.status === "Started" && (
    <TouchableOpacity
      style={styles.whiteButton}
      onPress={() => {
        Alert.alert(
          t("clientTaskDetails.markCompletedConfirmTitle"),
          t("clientTaskDetails.markCompletedConfirmMessage"),
          [
            { text: t("clientTaskDetails.no") },
            {
              text: t("clientTaskDetails.yes"),
              onPress: async () => {
                try {
                  setCompleting(true);
                  await fetch(`https://task-kq94.onrender.com/api/tasks/${task._id}/complete`, {
                    method: "PATCH",
                  });
                  const updated = await getTaskById(task._id);
                  setCompleting(false);
                  navigation.navigate("ClientHome", {
                    screen: "Tasks",
                    params: {
                      refreshTasks: true,
                      targetTab: "Previous",
                      subTab: "Completed",
                      unique: Date.now(),
                    },
                  });
                } catch (err) {
                  setCompleting(false);
                  Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.markCompletedError"));
                }
              },
            },
          ]
        );
      }}
    >
      <Text style={styles.whiteButtonText}>{t("clientTaskDetails.markCompleted")}</Text>
    </TouchableOpacity>
  )}

  {(task.status === "Pending" || task.status === "Started") && (
    <TouchableOpacity style={styles.whiteButton} onPress={handleDelete}>
      <Text style={styles.whiteButtonText}>{t("clientTaskDetails.cancelTask")}</Text>
    </TouchableOpacity>
  )}
</View>


</View>

        
{previewImage && (
  <View style={styles.previewOverlay}>
    <TouchableOpacity
      style={styles.closePreviewBtn}
      onPress={() => setPreviewImage(null)}
    >
      <Ionicons name="close" size={30} color="#fff" />
    </TouchableOpacity>
    <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
  </View>
)}


      </ScrollView>

      {/* Loading overlays */}
      {completing && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#213729" style={{ marginBottom: 10 }} />
            <Text style={styles.overlayText}>{t("clientTaskDetails.completingTask")}</Text>
          </View>
        </View>
      )}

      {canceling && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#213729" style={{ marginBottom: 10 }} />
            <Text style={styles.overlayText}>{t("clientTaskDetails.cancelingTask")}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    paddingTop: 40,
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 16,
    
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 30,
    color: "#213729",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    color: "#215432"
  },
  imageRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    marginTop: 6,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: I18nManager.isRTL ? 0 : 8,
    marginLeft: I18nManager.isRTL ? 8 : 0,
  },
  
  label: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432",
    marginBottom: 4,
    marginTop: 12,
  },
  text: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    marginBottom: 10,
    lineHeight: 22,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  priceBox: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "center",
  },
  priceLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215432",
  },
  price: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#213729",
    marginTop: 6,
  },
  actions: {
    marginTop: 40,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#c1ff72",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#213729",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  notice: {
    marginBottom: 16,
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    fontFamily: "Inter",
  },

  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  overlayBox: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  overlayText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
  },
  subText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    fontWeight: "900",
    marginBottom: 2,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: I18nManager.isRTL ? "flex-end" : "flex-start",         // ✅ keeps it aligned at the top
  },
  statusText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 13,
  },
  detailsBox: {
    backgroundColor: "#215432",
    padding: 16,
    borderRadius: 20,
    marginTop: 16,
    flex: 1,                    // ✅ makes it fill all remaining space
    minHeight: Dimensions.get("window").height * 0.65,
    justifyContent: "space-between", // ✅ pushes buttons to the bottom
  },
  
  
  
  detailsText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  topContent: {
    marginTop: 10,
    marginBottom: 16,
  },
  actionsInside: {
    marginTop: 20,
  },
  whiteButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  whiteButtonText: {
    color: "#215432", // dark green
    fontFamily: "InterBold",
    fontSize: 15,
  },
  noticeInside: {
    marginBottom: 10,
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
    fontFamily: "Inter",
  },
  topRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",           // ✅ puts text and badge on same row
    justifyContent: "space-between", // ✅ pushes badge to the far right
    alignItems: "flex-start",
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  previewImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
  closePreviewBtn: {
    position: "absolute",
    top: 40,
    left: I18nManager.isRTL ? undefined : 20,
    right: I18nManager.isRTL ? 20 : undefined,
    zIndex: 1001,
  },
  

});
