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


export default function TaskerMyTasksScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [tasks, setTasks] = useState([]);
  const [taskerId, setTaskerId] = useState("");
  const navigation = useNavigation();
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);



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
  
        const url = `https://task-kq94.onrender.com/api/tasks/tasker/${user._id}?type=${tab}`;
        console.log("🔍 Fetching tasks from:", url);
  
        const res = await axios.get(url);
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
  

  const renderTask = ({ item }) => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.sub}>
        {t("taskerMyTasks.status")}: {t(`taskerMyTasks.statusTypes.${item.status.toLowerCase()}`)}
      </Text>

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
          style={[styles.btn, styles.secondaryBtn]}
          onPress={() => Alert.alert("Report", "Report client")}
        >
          <Text style={[styles.btnText, styles.secondaryText]}>{t("taskerMyTasks.report")}</Text>
        </TouchableOpacity>
        {tab === "active" && (
          <TouchableOpacity
            style={[styles.btn, styles.dangerBtn]}
            onPress={() => {
              Alert.alert(
                t("taskerMyTasks.cancel"),
                t("taskerMyTasks.confirmCancel"),
                [
                  {
                    text: t("taskerMyTasks.no"),
                    style: "cancel",
                  },
                  {
                    text: t("taskerMyTasks.yes"),
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const res = await axios.put(`https://task-kq94.onrender.com/api/tasks/${item._id}/cancel`);
                        if (res.status === 200) {
                          Alert.alert(t("taskerMyTasks.cancelledSuccess"));
                          setTasks((prev) => prev.filter((t) => t._id !== item._id));
                        }
                      } catch (err) {
                        console.error("❌ Cancel error:", err);
                        Alert.alert(t("taskerMyTasks.cancelFailed"), err.response?.data?.msg || "Error occurred");
                      }
                    },
                  },
                ]
              );
            }}
                      >
            <Text style={[styles.btnText, styles.dangerText]}>{t("taskerMyTasks.cancel")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setTab("active")} style={[styles.tab, tab === "active" && styles.activeTab]}>
          <Text style={[styles.tabText, tab === "active" && styles.activeTabText]}>
            {t("taskerMyTasks.active")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("past")} style={[styles.tab, tab === "past" && styles.activeTab]}>
          <Text style={[styles.tabText, tab === "past" && styles.activeTabText]}>
            {t("taskerMyTasks.past")}
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
  
});
