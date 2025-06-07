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
  I18nManager,
  Platform,
} from "react-native";
import { Asset } from "expo-asset";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

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

    await SecureStore.setItemAsync("appLanguage", newLang);
    await SecureStore.setItemAsync("appRTL", JSON.stringify(isRTL));
    await i18n.changeLanguage(newLang);

    Toast.show({
      type: "success",
      text1: newLang === "en" ? t("language.changedEn") : t("language.changedAr"),
      position: "bottom",
      visibilityTime: 2000,
    });

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
    <>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/1.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>{t("welcome")}</Text>

        <TouchableOpacity onPress={toggleLanguage} style={styles.langSwitch}>
          <View style={styles.langBadge}>
            <Ionicons name="globe-outline" size={18} color="#213729" style={{ marginRight: 6 }} />
            <Text style={styles.langSwitchText}>
              {i18n.language === "en" ? "العربية" : "English"}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.rolePrompt}>{t("chooseRole")}</Text>

        <View style={styles.roleButtons}>
          <TouchableOpacity
            style={[styles.roleBtn, { marginRight: 12 }]}
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

      <Toast />
    </>
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
  langSwitch: {
    marginBottom: 30,
    borderRadius: 30,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  langBadge: {
    flexDirection: "row",
    alignItems: "center",
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
