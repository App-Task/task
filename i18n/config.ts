import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";

// ✅ Adjusted for your structure
import en from "./locales/en.json";
import ar from "./locales/ar.json";

// Async language detector using SecureStore
const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const storedLang = await SecureStore.getItemAsync("appLanguage");
      if (storedLang) {
        callback(storedLang);
      } else {
        const bestLang = Localization.locale.startsWith("ar") ? "ar" : "en";
        callback(bestLang);
      }
    } catch (err) {
      console.warn("Failed to detect language:", err);
      callback("en");
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    await SecureStore.setItemAsync("appLanguage", lng);
  },
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
