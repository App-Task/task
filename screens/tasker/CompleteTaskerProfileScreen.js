import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";

import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getToken } from "../../services/authStorage";
import CountryPicker from "react-native-country-picker-modal";
import { useNavigation } from "@react-navigation/native";
import { fetchCurrentUser } from "../../services/auth";

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
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refs
  const scrollRef = useRef(null);
  const kbHeightRef = useRef(0);
  const positionsRef = useRef({
    name: 0,
    phone: 0,
    experience: 0,
    skills: 0,
    about: 0,
  });

  // Smooth scroll to a stored Y (no measureLayout)
  const scrollToKey = (key) => {
    const y = positionsRef.current[key] ?? 0;
    // Offset so the field sits above the keyboard
    const extraOffset = 100;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - extraOffset), animated: true });
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          setName(user.name || "");
          setGender(user.gender || "");
          setLocation(user.location || "");
          setExperience(user.experience || "");
          setSkills(user.skills || "");
          setAbout(user.about || "");

          if (user.callingCode && user.rawPhone) {
            setCallingCode(user.callingCode);
            setRawPhone(user.rawPhone);
            setCountryCode(user.countryCode || "SA");
          } else if (user.phone) {
            const match = user.phone.match(/^\+(\d{1,4})(.*)$/);
            if (match) {
              setCallingCode("+" + match[1]);
              setRawPhone(match[2].trim());
            }
          }
        }
      } catch (err) {
        console.error("❌ Error fetching user data:", err.message);
      }
    };

    loadUserData();
  }, []);

  // Manage keyboard height to avoid white bar
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const h = e.endCoordinates?.height ?? 0;
        kbHeightRef.current = h;
        setKbHeight(h);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        kbHeightRef.current = 0;
        setKbHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSave = async () => {
    if (!name || !gender || !location || !experience || !skills || !about || !rawPhone) {
      Alert.alert(
        t("taskerCompleteProfile.incompleteTitle"),
        t("taskerCompleteProfile.incompleteMessage")
      );
      return;
    }

    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(rawPhone.trim())) {
      Alert.alert(
        t("taskerCompleteProfile.invalidPhoneTitle"),
        t("taskerCompleteProfile.invalidPhoneMessage")
      );
      return;
    }

    try {
      setLoading(true);

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
        navigation.reset({
          index: 0,
          routes: [{ name: "Documents", params: { fromRegister: true } }],
        });
      } else {
        console.error("❌ Update failed:", data);
        Alert.alert(t("common.errorTitle"), data.msg || t("common.errorGeneric"));
      }
    } catch (err) {
      console.error("❌ Error saving profile:", err.message);
      Alert.alert(t("common.errorTitle"), t("common.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#ffffff" }}
      // Using 'height' avoids the iOS white padding bar
      behavior={Platform.OS === "ios" ? "height" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        contentContainerStyle={[styles.container, { paddingBottom: 20 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        // No contentInset / scrollIndicatorInsets (prevents white band)
      >
        <View style={styles.headerRow} onLayout={(e) => {}}>
          <Ionicons name="person-circle-outline" size={60} color="#213729" />
          <Text style={styles.header}>{t("taskerCompleteProfile.title")}</Text>
        </View>

        <Text style={styles.subText}>{t("taskerCompleteProfile.subText")}</Text>

        {/* Each field wrapped with onLayout to store its Y */}
        <View
          onLayout={(e) => {
            positionsRef.current.name = e.nativeEvent.layout.y;
          }}
        >
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onFocus={() => scrollToKey("name")}
            placeholder={t("taskerCompleteProfile.namePlaceholder")}
            textAlign={I18nManager.isRTL ? "right" : "left"}
            placeholderTextColor="#999"
            returnKeyType="next"
          />
        </View>

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
          <View
            style={{ flex: 1 }}
            onLayout={(e) => {
              positionsRef.current.phone = e.nativeEvent.layout.y;
            }}
          >
            <TextInput
              style={styles.phoneInput}
              value={rawPhone}
              onChangeText={setRawPhone}
              onFocus={() => scrollToKey("phone")}
              keyboardType="phone-pad"
              placeholder={t("taskerCompleteProfile.phonePlaceholder")}
              placeholderTextColor="#999"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowGenderDropdown(!showGenderDropdown)}
          >
            <Text style={{ color: gender ? "#333" : "#999" }}>
              {gender || "Select Gender"}
            </Text>
          </TouchableOpacity>

          {showGenderDropdown && (
            <View style={styles.dropdown}>
              {[t("taskerCompleteProfile.genderMale"), t("taskerCompleteProfile.genderFemale")].map(
                (option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setGender(option);
                      setShowGenderDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{option}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowLocationDropdown(!showLocationDropdown)}
          >
            <Text style={{ color: location ? "#333" : "#999" }}>
              {location || "Select Location"}
            </Text>
          </TouchableOpacity>

          {showLocationDropdown && (
            <View style={styles.dropdown}>
              {[t("taskerCompleteProfile.locationBahrain")].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setLocation(option);
                    setShowLocationDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View
          onLayout={(e) => {
            positionsRef.current.experience = e.nativeEvent.layout.y;
          }}
        >
          <TextInput
            style={styles.input}
            value={experience}
            onChangeText={setExperience}
            onFocus={() => scrollToKey("experience")}
            placeholder={t("taskerCompleteProfile.experiencePlaceholder")}
            textAlign={I18nManager.isRTL ? "right" : "left"}
            placeholderTextColor="#999"
            returnKeyType="next"
          />
        </View>

        <View
          onLayout={(e) => {
            positionsRef.current.skills = e.nativeEvent.layout.y;
          }}
        >
          <TextInput
            style={styles.input}
            value={skills}
            onChangeText={setSkills}
            onFocus={() => scrollToKey("skills")}
            placeholder={t("taskerCompleteProfile.skillsPlaceholder")}
            textAlign={I18nManager.isRTL ? "right" : "left"}
            placeholderTextColor="#999"
            returnKeyType="next"
          />
        </View>

        <View
          onLayout={(e) => {
            positionsRef.current.about = e.nativeEvent.layout.y;
          }}
        >
          <TextInput
            style={[styles.input, styles.textarea]}
            value={about}
            onChangeText={setAbout}
            onFocus={() => scrollToKey("about")}
            placeholder={t("taskerCompleteProfile.aboutPlaceholder")}
            textAlign={I18nManager.isRTL ? "right" : "left"}
            textAlignVertical="top"
            placeholderTextColor="#999"
            multiline
            maxLength={150}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>{t("taskerCompleteProfile.saveAndContinue")}</Text>
        </TouchableOpacity>

        {/* Spacer equals keyboard height (prevents white bar & lets you see the focused field) */}
        <View style={{ height: kbHeight }} />
      </ScrollView>

      {loading && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              paddingVertical: 20,
              paddingHorizontal: 30,
              borderRadius: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#213729" }}>
              {t("taskerCompleteProfile.savingProfile")}
            </Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingTop: 100,
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
    minHeight: 100,
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
  dropdown: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginTop: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  dropdownText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#333",
  },
});
