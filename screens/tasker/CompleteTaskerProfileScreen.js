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
  Image,
  Dimensions,
} from "react-native";

import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getToken } from "../../services/authStorage";
import { useNavigation } from "@react-navigation/native";
import { fetchCurrentUser, updateUserProfile } from "../../services/auth";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

export default function CompleteTaskerProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [about, setAbout] = useState("");

  const [profileImage, setProfileImage] = useState(null); // ✅ NEW

  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Predefined skills list
  const availableSkills = [
    "Handyman",
    "Moving",
    "IKEA Assembly",
    "Cleaning",
    "Shopping & Delivery",
    "Yardwork Services",
    "Dog Walking",
    "Other"
  ];

  // Refs
  const scrollRef = useRef(null);
  const kbHeightRef = useRef(0);
  const positionsRef = useRef({
    name: 0,
    skills: 0,
    about: 0,
  });

  // Smooth scroll to a stored Y (no measureLayout)
  const scrollToKey = (key) => {
    const y = positionsRef.current[key] ?? 0;
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
          setSelectedSkills(user.skills ? user.skills.split(",").map(s => s.trim()) : []); // ✅ load existing skills
          setAbout(user.about || "");
          if (user.profileImage) setProfileImage(user.profileImage); // ✅ load existing pfp

        }
      } catch (err) {
        console.error("❌ Error fetching user data:", err.message);
      }
    };

    loadUserData();
  }, []);

  // Manage keyboard height (avoids the white bar)
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

  // ====== NEW: Profile Picture Handler (same flow as your ProfileScreen) ======
  const uploadToServerAndSave = async (localUri) => {
    const formData = new FormData();
    formData.append("image", {
      uri: localUri,
      type: "image/jpeg",
      name: `profile_${Date.now()}.jpg`,
    });

    try {
      const uploadRes = await fetch("https://task-kq94.onrender.com/api/upload/profile", {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();
      if (data.imageUrl) {
        setProfileImage(data.imageUrl);
        await updateUserProfile({ profileImage: data.imageUrl }); // ✅ persist immediately
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("❌ Upload failed:", err.message);
      Alert.alert(t("common.errorTitle"), t("common.uploadFailed"));
    }
  };

  const handleChangeProfilePicture = async () => {
    Alert.alert(
      t("clientProfile.managePhotoTitle"),
      "",
      [
        {
          text: t("clientProfile.chooseNewPhoto"),
          onPress: async () => {
            const res = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.6,
            });
            if (!res.canceled) {
              const localUri = res.assets[0].uri;
              await uploadToServerAndSave(localUri);
            }
          },
        },
        {
          text: t("common.takePhoto"),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                t("common.permissionNeeded"),
                t("common.cameraPermissionRequired")
              );
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.6,
            });
            if (!res.canceled) {
              const localUri = res.assets[0].uri;
              await uploadToServerAndSave(localUri);
            }
          },
        },
        {
          text: t("common.removePhoto"),
          style: "destructive",
          onPress: async () => {
            setProfileImage(null);
            try {
              await updateUserProfile({ profileImage: null }); // ✅ remove server-side
            } catch (err) {
              console.error("❌ Failed to remove profile image:", err.message);
            }
          },
        },
        { text: t("common.cancel"), style: "cancel" },
      ],
      { cancelable: true }
    );
  };
  // ===========================================================================

  const handleSave = async () => {
    if (!name || !gender || !location || !selectedSkills.length || !about) {
      Alert.alert(
        t("taskerCompleteProfile.incompleteTitle"),
        t("taskerCompleteProfile.incompleteMessage")
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
          skills: selectedSkills.join(","), // ✅ include current skills
          about,
          profileImage, // ✅ include current image too
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
      behavior={Platform.OS === "ios" ? "height" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        contentContainerStyle={[styles.container, { paddingBottom: 20 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* ===== Profile Picture (tap to manage) ===== */}
        <TouchableOpacity onPress={handleChangeProfilePicture} style={styles.avatarWrapper}>
          <View style={styles.avatarPlaceholder}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{ width: "100%", height: "100%", borderRadius: 100 }}
              />
            ) : (
              <Text style={styles.avatarInitials}>
                {name
                  ? name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "?"}
              </Text>
            )}
            <View style={styles.editIconWrapper}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>{t("taskerCompleteProfile.title")}</Text>
        </View>
        <Text style={styles.subText}>{t("taskerCompleteProfile.subText")}</Text>

        {/* Personal Information Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>

        {/* Each field wrapped with onLayout to store its Y */}
        <View
          onLayout={(e) => {
            positionsRef.current.name = e.nativeEvent.layout.y;
          }}
          style={{ marginBottom: 20 }}
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

        {/* Gender Dropdown */}
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

        {/* Location Dropdown */}
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

        {/* Skills Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Skills & Expertise</Text>
        </View>

        <View
          onLayout={(e) => {
            positionsRef.current.skills = e.nativeEvent.layout.y;
          }}
          style={{ marginBottom: 20 }}
        >
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowSkillsDropdown(!showSkillsDropdown)}
          >
            <Text style={{ color: selectedSkills.length > 0 ? "#333" : "#999" }}>
              {selectedSkills.length > 0 ? selectedSkills.join(", ") : "Select Skills"}
            </Text>
          </TouchableOpacity>

          {/* Display selected skills with remove buttons */}
          {selectedSkills.length > 0 && (
            <View style={styles.selectedSkillsContainer}>
              {selectedSkills.map((skill, index) => (
                <View key={index} style={styles.selectedSkillItem}>
                  <Text style={styles.selectedSkillText}>{skill}</Text>
                  <TouchableOpacity
                    style={styles.removeSkillButton}
                    onPress={() => {
                      setSelectedSkills(prev => prev.filter((_, i) => i !== index));
                    }}
                  >
                    <Text style={styles.removeSkillText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {showSkillsDropdown && (
            <View style={styles.dropdown}>
              <ScrollView 
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {availableSkills.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.dropdownItem,
                      selectedSkills.includes(skill) && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setSelectedSkills(prev => {
                        const newSelected = [...prev];
                        const index = newSelected.indexOf(skill);
                        if (index > -1) {
                          newSelected.splice(index, 1);
                        } else {
                          newSelected.push(skill);
                        }
                        return newSelected;
                      });
                      setShowSkillsDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownText,
                      selectedSkills.includes(skill) && styles.dropdownTextSelected
                    ]}>
                      {skill}
                    </Text>
                    {selectedSkills.includes(skill) && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={16} color="#215433" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About You</Text>
        </View>

        <View
          onLayout={(e) => {
            positionsRef.current.about = e.nativeEvent.layout.y;
          }}
          style={{ marginBottom: 20 }}
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
          <Text style={styles.characterCount}>
            {about.length}/150 characters
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>{t("taskerCompleteProfile.saveAndContinue")}</Text>
        </TouchableOpacity>

        {/* Spacer equals keyboard height */}
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
            <Text style={{ fontFamily: "InterBold", fontSize: 16, color: "#215433" }}>
              {t("taskerCompleteProfile.savingProfile")}
            </Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: {
    position: "relative",
    alignItems: "center",
    marginBottom: 24,
  },
  editIconWrapper: {
    position: "absolute",
    bottom: 6,
    left: "50%",
    transform: [{ translateX: -15 }],
    backgroundColor: "#215432",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: 100,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  avatarInitials: {
    fontFamily: "InterBold",
    fontSize: 28,
    color: "#215433",
  },
  container: {
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  header: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#215433",
    textAlign: "center",
    marginTop: 4,
  },
  subText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "Inter",
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#215433",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#ffffff",
  },
  dropdown: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  dropdownItemSelected: {
    backgroundColor: "#f0f9eb", // Light green background for selected items
    borderColor: "#a5d6a7", // Green border for selected items
    borderWidth: 1,
  },
  dropdownText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#333",
  },
  dropdownTextSelected: {
    color: "#215433", // Dark green for selected text
    fontWeight: "bold",
  },
  selectedSkillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  selectedSkillItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#215433",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedSkillText: {
    color: "#ffffff",
    fontFamily: "InterMedium",
    fontSize: 14,
    marginRight: 6,
  },
  removeSkillButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeSkillText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 18,
  },
  selectedIndicator: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -8 }],
  },
  sectionHeader: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#215433",
    textAlign: "center",
  },
  characterCount: {
    fontSize: 14,
    color: "#999",
    textAlign: "right",
    paddingHorizontal: 20,
    paddingTop: 8,
    fontFamily: "Inter",
  },
});
