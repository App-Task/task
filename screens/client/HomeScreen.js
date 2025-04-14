import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const sampleTasks = [
  { id: "1", title: "Fix my sink", status: "Pending" },
  { id: "2", title: "Grocery pickup", status: "In Progress" },
];

export default function ClientHomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Greeting */}
      <Text style={styles.hello}>Hi Yosuf 👋</Text>
      <Text style={styles.sub}>What do you need help with today?</Text>

      {/* Post Task Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("PostTask")}
      >
        <Text style={styles.buttonText}>+ Post a Task</Text>
      </TouchableOpacity>

      {/* Task Preview */}
      <Text style={styles.sectionTitle}>Your Tasks</Text>
      <FlatList
        data={sampleTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
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
                {item.status}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks yet. Let's post one!</Text>
        }
        style={{ marginTop: 10 }}
      />
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
  },
  sub: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Inter",
    marginTop: 6,
    marginBottom: 20,
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
  },
  taskItem: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  taskTitle: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: "InterBold",
    fontSize: 12,
  },
  emptyText: {
    fontFamily: "Inter",
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
});
