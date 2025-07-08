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
      Alert.alert("Error", "Failed to load task.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    console.log("🟡 [Cancel Flow] User pressed 'Cancel Task'");
  
    Alert.alert(
      "Cancel Task",
      "Are you sure you want to cancel this task?",
      [
        { text: "No", onPress: () => console.log("🟡 [Cancel Flow] Cancel aborted by user") },
        {
          text: "Yes",
          onPress: () => {
            console.log("🟡 [Cancel Flow] User confirmed cancellation");
  
            SecureStore.getItemAsync("userId").then(async (clientId) => {
              console.log("🔍 Retrieved userId:", clientId);
  
              if (!clientId) {
                Alert.alert("Error", "User ID not found.");
                console.log("❌ No userId in SecureStore, cannot proceed");
                return;
              }
  
              try {
                const cancelPayload = { cancelledBy: clientId };
                console.log("📦 Sending cancel request with payload:", cancelPayload);
  
                const res = await fetch(`https://task-kq94.onrender.com/api/tasks/${task._id}/cancel`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(cancelPayload),
                });
  
                const resultText = await res.text();
                console.log("📨 Server responded with:", res.status, resultText);
  
                if (!res.ok) {
                  console.log("❌ Cancel request failed");
                  throw new Error("Failed to cancel task");
                }
  
                Alert.alert("Task Cancelled");
                console.log("✅ Task cancelled successfully, navigating back to task list");
  
                navigation.navigate("ClientHome", {
                  screen: "Tasks",
                  params: {
                    refreshTasks: true,
                    targetTab: "Cancelled",
                    unique: Date.now(),
                  },
                });
              } catch (err) {
                console.log("❌ Error during cancel request:", err.message);
                Alert.alert("Error", "Failed to cancel task.");
              }
            });
          },
        },
      ]
    );
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
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#213729" />
          </TouchableOpacity>
          <Text style={styles.heading} numberOfLines={1}>{title}</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Images */}
{/* Images */}
{images.length > 0 && (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
    {images.map((img, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => navigation.navigate("ImageViewer", { uri: img })}
      >
        <Image source={{ uri: img }} style={styles.image} />
      </TouchableOpacity>
    ))}
  </ScrollView>
)}


        {/* Description */}
        <Text style={styles.label}>{t("clientTaskDetails.description")}</Text>
        <Text style={styles.text}>{description}</Text>

        {/* Address */}
        <Text style={styles.label}>{t("clientTaskDetails.address")}</Text>
        <Text style={styles.text}>{location}</Text>

        {/* Category */}
        <Text style={styles.label}>{t("clientTaskDetails.category")}</Text>
        <Text style={styles.text}>{task.category || t("clientTaskDetails.notProvided")}</Text>

        {/* Status */}
        <Text style={styles.label}>{t("clientTaskDetails.status")}</Text>
        <Text style={styles.text}>{task.status}</Text>

        {/* Bid Count */}
        <Text style={styles.label}>{t("clientTaskDetails.bidCount")}</Text>
        <Text style={styles.text}>{task.bidCount}</Text>

        {/* Created At */}
        <Text style={styles.label}>{t("clientTaskDetails.createdAt")}</Text>
        <Text style={styles.text}>
          {new Date(task.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>


        {/* Price */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>{t("clientTaskDetails.offeredPrice")}</Text>
          <Text style={styles.price}>{budget} BHD</Text>
        </View>

        
{/* Actions */}
<View style={styles.actions}>
  {/* Show if task is Pending */}
  {task.status === "Pending" && (
  <>
    {bids.length > 0 ? (
      <Text style={styles.notice}>
        You can't edit this task because a tasker has already placed a bid.
      </Text>
    ) : (
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("EditTask", { task })}
      >
        <Text style={styles.buttonText}>{t("clientTaskDetails.editTask")}</Text>
      </TouchableOpacity>
    )}

    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate("ViewBids", { taskId: task._id })}
    >
      <Text style={styles.buttonText}>{t("clientTaskDetails.viewBids")}</Text>
    </TouchableOpacity>
  </>
)}


  {/* Show if task is Started */}
  {task.status === "Started" && (
  <TouchableOpacity
  style={styles.button}
  onPress={() => {
    Alert.alert(
      "Mark as Completed",
      "Are you sure you want to mark this task as completed?",
      [
        { text: "No" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await fetch(`https://task-kq94.onrender.com/api/tasks/${task._id}/complete`, {
                method: "PATCH",
              });
              const updated = await getTaskById(task._id);
              navigation.navigate("ClientHome", {
                screen: "Tasks",
                params: {
                  refreshTasks: true,
                  targetTab: "Cancelled",
                  unique: Date.now(), // 👈 ensures useEffect reruns
                },
              });
              
            } catch (err) {
              console.error("❌ Failed to complete task:", err.message);
              Alert.alert("Error", "Could not mark the task as completed.");
            }
          },
        },
      ]
    );
  }}
>
  <Text style={styles.buttonText}>Mark as Completed</Text>
</TouchableOpacity>

  )}

  {/* Cancel Task for Pending or Started */}
  {(task.status === "Pending" || task.status === "Started") && (
    <TouchableOpacity style={styles.secondaryButton} onPress={handleDelete}>
      <Text style={styles.secondaryButtonText}>{t("clientTaskDetails.cancelTask")}</Text>
    </TouchableOpacity>
  )}
</View>



      </ScrollView>
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
    justifyContent: "space-between",
    marginBottom: 24,
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#213729",
    textAlign: "center",
    flex: 1,
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  imageRow: {
    marginBottom: 20,
    paddingVertical: 4,
  },
  image: {
    width: 120,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
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
  
});
