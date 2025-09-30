import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  I18nManager,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { fetchCurrentUser } from "../../services/auth";
import axios from "axios";
import EmptyIllustration from "../../components/EmptyIllustration";

export default function MyReviewsScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState("0.0");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const user = await fetchCurrentUser();
        const response = await axios.get(
          `https://task-kq94.onrender.com/api/reviews/all/tasker/${user._id}`,
          { headers: { "Content-Type": "application/json" } }
        );
        
        const data = response.data;
        setReviews(Array.isArray(data) ? data : []);

        // Calculate average rating
        if (data && data.length > 0) {
          const avg = (data.reduce((sum, r) => sum + (r.rating || 0), 0) / data.length).toFixed(1);
          setAverageRating(avg);
        }
      } catch (err) {
        console.error("❌ Failed to load reviews:", err.message);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color="#215433"
        style={{ marginRight: 2 }}
      />
    ));
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <Text style={styles.taskTitle}>{item.taskId?.title || "Task Title"}</Text>
      
      <View style={styles.starsContainer}>
        {renderStars(item.rating || 0)}
      </View>
      
      <Text style={styles.reviewText}>
        {item.comment || "It is a long established fact that a reader will be distracted by the readable content of a page when It is a long established fact that a reader will be distracted by the readable content of a page when It is a long established fact that a reader will be distracted by the readable content of a page when"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#215433"
          />
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>My Reviews</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>Reviews</Text>
          <Text style={styles.avgRating}>Avg Rating: {averageRating}</Text>
        </View>
      </View>

      {/* Reviews List */}
      {loading ? (
        <ActivityIndicator 
          color="#215433" 
          size="large" 
          style={styles.loading} 
        />
      ) : reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <EmptyIllustration size={140} />
          </View>
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySubtitle}>Start doing tasks to get rated!</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mainTitle: {
    fontFamily: "InterBold",
    fontSize: 28,
    color: "#215433",
    marginBottom: 8,
  },
  subtitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtitle: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#215433",
  },
  avgRating: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#215433",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  reviewItem: {
    paddingVertical: 16,
  },
  taskTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  reviewText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },
  loading: {
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyIllustration: {
    marginBottom: 30,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#CFD8DC",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  stopwatch: {
    position: "absolute",
    right: 15,
    top: 20,
    width: 50,
    height: 50,
  },
  stopwatchFace: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#000000",
    position: "relative",
    overflow: "hidden",
  },
  stopwatchProgress: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "33%",
    height: "100%",
    backgroundColor: "#C6FF00",
  },
  stopwatchButton: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  mug: {
    position: "absolute",
    left: 10,
    bottom: 15,
    width: 30,
    height: 25,
    backgroundColor: "#ffffff",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#000000",
  },
  mugHandle: {
    position: "absolute",
    right: -8,
    top: 5,
    width: 8,
    height: 12,
    borderWidth: 1,
    borderColor: "#000000",
    borderLeftWidth: 0,
    borderRadius: 0,
  },
  mugLiquid: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    height: 8,
    backgroundColor: "#C6FF00",
    borderRadius: 1,
  },
  emptyTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#616161",
    textAlign: "center",
  },
});