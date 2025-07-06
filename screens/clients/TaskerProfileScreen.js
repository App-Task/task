import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";

export default function TaskerProfileScreen({ route }) {
  const { taskerId } = route.params;
  const [tasker, setTasker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasker = async () => {
      try {
        const res = await axios.get(`https://task-kq94.onrender.com/api/users/${taskerId}`);
        setTasker(res.data);
      } catch (err) {
        console.error("❌ Error loading tasker:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasker();
  }, [taskerId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#213729" style={{ marginTop: 40 }} />;
  }

  if (!tasker) {
    return <Text style={styles.error}>Failed to load tasker profile.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {tasker.profileImage ? (
        <Image source={{ uri: tasker.profileImage }} style={styles.image} />
      ) : null}

      <Text style={styles.name}>{tasker.name}</Text>

      <Text style={styles.label}>Location</Text>
      <Text style={styles.value}>{tasker.location || "Not provided"}</Text>

      <Text style={styles.label}>Experience</Text>
      <Text style={styles.value}>{tasker.experience || "Not provided"}</Text>

      <Text style={styles.label}>Skills</Text>
      <Text style={styles.value}>{tasker.skills || "Not provided"}</Text>

      <Text style={styles.label}>About</Text>
      <Text style={styles.value}>{tasker.about || "Not provided"}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#ffffff",
    minHeight: "100%",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontFamily: "InterBold",
    textAlign: "center",
    marginBottom: 20,
    color: "#213729",
  },
  label: {
    fontSize: 16,
    fontFamily: "InterBold",
    marginTop: 12,
    color: "#555",
  },
  value: {
    fontSize: 15,
    fontFamily: "Inter",
    color: "#333",
    marginTop: 4,
  },
  error: {
    textAlign: "center",
    marginTop: 50,
    color: "red",
    fontSize: 16,
  },
});
