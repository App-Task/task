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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import axios from "axios";

export default function TaskerProfileScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { taskerId } = route.params;
  const [tasker, setTasker] = useState(null);
  const [reviewData, setReviewData] = useState({ average: null, reviews: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskerAndReview = async () => {
      try {
        const [userRes, reviewRes] = await Promise.all([
          axios.get(`https://task-kq94.onrender.com/api/users/${taskerId}`),
          axios.get(`https://task-kq94.onrender.com/api/reviews/all/tasker/${taskerId}`)
        ]);
        setTasker(userRes.data);
        setReviewData({
          reviews: reviewRes.data || [],
        });
        
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
        <ActivityIndicator size="large" color="#215433" style={{ marginTop: 40 }} />
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with back button and title */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
  <Ionicons name="arrow-back" size={30} color="#215432" />
</TouchableOpacity>


<ScrollView contentContainerStyle={{ flexGrow: 1 }}>


        {tasker.profileImage ? (
  <Image source={{ uri: tasker.profileImage }} style={styles.image} />
) : (
  <View style={styles.placeholderAvatar} />
)}

<View style={styles.infoSection}>
  <Text style={styles.name}>{tasker.name}</Text>

  <Text style={styles.profileDetails}>
    <Text style={styles.profileLabel}>{t("taskerProfile.location")} </Text>
    {tasker.location || t("taskerProfile.notProvided")}
  </Text>

  <Text style={styles.profileDetails}>
    <Text style={styles.profileLabel}>{t("taskerProfile.experience")} </Text>
    {tasker.experience || t("taskerProfile.notProvided")}
  </Text>

  <Text style={styles.profileDetails}>
    <Text style={styles.profileLabel}>{t("taskerProfile.skills")} </Text>
    {tasker.skills || t("taskerProfile.notProvided")}
  </Text>
</View>


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
      {t("taskerProfile.avgRating")}{" "}
      {reviewData.reviews.length
        ? (
            reviewData.reviews.reduce((sum, r) => sum + r.rating, 0) /
            reviewData.reviews.length
          ).toFixed(1)
        : "0.0"}
    </Text>
  </View>

  {/* Reviews List */}
  {reviewData.reviews.length === 0 ? (
    <Text style={styles.noReviews}>{t("taskerProfile.noReviews")}</Text>
  ) : (
    reviewData.reviews.map((rev, idx) => (
      <View key={idx} style={styles.reviewCard}>
        <Text style={styles.reviewDate}>
          {new Date(rev.createdAt).toLocaleDateString(I18nManager.isRTL ? "ar-SA" : "en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
    
        {/* ✅ New Divider Line */}
        <View style={styles.reviewDivider} />
    
        <View style={styles.reviewRatingContainer}>
          <Text style={styles.reviewRating}>{rev.rating}/5</Text>
          <Image
            source={require("../../assets/images/Starno background.png")}
            style={{
              width: 16,
              height: 16,
              marginLeft: 4,
              marginTop: -2,
            }}
          />
        </View>
        {rev.comment ? (
          <Text style={styles.reviewComment}>{rev.comment}</Text>
        ) : null}
      </View>
    ))
    
  )}
</View>




        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff", // ✅ keep white for top section only
  },
  
  scroll: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  
  title: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215433",
    textAlign: "center",
    flex: 1,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  name: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: I18nManager.isRTL ? "right" : "left",
    marginBottom: 6,
  },
  review: {
    fontSize: 14,
    fontFamily: "Inter",
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  error: {
    textAlign: "center",
    marginTop: 50,
    color: "red",
    fontSize: 16,
  },
  ratingBox: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  
  ratingStar: {
    fontSize: 20,
    color: "#FFD700", // gold
    marginRight: 6,
  },
  
  ratingText: {
    fontSize: 18,
    fontFamily: "InterBold",
    color: "#215433",
  },
  
  reviewRating: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#215433",
  },
  
  reviewComment: {
    fontSize: 15,
    fontFamily: "Inter",
    color: "#333",
    marginTop: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: "#555",
    textAlign: I18nManager.isRTL ? "right" : "left",
    marginBottom: 4,
  },
  
  profileLabel: {
    fontFamily: "InterBold",
    color: "#215432",
  },
  aboutTitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 20,
    marginBottom: 12,
  },
  aboutBold: {
    fontFamily: "InterBold",
    color: "#ffffff",
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reviewsTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },
  reviewsAvg: {
    fontFamily: "InterBold",
    fontSize: 14,
    color: "#ffffff",
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  reviewDate: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  reviewRating: {
    fontFamily: "InterBold",
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
  },
  reviewRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewComment: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#444",
  },
  noReviews: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
  },
  infoSection: {
    alignSelf: "flex-start", // ✅ left align group
    marginBottom: 16,
  },
  greenSection: {
    flex: 1,
    backgroundColor: "#215432",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,   // ✅ new
    borderBottomRightRadius: 30,  // ✅ new
    padding: 16,
    width: "100%",
    marginTop: 20,
  },
  reviewDivider: {
    height: 2,
    backgroundColor: "#e0e0e0", // ✅ light grey line
    marginVertical: 6,
    
  },
  
  
  
  
  
  
});
