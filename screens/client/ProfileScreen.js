import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { fetchCurrentUser } from "../../services/auth"; // 👈 use same function

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const fetched = await fetchCurrentUser();
        setUser(fetched);
      } catch (err) {
        console.error("❌ Failed to load profile:", err.message);
      }
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logged Out", "You have been logged out.");
    // TODO: remove token + navigate to Login screen
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitials}>
          {user?.name ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() : "?"}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{user?.name || "Loading..."}</Text>
        <Text style={styles.email}>{user?.email || " "}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.buttonText, styles.logoutText]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  avatarPlaceholder: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 100,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontFamily: "InterBold",
    fontSize: 32,
    color: "#213729",
  },
  info: {
    alignItems: "center",
  },
  name: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#213729",
    marginBottom: 6,
  },
  email: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
  },
  buttonGroup: {
    width: "100%",
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
  logoutButton: {
    backgroundColor: "#c1ff72",
  },
  logoutText: {
    color: "#213729",
  },
});
