import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  I18nManager,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp } from "react-native-reanimated";
import { StyleSheet } from "react-native";
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { getToken } from "../../services/authStorage"; // make sure this import exists




export default function TaskerMyTasksScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active"); // ⬅️ add "bidSent" as a possible value
  const [tasks, setTasks] = useState([]);
  const [taskerId, setTaskerId] = useState("");
  const navigation = useNavigation();
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [reportedTaskIds, setReportedTaskIds] = useState([]);
  const [reportingTaskId, setReportingTaskId] = useState(null);
  const [isReporting, setIsReporting] = useState(false);






  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const user = await fetchCurrentUser();
        setTaskerId(user._id);
  
        if (!user.isVerified) {
          setShowVerifyBanner(true);
          setTasks([]);
          setLoading(false);
          return;
        }
  
        setShowVerifyBanner(false); // ✅ hide if verified
  
        let url;
if (tab === "bidSent") {
  url = `https://task-kq94.onrender.com/api/bids/my-bids`;
} else {
  url = `https://task-kq94.onrender.com/api/tasks/tasker/${user._id}?type=${tab === "previous" ? "past" : tab}`;
}

        console.log("🔍 Fetching tasks from:", url);
  
        const token = await getToken(); // ✅ use AsyncStorage-based function
        console.log("🔐 Token from SecureStore:", token);

const res = await axios.get(url, {
  headers: { Authorization: `Bearer ${token}` },
});

        console.log("✅ Response data:", res.data);
        setTasks(res.data);
      } catch (err) {
        console.error("❌ Error fetching tasks:", err.message);
        if (err.response) {
          console.log("❌ Backend response error:", err.response.data);
          console.log("❌ Status code:", err.response.status);
        } else {
          console.log("❌ General error object:", err);
        }
        Alert.alert("Error", "Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };
  
    loadTasks();
  }, [tab]);
  
  const renderTask = ({ item }) => {
    console.log("🔍 Task:", item.title, "CancelledBy:", item.cancelledBy);
  
    const cancelledById =
      typeof item.cancelledBy === "object"
        ? item.cancelledBy?._id
        : item.cancelledBy;
  
    const cancelledByTasker =
      cancelledById && cancelledById.toString() === taskerId.toString();
  
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("TaskerTaskDetails", { task: item })
        }
      >
        <Animated.View entering={FadeInUp.duration(400)} style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>
  
          {/* Status Line */}
          <Text
            style={[
              styles.sub,
              item.status === "cancelled" && {
                color: "#c00",
                fontWeight: "bold",
              },
            ]}
          >
            {t("taskerMyTasks.status")}:{" "}
            {item.status === "cancelled"
              ? `Cancelled by ${cancelledByTasker ? "you" : "client"}`
              : t(`taskerMyTasks.statusTypes.${item.status.toLowerCase()}`)}
          </Text>

          {tab === "previous" &&
  item.status?.toLowerCase() === "cancelled" &&
  item.cancelledBy && (
    <Text style={styles.cancelText}>
       Cancelled by{" "}
      {typeof item.cancelledBy === "object"
        ? item.cancelledBy._id === taskerId
          ? "You"
          : "Client"
        : item.cancelledBy === taskerId
        ? "You"
        : "Client"}
    </Text>
)}

  
          {/* Cancelled Notice */}
          {item.status === "cancelled" && (
            <View
              style={{
                backgroundColor: "#ffe5e5",
                padding: 10,
                borderRadius: 8,
                borderColor: "#c00",
                borderWidth: 1,
                marginTop: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: "InterBold",
                  fontSize: 14,
                  color: "#c00",
                  textAlign: I18nManager.isRTL ? "right" : "left",
                }}
              >
                ❗ This task was cancelled by{" "}
                {cancelledByTasker
                  ? "you"
                  : item.cancelledBy?.name || "the client"}
              </Text>
            </View>
          )}
  
          {/* Action Buttons */}
          <View style={styles.actions}>
            {tab === "active" && (
              <TouchableOpacity
                style={styles.btn}
                onPress={() =>
                  navigation.navigate("Chat", {
                    name: item.user?.name || "Client",
                    otherUserId: item.user?._id || item.userId,
                  })
                }
              >
                <Text style={styles.btnText}>{t("taskerMyTasks.chat")}</Text>
              </TouchableOpacity>
            )}
  
  <TouchableOpacity
  style={[
    styles.btn,
    styles.secondaryBtn,
    reportedTaskIds.includes(item._id) && { opacity: 0.5 }
  ]}
  disabled={reportedTaskIds.includes(item._id) || reportingTaskId === item._id}
  onPress={() => {
    Alert.prompt(
      "Report Client",
      "Enter reason for reporting this client:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async (reason) => {
            try {
              setReportingTaskId(item._id);
              setIsReporting(true); // ✅ Start loading
            
              const token = await getToken();
              await axios.post("https://task-kq94.onrender.com/api/reports", {
                reporterId: taskerId,
                reportedUserId: item.user?._id || item.userId,
                reason,
                taskId: item._id,
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            
              setReportedTaskIds((prev) => [...prev, item._id]);
              Alert.alert("Reported", "Client has been reported successfully.");
            } catch (err) {
              console.error("❌ Report error:", err.message);
              Alert.alert("Error", "Failed to submit report.");
            } finally {
              setReportingTaskId(null);
              setIsReporting(false); // ✅ End loading
            }
            
          }
        }
      ],
      "plain-text"
    );
  }}
