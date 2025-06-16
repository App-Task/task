import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  I18nManager,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { fetchCurrentUser } from "../../services/auth";
import { removeToken } from "../../services/authStorage";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function TaskerProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const [user, setUser] = useState({ name: "", email: "" });
  const nav = useNavigation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const fetched = await fetchCurrentUser();
        setUser(fetched);
      } catch (err) {
        console.error("❌ Failed to load user:", err.message);
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await removeToken();
      Alert.alert(t("taskerProfile.loggedOut"));
      nav.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{getInitials(user.name)}</Text>
      </View>

      <Text style={styles.name}>{user.name || "Loading..."}</Text>
      <Text style={styles.email}>{user.email || " "}</Text>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.rowText}>{t("taskerProfile.edit")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
  style={styles.rowItem}
  onPress={() => navigation.navigate("ChangePassword")}
>
  <Text style={styles.rowText}>Change Password</Text>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>


        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("Documents")}
        >
          <Text style={styles.rowText}>{t("taskerProfile.documents")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("BankAccount")}
        >
          <Text style={styles.rowText}>{t("taskerProfile.bank")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("MyPayments")}
        >
          <Text style={styles.rowText}>{t("taskerProfile.payments")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("Reviews")}
        >
          <Text style={styles.rowText}>{t("taskerProfile.reviews")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.rowText}>{t("taskerProfile.settings")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rowItem, styles.logoutRow]}
          onPress={handleLogout}
        >
          <Text style={[styles.rowText, styles.logoutText]}>
            {t("taskerProfile.logout")}
          </Text>
          <Ionicons name="log-out-outline" size={20} color="#213729" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  avatar: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: "#c1ff72",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  initials: {
    fontSize: 28,
    fontFamily: "InterBold",
    color: "#213729",
  },
  name: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 6,
  },
  email: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
  },
  buttonGroup: {
    width: "100%",
  },
  rowItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 10,
  },
  rowText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
  },
  logoutRow: {
    backgroundColor: "#c1ff72",
  },
  logoutText: {
    fontFamily: "InterBold",
    color: "#213729",
  },
});
