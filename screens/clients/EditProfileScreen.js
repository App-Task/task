import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function EditProfileScreen({ navigation }) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [about, setAbout] = useState("");

  const handleUpdate = () => {
    alert(t("clientEditProfile.updated"));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Button */}
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

      {/* Inputs */}
      <TextInput
        style={styles.input}
        placeholder={t("clientEditProfile.name")}
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
        textAlign={I18nManager.isRTL ? "right" : "left"}
      />

      <TextInput
        style={styles.input}
        placeholder={t("clientEditProfile.gender")}
        placeholderTextColor="#999"
        value={gender}
        onChangeText={setGender}
        textAlign={I18nManager.isRTL ? "right" : "left"}
      />

      <TextInput
        style={styles.input}
        placeholder={t("clientEditProfile.location")}
        placeholderTextColor="#999"
        value={location}
        onChangeText={setLocation}
        textAlign={I18nManager.isRTL ? "right" : "left"}
      />

      <TextInput
        style={styles.input}
        placeholder={t("clientEditProfile.experience")}
        placeholderTextColor="#999"
        value={experience}
        onChangeText={setExperience}
        textAlign={I18nManager.isRTL ? "right" : "left"}
      />

      <TextInput
        style={styles.input}
        placeholder={t("clientEditProfile.skills")}
        placeholderTextColor="#999"
        value={skills}
        onChangeText={setSkills}
        textAlign={I18nManager.isRTL ? "right" : "left"}
      />

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder={t("clientEditProfile.about")}
        placeholderTextColor="#999"
        value={about}
        onChangeText={setAbout}
        multiline
        maxLength={150}
        textAlignVertical="top"
        textAlign={I18nManager.isRTL ? "right" : "left"}
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>{t("clientEditProfile.save")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  textarea: {
    height: 120,
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
});
