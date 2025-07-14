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
import { fetchCurrentUser, updateUserProfile } from "../../services/auth";
import { removeToken } from "../../services/authStorage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

export default function TaskerProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const [user, setUser] = useState({
    name: "",
    email: "",
    profileImage: null,
    isVerified: false,
    verificationStatus: "pending",
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const nav = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        try {
          const fetched = await fetchCurrentUser();
          setUser(fetched);
          setProfileImage(fetched.profileImage || null);
        } catch (err) {
          console.error("❌ Failed to load user:", err.message);
        }
      };

      loadUser();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await removeToken();
      Alert.alert(t("taskerProfile.loggedOut"));
      nav.reset({ index: 0, routes: [{ name: "Welcome" }] });
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
    }
  };

  const handleChangeProfilePicture = async () => {
    Alert.alert(
      t("taskerProfile.managePhotoTitle"),
      "",
      [
        {
          text: t("taskerProfile.chooseNewPhoto"),
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });

            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setProfileImage(uri);
              await updateUserProfile({ profileImage: uri });
            }
          },
        },
        {
          text: t("taskerProfile.removePhoto"),
          style: "destructive",
          onPress: async () => {
            setProfileImage(null);
            await updateUserProfile({ profileImage: "" });
          },
        },
        { text: t("taskerProfile.cancel"), style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={handleChangeProfilePicture} style={styles.avatarWrapper}>
        <View style={styles.avatar}>
        {profileImage && profileImage.trim() !== "" ? (
            <Image
              source={{ uri: profileImage }}
              style={{ width: "100%", height: "100%", borderRadius: 100 }}
            />
          ) : (
            <Text style={styles.initials}>{getInitials(user.name)}</Text>
          )}
          <View style={styles.editIconWrapper}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>

      <Text style={styles.name}>{user.name || "Loading..."}</Text>
      <Text style={styles.email}>{user.email || " "}</Text>
      {user.verificationStatus === "accepted" ? (
  <View style={styles.verifiedBadge}>
    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
    <Text style={styles.verifiedText}>Verified Tasker</Text>
  </View>
) : user.verificationStatus === "declined" ? (
  <View style={styles.declinedBadge}>
    <Ionicons name="close-circle" size={18} color="#ff4444" />
    <Text style={styles.declinedText}>Verification Declined</Text>
  </View>
) : (
  <View style={styles.pendingBadge}>
    <Ionicons name="time" size={18} color="#FFA500" />
    <Text style={styles.pendingText}>Verification Pending</Text>
  </View>
)}


      <View style={styles.buttonGroup}>
  <TouchableOpacity
    style={styles.rowItem}
    onPress={() => navigation.navigate("EditTaskerProfile")}
  >
    <Text style={styles.rowText}>{t("taskerProfile.edit")}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.rowItem}
    onPress={() => navigation.navigate("ChangePassword")}
  >
    <Text style={styles.rowText}>Change Password</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.rowItem}
    onPress={() => navigation.navigate("Documents")}
  >
    <Text style={styles.rowText}>{t("taskerProfile.documents")}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  {/* 🔒 Commented out Bank Account */}
  {/*
  <TouchableOpacity
    style={styles.rowItem}
    onPress={() => navigation.navigate("BankAccount")}
  >
    <Text style={styles.rowText}>{t("taskerProfile.bank")}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>
  */}

  {/* 💸 Commented out My Payments */}
  {/*
  <TouchableOpacity
    style={styles.rowItem}
    onPress={() => navigation.navigate("MyPayments")}
  >
    <Text style={styles.rowText}>{t("taskerProfile.payments")}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>
  */}

  <TouchableOpacity
    style={styles.rowItem}
    onPress={() => navigation.navigate("Reviews")}
  >
    <Text style={styles.rowText}>{t("taskerProfile.reviews")}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.rowItem}
    onPress={() => navigation.navigate("Settings")}
  >
    <Text style={styles.rowText}>{t("taskerProfile.settings")}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  <TouchableOpacity style={[styles.rowItem, styles.logoutRow]} onPress={handleLogout}>
    <Text style={[styles.rowText, styles.logoutText]}>
      {t("taskerProfile.logout")}
    </Text>
    <Ionicons name="log-out-outline" size={20} color="#213729" />
  </TouchableOpacity>
</View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: "#c1ff72",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  editIconWrapper: {
    position: "absolute",
    bottom: 6,
    left: "50%",
    transform: [{ translateX: -13 }],
    backgroundColor: "#215432",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 28,
    fontFamily: "InterBold",
    color: "#213729",
  },
  name: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 6,
  },
  email: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
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

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f8e9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  verifiedText: {
    marginLeft: 8,
    fontFamily: "Inter",
    color: "#4CAF50",
    fontSize: 14,
  },
  
  declinedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffe6e6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  declinedText: {
    marginLeft: 8,
    fontFamily: "Inter",
    color: "#ff4444",
    fontSize: 14,
  },
  
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff4e6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  pendingText: {
    marginLeft: 8,
    fontFamily: "Inter",
    color: "#FFA500",
    fontSize: 14,
  },
  
});
