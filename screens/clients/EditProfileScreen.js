import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { fetchCurrentUser, updateUserProfile } from "../../services/auth";
import CountryPicker from "react-native-country-picker-modal";



import * as SecureStore from "expo-secure-store";


export default function EditProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [callingCode, setCallingCode] = useState("+966");
  const [rawPhone, setRawPhone] = useState("");

    


  // Load current user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await fetchCurrentUser();
        setName(user.name || "");
        setEmail(user.email || "");
        if (user.callingCode && user.rawPhone) {
          setCallingCode(user.callingCode);
          setRawPhone(user.rawPhone);
          setCountryCode(user.countryCode || "SA");
        } else if (user.phone) {
          const match = user.phone.match(/^\+(\d{1,4})(.*)$/);
          if (match) {
            setCallingCode("+" + match[1]);
            setRawPhone(match[2].trim());
            setCountryCode("SA"); // fallback
          }
        }
        
      } catch (err) {
        Alert.alert("Error", "Failed to load user info");
      }
    };
    loadUser();
  }, []);
  
  
  

  const handleUpdate = async () => {
    try {
      await updateUserProfile({
        name,
        email,
        phone: `${callingCode}${rawPhone.trim()}`,
        countryCode,
        callingCode,
        rawPhone: rawPhone.trim(),
      });
      
      await SecureStore.setItemAsync("userName", name); // ✅ Store the updated name
      Alert.alert("Success", "Profile updated");
      navigation.goBack(); // ✅ Make sure this is here to return to the home screen
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    }
  };
  
  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons
              name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color="#213729"
            />
          </TouchableOpacity>
          <Text style={styles.title}>{t("clientEditProfile.title")}</Text>
          <View style={{ width: 24 }} />
        </View>
  
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          textAlign={I18nManager.isRTL ? "right" : "left"}
          maxLength={50}
        />
  
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textAlign={I18nManager.isRTL ? "right" : "left"}
        />

<View style={styles.phoneContainer}>
  <View style={styles.countryCodeInput}>
    <CountryPicker
      countryCode={countryCode}
      withFilter
      withFlag
      withCallingCodeButton
      withCountryNameButton={false} // ✅ hides country name
      withEmoji
      onSelect={(country) => {
        setCountryCode(country.cca2);
        setCallingCode("+" + country.callingCode[0]);
      }}
    />
  </View>
  <TextInput
    style={styles.phoneInput}
    value={rawPhone}
    onChangeText={setRawPhone}
    keyboardType="phone-pad"
    placeholder={t("register.phone")}
    placeholderTextColor="#999"
  />
</View>



  
        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>{t("clientEditProfile.save")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}  
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 60,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    marginBottom: 30,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#213729",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  wrapper: {
    flex: 1,
    backgroundColor: "#ffffff", // 🔥 fixes full screen background
  },
  phoneContainer: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  countryCodeInput: {
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "#e0e0e0",
  },
  
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
  },
  
  
});
