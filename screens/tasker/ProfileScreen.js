import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function TaskerProfileScreen({ navigation }) {
  const { t } = useTranslation();

  const user = {
    name: "Yosuf Al Awadi",
    email: "yosuf@example.com",
  };

  const handleLogout = () => {
    alert(t("profilee.loggedOut"));
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>YA</Text>
      </View>

      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.rowText}>{t("profilee.edit")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("Documents")}
        >
          <Text style={styles.rowText}>{t("profilee.documents")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("BankAccount")}
        >
          <Text style={styles.rowText}>{t("profilee.bank")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("Payments")}
        >
          <Text style={styles.rowText}>{t("profilee.payments")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("Reviews")}
        >
          <Text style={styles.rowText}>{t("profilee.reviews")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.rowText}>{t("profilee.settings")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rowItem, styles.logoutRow]}
          onPress={handleLogout}
        >
          <Text style={[styles.rowText, styles.logoutText]}>{t("profilee.logout")}</Text>
          <Ionicons name="log-out-outline" size={20} color="#213729" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
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
