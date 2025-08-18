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
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [about, setAbout] = useState("");

  const [profileImage, setProfileImage] = useState(null); // ✅ NEW

  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refs
  const scrollRef = useRef(null);
  const kbHeightRef = useRef(0);
  const positionsRef = useRef({
    name: 0,
    experience: 0,
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
          setExperience(user.experience || "");
          setSkills(user.skills || "");
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
      Alert.alert(t("common.errorTitle"), t("common.errorGeneric"));
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
          text: t("taskerDocuments.takePhoto") || "Take Photo",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                t("taskerDocuments.permissionDenied") || "Permission denied",
                t("taskerDocuments.cameraDeniedMsg") ||
                  "Camera permission is required to take a photo."
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
          text: t("clientProfile.removePhoto"),
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
        { text: t("clientProfile.cancel"), style: "cancel" },
      ],
      { cancelable: true }
    );
  };
  // ===========================================================================

  const handleSave = async () => {
    if (!name || !gender || !location || !experience || !skills || !about) {
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
          experience,
          skills,
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
    marginBottom: 16,
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
    flexGrow: 1,
  },
  headerRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#215433",
    textAlign: "center",
    marginTop: 4,
  },
  subText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
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
    backgroundColor: "#215433",
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
