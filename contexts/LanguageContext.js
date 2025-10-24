import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { updateNotificationLanguage } from '../services/notificationService';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n, t } = useTranslation();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const changeLanguage = async (newLang) => {
    if (isChangingLanguage) return; // Prevent multiple simultaneous changes
    
    setIsChangingLanguage(true);
    
    try {
      const isRTL = newLang === "ar";

      // Update existing notifications to new language
      await updateNotificationLanguage(newLang);

      // Save language preference
      await SecureStore.setItemAsync("appLanguage", newLang);
      await SecureStore.setItemAsync("appRTL", JSON.stringify(isRTL));
      
      // Change language
      await i18n.changeLanguage(newLang);

      // Show success message
      Toast.show({
        type: "success",
        text1: newLang === "en" ? t("language.changedEn") : t("language.changedAr"),
        position: "bottom",
        visibilityTime: 2000,
      });

      // Show info about RTL layout
      setTimeout(() => {
        Toast.show({
          type: "info",
          text1: newLang === "ar" ? "تم تغيير اللغة إلى العربية" : "Language changed to English",
          text2: newLang === "ar" 
            ? "سيتم تطبيق التخطيط من اليمين إلى اليسار عند إعادة تشغيل التطبيق" 
            : "RTL layout will be applied on next app restart",
          position: "bottom",
          visibilityTime: 4000,
        });
      }, 2500);

      return true;
    } catch (error) {
      console.error("Language change error:", error);
      Toast.show({
        type: "error",
        text1: "خطأ في تغيير اللغة",
        text2: "Error changing language",
        position: "bottom",
        visibilityTime: 3000,
      });
      return false;
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    return await changeLanguage(newLang);
  };

  const value = {
    currentLanguage: i18n.language,
    isRTL: i18n.language === "ar",
    isChangingLanguage,
    changeLanguage,
    toggleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
