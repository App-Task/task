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
      <Text style={styles.brand}>TASK</Text>

      <TouchableOpacity onPress={toggleLanguage} style={styles.langSwitch}>
        <Text style={styles.langSwitchText}>
          🌐 {i18n.language === "en" ? "العربية" : "English"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonText}>{t("login.loginBtn")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={[styles.buttonText, styles.secondaryText]}>
          {t("register.registerBtn")}
        </Text>
      </TouchableOpacity>
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
    fontFamily: "Inter",
    fontSize: 24,
    color: "#215432",
    marginBottom: 5,
  },
  brand: {
    fontFamily: "InterBold",
    fontSize: 42,
    color: "#213729",
    marginBottom: 20,
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
  button: {
    backgroundColor: "#213729",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#213729",
  },
  secondaryText: {
    color: "#213729",
  },
});
