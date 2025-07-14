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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function TaskerProfileScreen({ route, navigation }) {
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
        <ActivityIndicator size="large" color="#213729" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!tasker) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.error}>Failed to load tasker profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with back button and title */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#213729" />
          </TouchableOpacity>
          <Text style={styles.title}>Tasker Profile</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {tasker.profileImage ? (
            <Image source={{ uri: tasker.profileImage }} style={styles.image} />
          ) : null}

          <Text style={styles.name}>{tasker.name}</Text>




          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{tasker.location || "Not provided"}</Text>

          <Text style={styles.label}>Experience</Text>
          <Text style={styles.value}>{tasker.experience || "Not provided"}</Text>

          <Text style={styles.label}>Skills</Text>
          <Text style={styles.value}>{tasker.skills || "Not provided"}</Text>

          <Text style={styles.label}>About</Text>
          <Text style={styles.value}>{tasker.about || "Not provided"}</Text>

          <Text style={styles.label}>Reviews</Text>
{reviewData.reviews.length === 0 ? (
  <Text style={styles.value}>No reviews yet</Text>
) : (
  reviewData.reviews.map((rev, idx) => (
    <View key={idx} style={styles.reviewBox}>
      <Text style={styles.reviewRating}>⭐ {rev.rating} / 5</Text>
      {rev.comment ? <Text style={styles.reviewComment}>{rev.comment}</Text> : null}
    </View>
  ))
)}


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
    backgroundColor: "#ffffff",
  },
  scroll: {
    paddingBottom: 60,
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
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#213729",
    textAlign: "center",
    flex: 1,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontFamily: "InterBold",
    textAlign: "center",
    marginBottom: 8,
    color: "#213729",
  },
  review: {
    fontSize: 14,
    fontFamily: "Inter",
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: "InterBold",
    marginTop: 12,
    color: "#555",
  },
  value: {
    fontSize: 15,
    fontFamily: "Inter",
    color: "#333",
    marginTop: 4,
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
    color: "#213729",
  },
  reviewBox: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  
  reviewRating: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#213729",
  },
  
  reviewComment: {
    fontSize: 15,
    fontFamily: "Inter",
    color: "#333",
    marginTop: 4,
  },
  
  
});
