import React, { useState } from "react";
import CountryPicker, { CountryCode, Country } from "react-native-country-picker-modal";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  I18nManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { registerUser, loginUser } from "../../services/auth";
import * as SecureStore from "expo-secure-store";
import { storeToken } from "../../services/authStorage";




const { width } = Dimensions.get("window");

export default function RegisterScreen({ navigation, route }) {
  const { t } = useTranslation();
  const role = route?.params?.role || "client";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countryCode, setCountryCode] = useState("BH");
  const [callingCode, setCallingCode] = useState("+973");
  const [phone, setPhone] = useState("");
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const isRTL = i18n.language === "ar";



  const handleRegister = async () => {
    if (!name || !email || !countryCode || !phone || !password || !confirm) {
      Alert.alert(t("register.missingFields"), t("register.fillAllFields"));
      return;
    }
  
    if (password !== confirm) {
      Alert.alert(t("register.mismatchTitle"), t("register.passwordMismatch"));
      return;
    }

    // ✅ Password must contain at least one capital letter and one number
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
if (!strongPasswordRegex.test(password)) {
  Alert.alert(
    "Weak Password",
    "Password must contain at least one capital letter and one number."
  );
  return;
}
// ✅ Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email.trim())) {
  Alert.alert(t("common.invalidEmail"), t("common.pleaseEnterValidEmail"));
  return;
}

// ✅ Validate phone number format (8–15 digits, no letters/spaces)
const phoneRegex = /^[0-9]{8,15}$/;
if (!phoneRegex.test(phone.trim())) {
  Alert.alert(t("common.invalidPhoneNumber"), t("common.phoneNumberRequirements"));
  return;
}


    
  
    setIsRegistering(true); // ✅ show popup
  
    try {
      // Step 1: Register the user
  
      await registerUser({ 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password, 
        phone: `${callingCode}${phone.trim()}`, // full
        role,
        callingCode,
        rawPhone: phone.trim(),
        countryCode,
      });
      
      



    // Step 2: Log the user in immediately
    const loginResponse = await loginUser({ email: email.trim().toLowerCase(), password, role });


    const { token, user } = loginResponse;

    // Step 3: Store user info
    await storeToken(token);
    await SecureStore.setItemAsync("userId", user.id);
    await SecureStore.setItemAsync("userName", user.name);

    // Step 4: Navigate to the correct screen
navigation.reset({
  index: 0,
  routes: [
    {
      name:
        role === "tasker"
          ? "CompleteTaskerProfile" // 👈 NEW mandatory profile setup screen
          : "ClientHome",
    },
  ],
});
  } catch (err) {
    Alert.alert(t("common.errorTitle"), err.message || t("common.somethingWentWrong"));
  } finally {
    setIsRegistering(false); // ✅ hide popup
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrapper}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.topBar, { alignItems: I18nManager.isRTL ? "flex-end" : "flex-start" }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name={"arrow-back"} size={24} color="#215432" />
          </TouchableOpacity>
        </View>

        

        <Text style={[styles.title, { textAlign: I18nManager.isRTL ? "right" : "left" }]}>{t("register.title")}</Text>

        <TextInput
          style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
          placeholder={t("register.fullName")}
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          maxLength={55}
        />

        <TextInput
          style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
          placeholder={t("register.email")}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

<View style={[styles.phoneContainer, { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }]}>
  <View style={[styles.countryPickerWrapper, I18nManager.isRTL ? { borderLeftWidth: 1, borderLeftColor: "#ccc" } : { borderRightWidth: 1, borderRightColor: "#ccc" }]}>
  <CountryPicker
  countryCode={countryCode}
  withFilter
  withFlag
  withCallingCodeButton
  withCountryNameButton={false}
  withEmoji
  onSelect={(selectedCountry) => {
    setCountryCode(selectedCountry.cca2);
    setCallingCode("+" + selectedCountry.callingCode[0]);
  }}
/>

  </View>
  <TextInput
    style={[styles.phoneInput, { textAlign: isRTL ? "right" : "left" }]}
    value={phone}
    onChangeText={setPhone}
    keyboardType="phone-pad"
    placeholder={t("register.phone")}
    placeholderTextColor="#999"
  />
</View>




        <View style={[styles.passwordContainer, { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }]}>
          <TextInput
            style={[styles.passwordInput, { textAlign: isRTL ? "right" : "left" }]}
            placeholder={t("register.password")}
            placeholderTextColor="#999"
            secureTextEntry={secure1}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setSecure1(!secure1)}
            style={styles.eyeWrapper}
          >
            <Ionicons name={secure1 ? "eye-off" : "eye"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={[styles.passwordContainer, { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }]}>
          <TextInput
            style={[styles.passwordInput, { textAlign: isRTL ? "right" : "left" }]}
            placeholder={t("register.confirmPassword")}
            placeholderTextColor="#999"
            secureTextEntry={secure2}
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity
            onPress={() => setSecure2(!secure2)}
            style={styles.eyeWrapper}
          >
            <Ionicons name={secure2 ? "eye-off" : "eye"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={{ alignSelf: I18nManager.isRTL ? "flex-end" : "flex-start", marginBottom: 15 }}>
  <Text style={[styles.requirement, { textAlign: I18nManager.isRTL ? "right" : "left" }]}>• {t("register.passwordRequirement1")}</Text>
  <Text style={[styles.requirement, { textAlign: I18nManager.isRTL ? "right" : "left" }]}>• {t("register.passwordRequirement2")}</Text>
</View>

<Text style={styles.termsText}>
  {t("register.termsText")}{" "}
  <Text
    style={styles.linkText}
    onPress={() => navigation.navigate("TermsAndConditions")}
  >
    {t("register.terms")}
  </Text>{" "}
  {t("register.and")}{" "}
  <Text
    style={styles.linkText}
    onPress={() => navigation.navigate("PrivacyPolicy")}
  >
    {t("register.privacy")}
  </Text>
</Text>


        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>{t("register.registerBtn")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login", { role })}>
          <Text style={styles.loginRedirect}>
            {t("register.alreadyHave")} <Text style={styles.loginLink}>{t("register.loginLink")}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {isRegistering && (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingBox}>
      <Text style={styles.loadingText}>{t("register.registering", "Registering...")}</Text>
    </View>
  </View>
)}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
  },
  container: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  topBar: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 40,
    direction: "ltr",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: -30,
  },
  title: {
    fontSize: 22,
    fontFamily: "InterBold",
    color: "#215432",
    alignSelf: "flex-start",
    marginTop: 10,   // Push down below the back button
    marginBottom: 30,
  },
  input: {
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginBottom: 18,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 18,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  eyeWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: "#215432", // mild green
    paddingVertical: 16,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 25, // Add some space above the button
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  loginRedirect: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  loginLink: {
    color: "#215432",
    fontFamily: "InterBold",
  },

  phoneContainer: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 18,
    overflow: "hidden",
  },

  
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingBox: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    elevation: 4,
  },
  loadingText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
  },

  countryPickerWrapper: {
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "#e0e0e0",
  },

  termsContainer: {
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
  },

  termsText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    marginTop: 20,
  },
  linkText: {
    fontFamily: "InterBold",
    color: "#215432",
  },

  requirement: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#333",
    marginBottom: 2,
  },
  
  
  
});
