import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  I18nManager,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import Modal from "react-native-modal";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp } from "react-native-reanimated";
import { StyleSheet } from "react-native";
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { getToken } from "../../services/authStorage"; // make sure this import exists
import { Linking } from "react-native";





export default function TaskerMyTasksScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active"); // ⬅️ add "bidSent" as a possible value
  const [tasks, setTasks] = useState([]);
  const [taskerId, setTaskerId] = useState("");
  const navigation = useNavigation();
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [reportingTaskId, setReportingTaskId] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportTask, setReportTask] = useState(null);






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
        Alert.alert(t("taskerMyTasks.errorTitle"), t("taskerMyTasks.loadError"));
      } finally {
        setLoading(false);
      }
    };
  
    loadTasks();
  }, [tab]);

  const submitReport = async () => {
    if (!reportReason.trim() || !reportTask) return;
    try {
      setIsReporting(true);
      const token = await getToken();
      await axios.post("https://task-kq94.onrender.com/api/reports", {
        reporterId: taskerId,
        reportedUserId: reportTask.user?._id || reportTask.userId,
        reason: reportReason,
        taskId: reportTask._id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsReporting(false);
      setShowReportModal(false);
      setReportReason("");
      setReportTask(null);
      
      Alert.alert(t("taskerMyTasks.reportedTitle"), t("taskerMyTasks.reportedMessage"));
    } catch (err) {
      setIsReporting(false);
      console.error("❌ Report error:", err.message);
      Alert.alert(t("taskerMyTasks.errorTitle"), t("taskerMyTasks.reportError"));
    }
  };
  
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
          <Text style={styles.dateText}>
  {new Date(item.createdAt).toLocaleDateString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}{" "}
  •{" "}
  {new Date(item.createdAt).toLocaleTimeString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}
</Text>

<View style={styles.cardDivider} />

<Text style={styles.title}>{item.title}</Text>

  
          {/* Status Line */}
          {tab === "previous" ? (
  <Text
    style={
      item.status?.toLowerCase() === "completed"
        ? styles.statusText
        : styles.cancelledText
    }
  >
    {item.status?.toLowerCase() === "completed"
      ? t("taskerMyTasks.completed")
      : `${item.cancelledBy?._id === taskerId ? t("taskerMyTasks.cancelledByYou") : t("taskerMyTasks.cancelledByClient")}`}
  </Text>
) : (
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
      ? `${cancelledByTasker ? t("taskerMyTasks.cancelledByYou") : t("taskerMyTasks.cancelledByClient")}`
      : t(`taskerMyTasks.statusTypes.${item.status.toLowerCase()}`)}
  </Text>
)}

  
          {/* Action Buttons */}

          <TouchableOpacity
  onPress={() =>
    navigation.navigate("TaskerTaskDetails", { task: item })
  }
>
  <Text style={styles.detailsLink}>{t("taskerMyTasks.viewDetails")}</Text>
</TouchableOpacity>


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
    tab === "bidSent" ? styles.reportSubtleBtn : styles.btn,
    styles.secondaryBtn,
  ]}
  disabled={reportingTaskId === item._id}
  onPress={() => {
    setReportTask(item);
    setShowReportModal(true);
  }}
>
  <Text style={[styles.btnText, styles.secondaryText]}>
    {t("taskerMyTasks.report")}
  </Text>
