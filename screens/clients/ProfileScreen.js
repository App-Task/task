import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();

  const user = {
    name: "Yosuf Al Awadi",
    email: "yosuf@example.com",
  };

  const handleLogout = () => {
    Alert.alert(t("profile.logoutAlertTitle"), t("profile.logoutAlertMessage"));
    // TODO: remove token + navigate to Login screen
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitials}>YA</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("EditProfile")}>
          <Text style={styles.rowText}>{t("profile.editProfile")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("ChangePassword")}>
          <Text style={styles.rowText}>{t("profile.changePassword")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("MyPayments")}>
          <Text style={styles.rowText}>{t("profile.myPayments")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("PaymentMethods")}>
          <Text style={styles.rowText}>{t("profile.paymentMethods")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("profile.aboutUs")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("profile.privacyPolicy")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("profile.terms")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("profile.faqs")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("profile.contactAdmin")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.rowItem, styles.logoutRow]} onPress={handleLogout}>
          <Text style={[styles.rowText, styles.logoutText]}>{t("profile.logout")}</Text>
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