>
  <Text style={[styles.btnText, styles.secondaryText]}>
    {reportedTaskIds.includes(item._id) ? "Reported" : t("taskerMyTasks.report")}
  </Text>
</TouchableOpacity>

  
            {tab === "active" && (
              <TouchableOpacity
                style={[styles.btn, styles.dangerBtn]}
                onPress={() => {
                  Alert.alert("Are you sure you want to cancel?", "", [
                    { text: "No", style: "cancel" },
                    {
                      text: "Yes",
                      onPress: async () => {
                        try {
                          const res = await axios.put(
                            `https://task-kq94.onrender.com/api/tasks/${item._id}/cancel`,
                            { cancelledBy: taskerId },
                            {
                              headers: {
                                "Content-Type": "application/json",
                              },
                            }
                          );
  
                          if (res.status === 200) {
                            Alert.alert("Cancelled successfully");
                            setTasks((prev) =>
                              prev.filter((t) => t._id !== item._id)
                            );
                          }
                        } catch (err) {
                          console.error("❌ Cancel error:", err);
                          Alert.alert(
                            "Error",
                            err.response?.data?.msg || "Something went wrong."
                          );
                        }
                      },
                    },
                  ]);
                }}
              >
                <Text style={[styles.btnText, styles.dangerText]}>
                  {t("taskerMyTasks.cancel")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };
  
  

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setTab("active")} style={[styles.tab, tab === "active" && styles.activeTab]}>
          <Text style={[styles.tabText, tab === "active" && styles.activeTabText]}>
            {t("taskerMyTasks.active")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
  onPress={() => setTab("previous")}
  style={[styles.tab, tab === "previous" && styles.activeTab]}
>
  <Text style={[styles.tabText, tab === "previous" && styles.activeTabText]}>
    Previous
  </Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => setTab("bidSent")}
  style={[styles.tab, tab === "bidSent" && styles.activeTab]}
>
  <Text style={[styles.tabText, tab === "bidSent" && styles.activeTabText]}>
    {t("taskerMyTasks.bidSent")}
  </Text>
</TouchableOpacity>



      </View>

      {showVerifyBanner && (
  <View style={styles.verifyBanner}>
    <Text style={styles.verifyText}>You must be verified to view your tasks.</Text>
  </View>
)}


      {/* Task list */}
      {loading ? (
        <ActivityIndicator size="large" color="#213729" style={{ marginTop: 40 }} />
      ) : tasks.length === 0 ? (
        <Text style={styles.empty}>{t("taskerMyTasks.noTasks")}</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 60 }}
        />
      )}


{isReporting && (
  <View style={{
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  }}>
    <View style={{
      backgroundColor: "#fff",
      padding: 24,
      borderRadius: 16,
      alignItems: "center",
    }}>
      <ActivityIndicator size="large" color="#213729" />
      <Text style={{ fontFamily: "InterBold", marginTop: 10, color: "#213729" }}>
        Submitting Report...
      </Text>
    </View>
  </View>
)}

    </View>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "center",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginHorizontal: 10,
    backgroundColor: "#f0f0f0",
  },
  tabText: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#666",
  },
  activeTab: {
    backgroundColor: "#c1ff72",
  },
  activeTabText: {
    color: "#213729",
    fontFamily: "InterBold",
  },
  empty: {
    textAlign: "center",
    marginTop: 80,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#999",
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#213729",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  sub: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  actions: {
    marginTop: 12,
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    gap: 10,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#213729",
    borderRadius: 30,
    marginTop: 10,
  },
  btnText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#213729",
  },
  secondaryText: {
    color: "#213729",
  },
  dangerBtn: {
    backgroundColor: "#fff5f5",
    borderColor: "#ff5a5a",
    borderWidth: 1,
  },
  dangerText: {
    color: "#ff5a5a",
  },


  verifyBanner: {
    backgroundColor: "#fff4e6",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  verifyText: {
    color: "#FFA500",
    fontFamily: "InterBold",
    fontSize: 14,
    textAlign: "center",
  },
  cancelBox: {
    backgroundColor: "#fff0f0",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelText: {
    color: "#d00000",
    fontFamily: "InterBold",
    fontSize: 14,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  
  
});
