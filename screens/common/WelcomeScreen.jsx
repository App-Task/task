import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  I18nManager,
} from "react-native";
import { Asset } from "expo-asset";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const { width } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }) {
  const [ready, setReady] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const preload = async () => {
      await Asset.loadAsync(require("../../assets/images/1.png"));
      await requestPermissions();
      setReady(true);
    };
    preload();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== "granted") {
        Alert.alert("Location Access", "Location permission denied.");
      }

      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      if (notifStatus !== "granted") {
        Alert.alert("Notifications", "Notifications permission denied.");
      }
    } catch (err) {
      console.error("Permission error:", err);
    }
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    const isRTL = newLang === "ar";

    await i18n.changeLanguage(newLang);

    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      await Updates.reloadAsync();
    }
  };

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#213729" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/1.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>{t("welcome")}</Text>

      <TouchableOpacity onPress={toggleLanguage} style={styles.langSwitch}>
        <Text style={styles.langSwitchText}>
          🌐 {i18n.language === "en" ? "العربية" : "English"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.rolePrompt}>{t("chooseRole")}</Text>
      <View style={styles.roleButtons}>
        <TouchableOpacity
          style={styles.roleBtn}
          onPress={() => navigation.navigate("Login", { role: "client" })}
        >
          <Text style={styles.roleText}>{t("role.client")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleBtn}
          onPress={() => navigation.navigate("Login", { role: "tasker" })}
        >
          <Text style={styles.roleText}>{t("role.tasker")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 30,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 30,
    color: "#215432",
    marginBottom: 30,
  },
  brand: {
    fontFamily: "InterBold",
    fontSize: 42,
    color: "#213729",
    marginBottom: 6,
    letterSpacing: 1,
  },
  langSwitch: {
    marginBottom: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
  },
  langSwitchText: {
    fontFamily: "InterBold",
    fontSize: 14,
    color: "#213729",
  },
  rolePrompt: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#215432",
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  roleBtn: {
    backgroundColor: "#c1ff72",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  roleText: {
    fontFamily: "InterBold",
    color: "#213729",
    fontSize: 14,
  },
});
