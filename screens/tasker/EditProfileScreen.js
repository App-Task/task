import React, { useState, useEffect } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { getToken } from "../../services/authStorage";

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [about, setAbout] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await fetch("https://task-kq94.onrender.com/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setName(data.name || "");
          setEmail(data.email || "");
          setGender(data.gender || "");
          setLocation(data.location || "");
          setExperience(data.experience || "");
          setSkills(data.skills || "");
          setAbout(data.about || "");
        } else {
          console.error("❌ Failed to fetch profile:", data.msg);
        }
      } catch (err) {
        console.error("❌ Error loading profile:", err.message);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
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
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert(t("taskerEditProfile.savedTitle"), t("taskerEditProfile.savedMessage"), [
          {
            text: "OK",
            onPress: () => navigation.goBack(), // ✅ navigate back after save
          },
        ]);
      } else {
        console.error("❌ Update failed:", data);
        Alert.alert("Error", data.msg || "Failed to update profile.");
      }
    } catch (err) {
      console.error("❌ Error saving profile:", err.message);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ✅ Top Back Button */}
      <View style={styles.headerRow}>
  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={24} color="#213729" />
  </TouchableOpacity>
  <Text style={styles.header}>{t("taskerEditProfile.title")}</Text>
</View>



      {/* Inputs */}
      <TextInput
  style={styles.input}
  value={name}
  onChangeText={setName}
  placeholder={t("taskerEditProfile.name") || "Name"}
  textAlign={I18nManager.isRTL ? "right" : "left"}
  placeholderTextColor="#999"
  maxLength={50} // ✅ add this line
/>

      <TextInput style={styles.input} value={email} editable={false} placeholder={t("taskerEditProfile.email") || "Email"} textAlign={I18nManager.isRTL ? "right" : "left"} placeholderTextColor="#999" />
      <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder={t("taskerEditProfile.gender") || "Gender"} textAlign={I18nManager.isRTL ? "right" : "left"} placeholderTextColor="#999" />
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder={t("taskerEditProfile.location") || "Location"} textAlign={I18nManager.isRTL ? "right" : "left"} placeholderTextColor="#999" />
      <TextInput style={styles.input} value={experience} onChangeText={setExperience} placeholder={t("taskerEditProfile.experience") || "Experience"} textAlign={I18nManager.isRTL ? "right" : "left"} placeholderTextColor="#999" />
      <TextInput style={styles.input} value={skills} onChangeText={setSkills} placeholder={t("taskerEditProfile.skills") || "Skills"} textAlign={I18nManager.isRTL ? "right" : "left"} placeholderTextColor="#999" />
      <TextInput style={[styles.input, styles.textarea]} value={about} onChangeText={setAbout} placeholder={t("taskerEditProfile.about") || "About"} textAlign={I18nManager.isRTL ? "right" : "left"} textAlignVertical="top" placeholderTextColor="#999" multiline maxLength={150} />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>{t("taskerEditProfile.save")}</Text>
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
    flex: 1,
  },

  headerRow: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    height: 40,
  },

  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  header: {
    fontFamily: "InterBold",
    fontSize: 22,
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
  },

  buttonText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
});

  
