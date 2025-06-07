import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { removeToken } from "../../services/authStorage";
import { useNavigation } from "@react-navigation/native";
import { fetchCurrentUser } from "../../services/auth";

const { width } = Dimensions.get("window");

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const nav = useNavigation();
  const [user, setUser] = useState({ name: "", email: "" });

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
      Alert.alert(t("clientProfile.logoutAlertTitle"), t("clientProfile.logoutAlertMessage"));
      nav.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitials}>
          {user?.name
            ? user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : "?"}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{user.name || "Loading..."}</Text>
        <Text style={styles.email}>{user.email || " "}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("EditProfile")}>
          <Text style={styles.rowText}>{t("clientProfile.editProfile")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("ChangePassword")}>
          <Text style={styles.rowText}>{t("clientProfile.changePassword")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("MyPayments")}>
          <Text style={styles.rowText}>{t("clientProfile.myPayments")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("PaymentMethods")}>
          <Text style={styles.rowText}>{t("clientProfile.paymentMethods")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("clientProfile.aboutUs")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("clientProfile.privacyPolicy")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("clientProfile.terms")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("clientProfile.faqs")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("clientProfile.contactAdmin")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.rowItem, styles.logoutRow]} onPress={handleLogout}>
          <Text style={[styles.rowText, styles.logoutText]}>{t("clientProfile.logout")}</Text>
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
  avatarPlaceholder: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 100,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarInitials: {
    fontFamily: "InterBold",
    fontSize: 32,
    color: "#213729",
  },
  info: {
    alignItems: "center",
    marginBottom: 30,
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
