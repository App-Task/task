import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { removeToken } from "../../services/authStorage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Linking } from "react-native";
import * as SecureStore from "expo-secure-store";


import { fetchCurrentUser, updateUserProfile } from "../../services/auth";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const nav = useNavigation();
  const [user, setUser] = useState({ name: "", email: "", profileImage: null });
  const [profileImage, setProfileImage] = useState(null);
  

  const loadUser = async () => {
    try {
      const fetched = await fetchCurrentUser();
      setUser(fetched);
      if (fetched.profileImage) {
        setProfileImage(fetched.profileImage);
      }
    } catch (err) {
      console.error("❌ Failed to load user:", err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await removeToken();
      Alert.alert(t("clientProfile.logoutAlertTitle"), t("clientProfile.logoutAlertMessage"));
      nav.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
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
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });

            if (!result.canceled) {
              const selectedUri = result.assets[0].uri;
              setProfileImage(selectedUri);

              try {
                await updateUserProfile({ profileImage: selectedUri });
                console.log("✅ Profile image updated");
                loadUser(); // Refresh user info
              } catch (err) {
                console.error("❌ Failed to update profile image:", err.message);
                Alert.alert("Error", "Could not save profile picture");
              }
            }
          },
        },
        {
          text: t("clientProfile.removePhoto"),
          style: "destructive",
          onPress: async () => {
            setProfileImage(null);
            try {
              await updateUserProfile({ profileImage: null });
              loadUser();
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={handleChangeProfilePicture} style={styles.avatarWrapper}>
        <View style={styles.avatarPlaceholder}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={{ width: "100%", height: "100%", borderRadius: 100 }}
            />
          ) : (
            <Text style={styles.avatarInitials}>
              {user?.name
                ? user.name
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

      <View style={styles.info}>
        <Text style={styles.name}>{user.name || "Loading..."}</Text>
        <Text style={styles.email}>{user.email || " "}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("EditProfile")}>
          <Text style={styles.rowText}>{t("clientProfile.editProfile")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate("ChangePassword")}>
          <Text style={styles.rowText}>{t("clientProfile.changePassword")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowItem}>
          <Text style={styles.rowText}>{t("clientProfile.aboutUs")}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.rowItem}
  onPress={() => navigation.navigate("PrivacyPolicy")}
>
  <Text style={styles.rowText}>{t("clientProfile.privacyPolicy")}</Text>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>

        <TouchableOpacity
  style={styles.rowItem}
  onPress={() => navigation.navigate("TermsAndConditions")}
>
  <Text style={styles.rowText}>{t("clientProfile.terms")}</Text>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>

<TouchableOpacity
  style={styles.rowItem}
  onPress={() => {
    Alert.alert(
      "Before You Continue",
      "Please make sure to include your name, email, phone number, and your message in the email.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            const mailto = `mailto:task.team.bh@gmail.com?subject=${encodeURIComponent(
              "App Support Request"
            )}`;
            try {
              const supported = await Linking.canOpenURL(mailto);
              if (supported) {
                await Linking.openURL(mailto);
              } else {
                Alert.alert("Error", "Email app is not available.");
              }
            } catch (err) {
              console.error("❌ Failed to open email:", err.message);
              Alert.alert("Error", "Could not open your email app.");
            }
          },
        },
      ]
    );
  }}
>
  <Text style={styles.rowText}>{t("clientProfile.contactAdmin")}</Text>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>





        <TouchableOpacity style={[styles.rowItem, styles.logoutRow]} onPress={handleLogout}>
          <Text style={[styles.rowText, styles.logoutText]}>{t("clientProfile.logout")}</Text>
          <Ionicons name="log-out-outline" size={20} color="#213729" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: {
    position: "relative",
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
  container: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 100,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  avatarInitials: {
    fontFamily: "InterBold",
    fontSize: 32,
    color: "#213729",
  },
  info: {
    alignItems: "center",
    marginBottom: 30,
  },
  name: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#213729",
    marginBottom: 6,
  },
  email: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
  },
  buttonGroup: {
    width: "100%",
  },
  rowItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 10,
  },
  rowText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
  },
  logoutRow: {
    backgroundColor: "#c1ff72",
  },
  logoutText: {
    fontFamily: "InterBold",
    color: "#213729",
  },
});
