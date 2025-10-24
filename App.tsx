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
import { LanguageProvider } from "./contexts/LanguageContext";


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
      
      // Always allow RTL support
      I18nManager.allowRTL(true);
      I18nManager.swapLeftAndRightInRTL(true);

      // Save the desired RTL state
      await SecureStore.setItemAsync("appRTL", JSON.stringify(desiredRTL));
      
      // Only apply RTL if it matches the current state to avoid crashes
      if (desiredRTL === isRTLNow) {
        // Clear any reload flags since we're in sync
        await SecureStore.deleteItemAsync("rtlReloaded");
        return true;
      } else {
        // RTL state doesn't match, but don't force it to prevent crashes
        // The user will see the language change, and RTL will be applied on next restart
        console.log(`RTL state mismatch (desired: ${desiredRTL}, current: ${isRTLNow}). Will apply on next restart.`);
        return true; // Allow the app to continue without crashing
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

  // Removed the language change handler that was causing restarts
  // Language changes are now handled entirely by LanguageContext

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && appReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady]);

  if (!fontsLoaded || !appReady) return null;

  const isRTL = i18next.language === "ar";

  return (
    <LanguageProvider>
      <View style={{ flex: 1, backgroundColor: "rgba(248, 246, 247)", writingDirection: isRTL ? "rtl" : "ltr", direction: isRTL ? "rtl" : "ltr" }} onLayout={onLayoutRootView}>
        {/* ✅ Global status bar */}
        <StatusBar style="dark" backgroundColor="rgba(248, 246, 247)" />
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
        <Toast />
      </View>
    </LanguageProvider>
  );
  
}
