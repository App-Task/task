import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { loginUser } from "../../services/auth";
import { storeToken } from "../../services/authStorage";
import * as SecureStore from "expo-secure-store";
import { fetchCurrentUser } from "../../services/auth";


const { width } = Dimensions.get("window");

export default function LoginScreen({ navigation, route }) {
  const { t } = useTranslation();
  const role = route?.params?.role || "client";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("login.missingTitle"), t("login.missingFields"));
      return;
    }
  
    setIsLoggingIn(true); // ✅ show popup
  
    try {
      const response = await loginUser({ email: email.trim().toLowerCase(), password, role });


      if (response?.token && response?.user) {
        console.log("✅ userId being saved:", response.user.id);
      
        if (response.user.id && String(response.user.id).length === 24) {
          await storeToken(response.token);
          console.log("🔥 JWT Token:", response.token);
      
          await SecureStore.setItemAsync("userId", String(response.user.id));
          await SecureStore.setItemAsync("userName", String(response.user.name));
          if (response.user.role !== role) {
            Alert.alert(
              t("login.failedTitle"),
              t("login.roleConflictMessage", { userRole: response.user.role, selectedRole: role })
            );
            setIsLoggingIn(false);
            return;
          }
          
          await SecureStore.setItemAsync("userRole", response.user.role);
          
        } else {
          console.warn("⚠️ Invalid userId format. Skipping SecureStore save.");
        }
      
        if (role === "tasker") {
          try {
            const currentUser = await fetchCurrentUser();
        
            // ✅ Check if profile is incomplete
            const profileIncomplete =
              !currentUser.gender ||
              !currentUser.location ||
              !currentUser.experience ||
              !currentUser.skills ||
              !currentUser.about;
        
            // ✅ Check if no documents uploaded
            const noDocuments = !currentUser.documents || currentUser.documents.length === 0;
        
            if (profileIncomplete) {
              navigation.replace("CompleteTaskerProfile");
            } else if (noDocuments) {
              navigation.replace("Documents", { fromRegister: true });
            } else {
              navigation.replace("TaskerHome");
            }
          } catch (err) {
            console.error("❌ Could not fetch user after login:", err.message);
            navigation.replace("TaskerHome"); // fallback
          }
        } else {
          navigation.replace("ClientHome");
        }
        
      }
       else {
        throw new Error(t("login.failedGeneric"));
      }
    } catch (err) {
      console.log("❌ Login Error:", err.message);
      if (err.response?.status === 403) {
        Alert.alert(
          t("login.failedTitle"),
          t("login.blockedAccount")
        );
      } else {
        // Map common backend error messages to translated versions
        const errorMessage = err.response?.data?.msg || err.message;
        let translatedError;
        
        if (errorMessage === "Invalid credentials") {
          translatedError = t("login.invalidCredentials");
        } else {
          translatedError = errorMessage || t("login.failedGeneric");
        }
        
        Alert.alert(
          t("login.failedTitle"),
          translatedError
        );
      }
      
    } finally {
      setIsLoggingIn(false); // ✅ hide popup
    }
    
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrapper}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={30} color="#215433" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{t("login.welcomeBack")}</Text>

        <TextInput
          style={styles.input}
          placeholder={t("login.email")}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t("login.password")}
            placeholderTextColor="#999"
            secureTextEntry={secure}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.eyeWrapper}>
            <Ionicons name={secure ? "eye-off" : "eye"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordRequest", { role })}>
  <Text style={styles.forgot}>{t("login.forgotPassword")}</Text>
</TouchableOpacity>



        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>{t("login.loginBtn")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register", { role })}>
          <Text style={styles.register}>
            {t("login.noAccount")}{" "}
            <Text style={styles.registerLink}>{t("login.registerLink")}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>


      {isLoggingIn && (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingBox}>
      <Text style={styles.loadingText}>{t("login.loggingIn")}</Text>
    </View>
  </View>
)}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#ffffff",
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
  },
  backBtn: {
    padding: 5,        // smaller padding so it looks like the image
    borderRadius: 50,  // rounded feel (optional)
    marginLeft: -10,    // move left to align with title
  },
  title: {
    fontSize: 22,
    fontFamily: "InterBold",
    color: "#215432",  // mild green as in design
    alignSelf: "flex-start",
    marginBottom: 40,
  },
  
  input: {
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
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
    borderRadius: 8,
    marginBottom: 10,
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
  forgot: {
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 13,
    color: "#666",
    marginBottom: 25,
    marginTop: 10,
  },
  button: {
    backgroundColor: "#215432", // mild green
    paddingVertical: 16,
    borderRadius: 30,           // already correct
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  register: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  registerLink: {
    color: "#215432",
    fontFamily: "InterBold",
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
  
});