</TouchableOpacity>



  
            {tab === "active" && (
              <TouchableOpacity
                style={[styles.btn, styles.dangerBtn]}
                onPress={() => {
                  Alert.alert(t("taskerMyTasks.cancelConfirm"), "", [
                    { text: t("taskerMyTasks.no"), style: "cancel" },
                    {
                      text: t("taskerMyTasks.yes"),
                      onPress: async () => {
                        try {
                          setIsCancelling(true);
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
                            Alert.alert(t("taskerMyTasks.cancelSuccess"));
                            setTasks((prev) =>
                              prev.filter((t) => t._id !== item._id)
                            );
                          }
                        } catch (err) {
                          console.error("❌ Cancel error:", err);
                          Alert.alert(
                            t("taskerMyTasks.errorTitle"),
                            err.response?.data?.msg || t("taskerMyTasks.cancelError")
                          );
                        } finally {
                          setIsCancelling(false);
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
  <TouchableOpacity
    onPress={() => setTab("bidSent")}
    style={[styles.tab, tab === "bidSent" && styles.activeTab]}
  >
    <Text style={[styles.tabText, tab === "bidSent" && styles.activeTabText]}>
      {t("taskerMyTasks.bidSent")}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => setTab("active")}
    style={[styles.tab, tab === "active" && styles.activeTab]}
  >
    <Text style={[styles.tabText, tab === "active" && styles.activeTabText]}>
      {t("taskerMyTasks.active")}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => setTab("previous")}
    style={[styles.tab, tab === "previous" && styles.activeTab]}
  >
    <Text style={[styles.tabText, tab === "previous" && styles.activeTabText]}>
      {t("taskerMyTasks.previous")}
    </Text>
  </TouchableOpacity>
</View>


{showVerifyBanner && (
  <View style={styles.verifyBanner}>
    <Text style={styles.verifyText}>
      {t("taskerMyTasks.verifyPending")}{" "}
      <Text
        style={styles.contactLink}
        onPress={() =>
          Linking.openURL("mailto:support@taskbh.com")
        }
      >
        {t("taskerMyTasks.contactUs")}
      </Text>
    </Text>
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
        {t("taskerMyTasks.submittingReport")}
      </Text>
    </View>
  </View>
)}

{isCancelling && (
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
        {t("taskerMyTasks.cancelling")}
      </Text>
    </View>
  </View>
)}

      {/* Report Modal */}
      <Modal isVisible={showReportModal}>
        <View style={{ backgroundColor: "#fff", padding: 24, borderRadius: 20 }}>
          {isReporting ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#213729" style={{ marginBottom: 12 }} />
              <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#213729" }}>
                {t("taskerMyTasks.submittingReport", "Submitting report...")}
              </Text>
            </View>
          ) : (
            <>
              <Text style={{ fontFamily: "InterBold", fontSize: 18, color: "#213729", marginBottom: 12 }}>
                {t("taskerMyTasks.reportClient", "Report Client")}
              </Text>

              <Text style={{ fontFamily: "Inter", fontSize: 14, color: "#666", marginBottom: 16 }}>
                {t("taskerMyTasks.reportPrompt", "Please describe the issue with this client:")}
              </Text>

              <TextInput
                placeholder={t("taskerMyTasks.reportPlaceholder", "Describe the issue...")}
                placeholderTextColor="#999"
                value={reportReason}
                onChangeText={(text) => {
                  if (text.length <= 300) setReportReason(text);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  fontFamily: "Inter",
                  fontSize: 14,
                  color: "#333",
                  textAlignVertical: "top",
                  height: 80,
                }}
                multiline
                maxLength={300}
              />

              <Text style={{ fontFamily: "Inter", fontSize: 12, color: "#999", marginBottom: 20 }}>
                {reportReason.length}/300 characters
              </Text>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#f5f5f5",
                    paddingVertical: 12,
                    borderRadius: 30,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setShowReportModal(false);
                    setReportReason("");
                    setReportTask(null);
                  }}
                >
                  <Text style={{ color: "#666", fontFamily: "InterBold", fontSize: 16 }}>
                    {t("taskerMyTasks.reportCancel", "Cancel")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: reportReason.trim() ? "#213729" : "#ccc",
                    paddingVertical: 12,
                    borderRadius: 30,
                    alignItems: "center",
                  }}
                  onPress={submitReport}
                  disabled={!reportReason.trim()}
                >
                  <Text style={{ color: "#fff", fontFamily: "InterBold", fontSize: 16 }}>
                    {t("taskerMyTasks.reportSubmit", "Submit")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

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
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
  },
  tabText: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#000",
  },
  activeTab: {
    backgroundColor: "#213729", // dark green
  },
  activeTabText: {
    color: "#ffffff",
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
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dcdcdc",
    padding: 14,
    marginBottom: 14,
  },
  title: {
    fontFamily: "InterBold",
  fontSize: 16,
  color: "#000",
  marginBottom: 4,
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
  reportSubtleBtn: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
    borderRadius: 20,
  },
  dateText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#777",
    marginBottom: 6,
  },
  statusText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#215432", // mild green for "Completed"
  },
  cancelledText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#c00", // red for cancelled
  },
  detailsLink: {
    fontFamily: "InterBold",
    fontSize: 13,
    color: "#000",
    textDecorationLine: "underline",
    marginTop: 4,
  },
  cardDivider: {
    height: 2,
    backgroundColor: "#e0e0e0", // light grey line
    marginBottom: 8,
  },
  contactLink: {
    color: "blue",
    textDecorationLine: "underline",
  },
  
  
  
});
