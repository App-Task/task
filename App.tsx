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


SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter: require("./assets/fonts/Inter-Regular.ttf"),
    InterBold: require("./assets/fonts/Inter-Bold.ttf"),
    InterSemiBold: require("./assets/fonts/Inter-SemiBold.ttf"),
  });

  useEffect(() => {
    const initLanguageAndLayout = async () => {
      try {
        const savedLang = await SecureStore.getItemAsync("appLanguage");
        const savedRTL = await SecureStore.getItemAsync("appRTL");

        if (savedLang) {
          await i18n.changeLanguage(savedLang);
        }

        const shouldBeRTL = savedRTL === "true";
        const isRTLNow = I18nManager.isRTL;

        if (shouldBeRTL !== isRTLNow && !__DEV__) {
          I18nManager.forceRTL(shouldBeRTL);
          Updates.reloadAsync();
          return;
        }

        setAppReady(true);
      } catch (err) {
        console.error("Language init error:", err);
        setAppReady(true);
      }
    };

    initLanguageAndLayout();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && appReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady]);

  if (!fontsLoaded || !appReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {/* ✅ Global status bar */}
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
      <Toast />
    </View>
  );
  
}
