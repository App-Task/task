import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

const fakeTasks = {
  Pending: [
    { id: "1", title: "Fix Kitchen Tap", price: 100 },
    { id: "2", title: "Move Furniture", price: 250 },
  ],
  Started: [
    { id: "3", title: "Paint Living Room", price: 400 },
  ],
  Completed: [],
};

export default function MyTasksScreen({ navigation }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Pending");

  const renderTask = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("TaskDetails", { task: item })}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPrice}>{item.price} SAR</Text>
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
            style={[
              styles.tab,
              activeTab === tabKey && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tabKey)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tabKey && styles.activeTabText,
              ]}
            >
              {t(`mytasks.${tabKey.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <FlatList
        data={fakeTasks[activeTab]}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t("mytasks.noTasks", { status: t(`mytasks.${activeTab.toLowerCase()}`) })}
          </Text>
        }
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 40,
        }}
      />
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
