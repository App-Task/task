import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  I18nManager,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

export default function EditProfileScreen() {
  const { t } = useTranslation();

  const [name, setName] = useState("Yosuf Al Awadi");
  const [gender, setGender] = useState("Male");
  const [location, setLocation] = useState("Jeddah");
  const [experience, setExperience] = useState("3 years");
  const [skills, setSkills] = useState("Plumbing, Electrical");
  const [about, setAbout] = useState("Reliable tasker with attention to detail.");

  const handleSave = () => {
    Alert.alert(t("editProfilee.savedTitle"), t("editProfilee.savedMessage"));
    // TODO: send updated data to backend
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t("editProfilee.title")}</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t("editProfilee.name")}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        value="yosuf@example.com"
        editable={false}
        placeholder={t("editProfilee.email")}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        value={gender}
        onChangeText={setGender}
        placeholder={t("editProfilee.gender")}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder={t("editProfilee.location")}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        value={experience}
        onChangeText={setExperience}
        placeholder={t("editProfilee.experience")}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        value={skills}
        onChangeText={setSkills}
        placeholder={t("editProfilee.skills")}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        placeholderTextColor="#999"
      />

      <TextInput
        style={[styles.input, styles.textarea]}
        value={about}
        onChangeText={setAbout}
        placeholder={t("editProfilee.about")}
        textAlign={I18nManager.isRTL ? "right" : "left"}
        textAlignVertical="top"
        placeholderTextColor="#999"
        multiline
        maxLength={150}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>{t("editProfilee.save")}</Text>
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
  },
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 30,
    textAlign: I18nManager.isRTL ? "right" : "left",
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
