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
      await Asset.loadAsync(require("../../assets/images/21.png"));
      await Asset.loadAsync(require("../../assets/images/22.png"));
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
          source={i18n.language === "ar" ? require("../../assets/images/22.png") : require("../../assets/images/21.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.tagline}>{t("tagline")}</Text>




        <TouchableOpacity onPress={toggleLanguage} style={styles.langSwitch}>
          <View style={styles.langBadge}>
            <Ionicons name="globe-outline" size={18} color="#213729" style={{ marginRight: 6 }} />
            <Text style={styles.langSwitchText}>
              {i18n.language === "en" ? "العربية" : "English"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionsContainer}>
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => navigation.navigate("Login", { role: "client" })}
          >
            <Ionicons name="person-outline" size={36} color="#215432" />
            <Text style={styles.sectionTitle}>{t("role.client")}</Text>
            <Text style={styles.sectionDesc}>{t("clientDescription")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => navigation.navigate("Login", { role: "tasker" })}
          >
            <Ionicons name="construct-outline" size={36} color="#215432" />
            <Text style={styles.sectionTitle}>{t("role.tasker")}</Text>
            <Text style={styles.sectionDesc}>{t("taskerDescription")}</Text>
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
    justifyContent: "flex-start",
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  logo: {
    width: width * 1.2, // smaller logo like in design
    height: width * 1.2,
    marginBottom: -210,
  },
  
  title: {
    fontFamily: "InterBold",
    fontSize: 25,
    textAlign: "center",
    color: "#215432",
    marginBottom: 20,
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
  sectionsContainer: {
    width: "100%",
    gap: 20,
  },
  sectionCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    marginTop: 12,
    color: "#213729",
  },
  sectionDesc: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#215432",
    textAlign: "center",
    marginTop: 8,
  },

  tagline: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#215432",
    textAlign: "center",
    marginBottom: 25,
  },
});
