import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  I18nManager,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInRight } from "react-native-reanimated";
import { fetchCurrentUser } from "../../services/auth";

const { width } = Dimensions.get("window");

export default function ClientHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await fetchCurrentUser();
        setUserName(user.name);
  
        const res = await fetch("https://task-kq94.onrender.com/api/tasks");
        const data = await res.json();
  
        // Optionally filter tasks by user ID if needed later
        setTasks(data.reverse()); // show newest first
      } catch (err) {
        console.error("❌ Failed to fetch tasks:", err.message);
        Alert.alert("Error", "Could not load tasks.");
      } finally {
        setLoading(false);
      }
    };
  
    loadData();
  }, []);
  

  const renderTask = ({ item }) => (
    <Animated.View
      entering={FadeInRight.duration(500)}
      style={styles.taskItem}
    >
      <Text style={styles.taskTitle}>{item.title}</Text>
      <View
        style={[
          styles.badge,
          {
            backgroundColor:
              item.status === "Pending" ? "#c1ff72" : "#215432",
          },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            {
              color: item.status === "Pending" ? "#213729" : "#ffffff",
            },
          ]}
        >
          {t(`home.status.${item.status.toLowerCase()}`)}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.hello}>
        {t("home.greeting", { name: userName || t("home.defaultName") })}
      </Text>
      <Text style={styles.sub}>{t("home.subtitle")}</Text>

      {/* Add Task Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ClientHome", { screen: "Post" })}
      >
        <Text style={styles.buttonText}>+ {t("home.postTaskBtn")}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t("home.yourTasks")}</Text>

      {/* Loading State */}
      {loading ? (
        <ActivityIndicator color="#213729" size="large" />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}

          renderItem={renderTask}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t("home.noTasks")}</Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          style={{ width: "100%" }}
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
    paddingHorizontal: 24,
  },
  hello: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#213729",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  sub: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Inter",
    marginTop: 6,
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 30,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#213729",
    marginBottom: 10,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  taskItem: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitle: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "InterBold",
  },
  emptyText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
});
