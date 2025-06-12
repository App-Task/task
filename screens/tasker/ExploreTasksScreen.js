import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  I18nManager,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp } from "react-native-reanimated";
import axios from "axios";
import { getToken } from "../../services/authStorage"; // ✅ adjust path if needed

export default function ExploreTasksScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("https://task-kq94.onrender.com/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTasks(res.data);
    } catch (err) {
      console.error("❌ Error fetching tasks:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const renderTask = ({ item }) => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.card}>
      {item.images?.length > 0 && (
        <Image source={{ uri: item.images[0] }} style={styles.image} />
      )}

      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.sub}>
          {t("taskerExplore.location")}: {item.location}
        </Text>
        <Text style={styles.sub}>
          {t("taskerExplore.price")}: {item.budget} SAR
        </Text>
        <Text style={styles.sub}>
          {t("taskerExplore.bids")}: 0 {/* Replace with real bid count if available */}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("TaskerTaskDetails", { task: item })}
        >
          <Text style={styles.buttonText}>{t("taskerExplore.viewDetails")}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("taskerExplore.header")}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#213729" />
      ) : tasks.length === 0 ? (
        <Text style={styles.empty}>{t("taskerExplore.noTasks")}</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
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
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  empty: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 80,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 150,
  },
  info: {
    padding: 16,
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
    color: "#555",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#213729",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "InterBold",
    color: "#ffffff",
    fontSize: 14,
  },
});
