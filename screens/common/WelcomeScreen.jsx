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
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Asset } from "expo-asset";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageToggle from "../../components/LanguageToggle";

const { width } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }) {
  const [ready, setReady] = useState(false);
  const { t } = useTranslation();
  const { toggleLanguage, isChangingLanguage } = useLanguage();

  useEffect(() => {
    const preload = async () => {
      await Asset.loadAsync(require("../../assets/images/2.png"));
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
        Alert.alert(t("common.locationAccessTitle"), t("common.locationAccessDenied"));
      }

      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      if (notifStatus !== "granted") {
        Alert.alert(t("common.notificationsTitle"), t("common.notificationsDenied"));
      }
    } catch (err) {
      console.error("Permission error:", err);
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
      <View style={styles.container}>
            <View style={styles.logoContainer}>
        <Image
                source={i18n.language === "ar" ? require("../../assets/images/22.png") : require("../../assets/images/2.png")}
          style={styles.logo}
          resizeMode="contain"
        />
            </View>

        <Text style={styles.tagline}>{t("tagline")}</Text>

        <LanguageToggle style={styles.langSwitch} />

        <View style={styles.sectionsContainer}>
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => navigation.navigate("Login", { role: "client" })}
                activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={36} color="#215432" />
            <Text style={styles.sectionTitle}>{t("role.client")}</Text>
            <Text style={styles.sectionDesc}>{t("clientDescription")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => navigation.navigate("Login", { role: "tasker" })}
                activeOpacity={0.7}
          >
            <Ionicons name="construct-outline" size={36} color="#215432" />
            <Text style={styles.sectionTitle}>{t("role.tasker")}</Text>
            <Text style={styles.sectionDesc}>{t("taskerDescription")}</Text>
          </TouchableOpacity>
        </View>
      </View>
        </ScrollView>
      </SafeAreaView>

      {/* Language switching loading popup */}
      {isChangingLanguage && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#213729" />
            <Text style={styles.loadingText}>{t("language.switching")}</Text>
          </View>
        </View>
      )}

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
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "android" ? 20 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 30,
    paddingTop: Platform.OS === "android" ? 20 : 40,
    minHeight: "100%",
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Platform.OS === "android" ? 10 : 0,
    marginBottom: Platform.OS === "android" ? -40 : -50,
    overflow: "hidden",
  },
  logo: {
    width: width * 0.9,
    height: width * 0.9,
    maxWidth: 300,
    maxHeight: 300,
  },
  
  title: {
    fontFamily: "InterBold",
    fontSize: 25,
    textAlign: "center",
    color: "#215432",
    marginBottom: 20,
  },
  langSwitch: {
    marginBottom: Platform.OS === "android" ? 25 : 30,
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
    gap: Platform.OS === "android" ? 16 : 20,
    marginTop: Platform.OS === "android" ? 10 : 0,
    paddingBottom: Platform.OS === "android" ? 20 : 0,
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
    marginTop: Platform.OS === "android" ? 5 : 5,
    marginBottom: Platform.OS === "android" ? 20 : 30,
    paddingHorizontal: 10,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
  },
  loadingText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
    marginTop: 15,
    textAlign: "center",
  },
});
