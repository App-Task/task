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
          <Text style={styles.emptyText}>No reviews yet</Text>
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
    backgroundColor: "#fff",
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
  emptyText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});