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
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.buttonText}>{t("profile.editProfile")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("ChangePassword")}
        >
          <Text style={styles.buttonText}>{t("profile.changePassword")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("MyPayments")}
        >
          <Text style={styles.buttonText}>{t("profile.myPayments")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("PaymentMethods")}
        >
          <Text style={styles.buttonText}>{t("profile.paymentMethods")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>{t("profile.aboutUs")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>{t("profile.privacyPolicy")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>{t("profile.terms")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>{t("profile.faqs")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>{t("profile.contactAdmin")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.buttonText, styles.logoutText]}>
            {t("profile.logout")}
          </Text>
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
