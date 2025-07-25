import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  Alert,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getToken } from "../../services/authStorage";
import CountryPicker from "react-native-country-picker-modal";
import { useNavigation } from "@react-navigation/native";

export default function CompleteTaskerProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [about, setAbout] = useState("");

  const [countryCode, setCountryCode] = useState("SA");
  const [callingCode, setCallingCode] = useState("+966");
  const [rawPhone, setRawPhone] = useState("");

  const handleSave = async () => {
    if (!name || !gender || !location || !experience || !skills || !about || !rawPhone) {
      Alert.alert("Incomplete Profile", "Please fill out all fields before continuing.");
      return;
    }

    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(rawPhone.trim())) {
      Alert.alert("Invalid Phone Number", "Phone number must be 8 to 15 digits and contain only numbers.");
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch("https://task-kq94.onrender.com/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          gender,
          location,
          experience,
          skills,
          about,
          phone: `${callingCode}${rawPhone.trim()}`,
          callingCode,
          rawPhone: rawPhone.trim(),
          countryCode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Profile Completed", "Your profile has been set up successfully.", [
            {
              text: "Continue",
              onPress: () =>
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "Documents",
                      params: { fromRegister: true }, // 👈 Pass this to identify newly registered taskers
                    },
                  ],
                }),
            },
          ]);
          
      } else {
        console.error("❌ Update failed:", data);
        Alert.alert("Error", data.msg || "Failed to complete profile.");
      }
    } catch (err) {
      console.error("❌ Error saving profile:", err.message);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Ionicons name="person-circle-outline" size={60} color="#213729" />
        <Text style={styles.header}>{t("taskerEditProfile.title") || "Complete Your Profile"}</Text>
      </View>

      <Text style={styles.subText}>
        For security and better matching with clients, you must complete your profile before continuing.
      </Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Full Name"
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <View style={styles.phoneContainer}>
        <View style={styles.countryPickerWrapper}>
          <CountryPicker
            countryCode={countryCode}
            withFilter
            withFlag
            withCallingCodeButton
            withCountryNameButton={false}
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
          placeholder="Phone Number"
          placeholderTextColor="#999"
        />
      </View>

      <TextInput
        style={styles.input}
        value={gender}
        onChangeText={setGender}
        placeholder="Gender"
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Location"
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        value={experience}
        onChangeText={setExperience}
        placeholder="Experience"
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        value={skills}
        onChangeText={setSkills}
        placeholder="Skills (comma separated)"
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />
      <TextInput
        style={[styles.input, styles.textarea]}
        value={about}
        onChangeText={setAbout}
        placeholder="About You"
        textAlign={I18nManager.isRTL ? "right" : "left"}
        textAlignVertical="top"
        placeholderTextColor="#999"
        multiline
        maxLength={150}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  headerRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    textAlign: "center",
    marginTop: 10,
  },
  subText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "Inter",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginBottom: 20,
  },
  textarea: {
    height: 100,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
  phoneContainer: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
  },
  countryPickerWrapper: {
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "#e0e0e0",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
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
