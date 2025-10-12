import "react-native-get-random-values";
import "./i18n/config";
import React, { useCallback, useEffect, useState } from "react";
import { View, I18nManager, Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";
import { useFonts } from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar"; 
import MainNavigator from "./navigation/MainNavigator";
import Toast from "react-native-toast-message";
import i18n from "./i18n/config";
import { useTranslation } from "react-i18next";


SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const { i18n: i18next } = useTranslation();

  const [fontsLoaded] = useFonts({
    Inter: require("./assets/fonts/Inter-Regular.ttf"),
    InterBold: require("./assets/fonts/Inter-Bold.ttf"),
    InterSemiBold: require("./assets/fonts/Inter-SemiBold.ttf"),
  });

  useEffect(() => {
    const ensureLayoutForLanguage = async (lang: string) => {
      const desiredRTL = lang === "ar";
      const isRTLNow = I18nManager.isRTL;
      I18nManager.allowRTL(true);
      I18nManager.swapLeftAndRightInRTL(true);

      if (desiredRTL !== isRTLNow) {
        const reloaded = (await SecureStore.getItemAsync("rtlReloaded")) === "true";
        if (!reloaded) {
          await SecureStore.setItemAsync("rtlReloaded", "true");
          I18nManager.forceRTL(desiredRTL);
          await SecureStore.setItemAsync("appRTL", JSON.stringify(desiredRTL));
          await Updates.reloadAsync();
          return false; // not ready yet, will reload
        }
        // Already reloaded once; avoid loop. Ask user to restart manually if still mismatched.
        return true;
      } else {
        // Clear the reload guard once things match
        await SecureStore.deleteItemAsync("rtlReloaded");
        await SecureStore.setItemAsync("appRTL", JSON.stringify(desiredRTL));
        return true;
      }
    };

    const initLanguageAndLayout = async () => {
      try {
        const savedLang = await SecureStore.getItemAsync("appLanguage");
        const lang = savedLang || i18n.language || "en";

        if (savedLang && i18n.language !== savedLang) {
          await i18n.changeLanguage(savedLang);
        }

        const ok = await ensureLayoutForLanguage(lang);
        if (!ok) return; // will reload

        setAppReady(true);
      } catch (err) {
        console.error("Language init error:", err);
        setAppReady(true);
      }
    };

    initLanguageAndLayout();
  }, []);

  useEffect(() => {
    const handleLanguageChange = async (lng: string) => {
      try {
        await SecureStore.setItemAsync("appLanguage", lng);
        await SecureStore.deleteItemAsync("rtlReloaded"); // allow one controlled reload if needed
        const desiredRTL = lng === "ar";
        const isRTLNow = I18nManager.isRTL;
        I18nManager.allowRTL(true);
        I18nManager.swapLeftAndRightInRTL(true);
        if (desiredRTL !== isRTLNow) {
          I18nManager.forceRTL(desiredRTL);
          await SecureStore.setItemAsync("appRTL", JSON.stringify(desiredRTL));
          await Updates.reloadAsync();
        }
      } catch (e) {
        // no-op
      }
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange as any);
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && appReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady]);

  if (!fontsLoaded || !appReady) return null;

  const isRTL = i18next.language === "ar";

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(248, 246, 247)", writingDirection: isRTL ? "rtl" : "ltr", direction: isRTL ? "rtl" : "ltr" }} onLayout={onLayoutRootView}>
      {/* ✅ Global status bar */}
      <StatusBar style="dark" backgroundColor="rgba(248, 246, 247)" />
      <NavigationContainer key={isRTL ? "rtl" : "ltr"}>
        <MainNavigator />
      </NavigationContainer>
      <Toast />
    </View>
  );
  
}
