import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  I18nManager,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import axios from "axios";

const { height } = Dimensions.get("window");

export default function TaskerProfileScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { taskerId } = route.params;
  const [tasker, setTasker] = useState(null);
  const [reviewData, setReviewData] = useState({ reviews: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskerAndReview = async () => {
      try {
        const [userRes, reviewRes] = await Promise.all([
          axios.get(`https://task-kq94.onrender.com/api/users/${taskerId}`),
          axios.get(`https://task-kq94.onrender.com/api/reviews/all/tasker/${taskerId}`),
        ]);
        setTasker(userRes.data);
        setReviewData({ reviews: reviewRes.data || [] });
      } catch (err) {
        console.error("❌ Error loading tasker or review:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTaskerAndReview();
  }, [taskerId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#215432" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!tasker) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.error}>{t("taskerProfile.loadError")}</Text>
      </SafeAreaView>
    );
  }

  const firstInitial =
    typeof tasker.name === "string" && tasker.name.trim().length > 0
      ? tasker.name.trim()[0].toUpperCase()
      : "?";

  const avg =
    reviewData.reviews.length > 0
      ? (reviewData.reviews.reduce((s, r) => s + (r?.rating || 0), 0) / reviewData.reviews.length).toFixed(1)
      : "0.0";

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Make the scroller itself green so the very bottom is always green */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#215432" }}
        contentContainerStyle={styles.container} // white top area
        bounces={false}
        overScrollMode="never"
      >
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={30}
            color="#215432"
          />
        </TouchableOpacity>

        {/* Big centered avatar */}
        <View style={styles.avatarWrap}>
          {tasker.profileImage ? (
            <Image source={{ uri: tasker.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{firstInitial}</Text>
            </View>
          )}
        </View>

        {/* Name & basics (white area) */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{tasker.name}</Text>

          <Text style={styles.profileDetails}>
            <Text style={styles.profileLabel}>{t("taskerProfile.location")} </Text>
            {tasker.location || t("taskerProfile.notProvided")}
          </Text>

          {/* experience REMOVED */}

          <Text style={styles.profileDetails}>
            <Text style={styles.profileLabel}>{t("taskerProfile.skills")} </Text>
            {tasker.skills || t("taskerProfile.notProvided")}
          </Text>
        </View>

        {/* GREEN SHEET – full-bleed and goes to the bottom */}
        <View style={styles.greenSection}>
          {/* About */}
          <Text style={styles.aboutTitle}>
            <Text style={styles.aboutBold}>{t("taskerProfile.about")} </Text>
            {tasker.about || t("taskerProfile.notProvided")}
          </Text>

          {/* Reviews Header */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>{t("taskerProfile.reviews")}</Text>
            <Text style={styles.reviewsAvg}>
              {t("taskerProfile.avgRating")} {avg}
            </Text>
          </View>

          {/* Reviews */}
          {reviewData.reviews.length === 0 ? (
            <Text style={styles.noReviews}>{t("taskerProfile.noReviews")}</Text>
          ) : (
            reviewData.reviews.map((rev, idx) => (
              <View key={idx} style={styles.reviewCard}>
                <Text style={styles.reviewDate}>
                  {new Date(rev.createdAt).toLocaleDateString(
                    I18nManager.isRTL ? "ar-SA" : "en-GB",
                    { day: "2-digit", month: "short", year: "numeric" }
                  )}
                </Text>

                <View style={styles.reviewDivider} />

                <View style={styles.reviewRatingContainer}>
                  <Image
                    source={require("../../assets/images/Starno background.png")}
                    style={{
                      width: 16,
                      height: 16,
                      marginRight: 4,
                    }}
                  />
                  <Text style={styles.reviewRatingText}>{rev.rating}/5</Text>
                </View>

                {rev.comment ? <Text style={styles.reviewComment}>{rev.comment}</Text> : null}
              </View>
            ))
          )}

          {/* Spacer so green reaches bottom even on short content */}
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // top status area white
  safeArea: { flex: 1, backgroundColor: "#ffffff" },

  // white header area
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
    backgroundColor: "#ffffff",
  },

  backBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 6,
    alignSelf: I18nManager.isRTL ? "flex-end" : "flex-start",
  },

  /** AVATAR **/
  avatarWrap: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#ffffff",
    backgroundColor: "#e8efe9",
  },
  avatarFallback: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7f0ea",
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  avatarFallbackText: {
    fontFamily: "InterBold",
    fontSize: 48,
    color: "#215432",
    marginTop: 4,
  },

  /** NAME / BASICS **/
  infoSection: {
    alignSelf: "stretch",
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: "center",
    marginBottom: 8,
  },
  profileDetails: {
    fontSize: 14,
    color: "#555",
    textAlign: I18nManager.isRTL ? "right" : "left",
    marginBottom: 6,
  },
  profileLabel: {
    fontFamily: "InterBold",
    color: "#215432",
  },

  /** GREEN SHEET (full-bleed to edges, stretches to bottom) **/
  greenSection: {
    backgroundColor: "#215432",
    marginTop: 16,
    marginHorizontal: -20,     // full-bleed edges (negate container padding)
    paddingHorizontal: 20,     // keep inside gutters aligned
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    minHeight: height * 0.7,   // helps cover to bottom on short content
  },

  aboutTitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 20,
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  aboutBold: { fontFamily: "InterBold", color: "#ffffff" },

  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reviewsTitle: { fontFamily: "InterBold", fontSize: 16, color: "#ffffff" },
  reviewsAvg: { fontFamily: "InterBold", fontSize: 14, color: "#ffffff" },

  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  reviewDate: { fontFamily: "Inter", fontSize: 12, color: "#999", marginBottom: 4 },
  reviewDivider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 6 },
  reviewRatingContainer: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  reviewRatingText: { fontFamily: "InterBold", fontSize: 14, color: "#000" },
  reviewComment: { fontFamily: "Inter", fontSize: 13, color: "#444" },
  noReviews: { fontFamily: "Inter", fontSize: 14, color: "#ccc", marginTop: 8 },

  error: { textAlign: "center", marginTop: 50, color: "red", fontSize: 16 },
});
