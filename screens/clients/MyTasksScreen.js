import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get("window");

export default function MyTasksScreen({ navigation }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Pending");
  const [groupedTasks, setGroupedTasks] = useState({
    Pending: [],
    Started: [],
    Completed: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const userId = await SecureStore.getItemAsync("userId");
        if (!userId) throw new Error("No user ID");

        const res = await fetch(`https://task-kq94.onrender.com/api/tasks/user/${userId}`);
        const allTasks = await res.json();

        // Group tasks by status
        const grouped = { Pending: [], Started: [], Completed: [] };
        allTasks.forEach((task) => {
          if (grouped[task.status]) {
            grouped[task.status].push(task);
          }
        });

        setGroupedTasks(grouped);
      } catch (err) {
        console.error("❌ Failed to fetch tasks:", err.message);
        Alert.alert("Error", t("clientMyTasks.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const renderTask = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("TaskDetails", { task: item })}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPrice}>{item.budget} SAR</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {["Pending", "Started", "Completed"].map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            style={[styles.tab, activeTab === tabKey && styles.activeTab]}
            onPress={() => setActiveTab(tabKey)}
          >
            <Text style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}>
              {t(`clientMyTasks.${tabKey.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      {loading ? (
        <ActivityIndicator size="large" color="#213729" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={groupedTasks[activeTab]}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {t("clientMyTasks.noTasks", {
                status: t(`clientMyTasks.${activeTab.toLowerCase()}`),
              })}
            </Text>
          }
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    padding: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: "#213729",
  },
  tabText: {
    fontFamily: "Inter",
    color: "#213729",
    fontSize: 14,
  },
  activeTabText: {
    color: "#ffffff",
    fontFamily: "InterBold",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
    marginBottom: 6,
  },
  cardPrice: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215432",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontFamily: "Inter",
    marginTop: 60,
  },
});
