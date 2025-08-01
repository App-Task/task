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
import * as SecureStore from "expo-secure-store";

export default function MyReviewsScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const taskerId = await SecureStore.getItemAsync("userId");
        const response = await fetch(`https://task-kq94.onrender.com/api/reviews/all/tasker/${taskerId}`);
        
        // ✅ Check for success
        if (!response.ok) {
          const text = await response.text(); // catch HTML error
          throw new Error(`Failed to fetch: ${response.status} ${text}`);
        }
    
        const data = await response.json();
        setReviews(data);
      } catch (err) {
        console.error("❌ Failed to load reviews", err.message);
      } finally {
        setLoading(false);
      }
    };
    
  
    fetchReviews();
  }, []);
  

  const validReviews = Array.isArray(reviews) ? reviews : [];
  const averageRating = validReviews.length
  ? (validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length).toFixed(1)
  : "0.0";




  const renderStars = (count) =>
    Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < count ? "star" : "star-outline"}
        size={18}
        color="#c1ff72"
      />
    ));

    const renderItem = ({ item }) => (
      <View style={styles.card}>
  <View style={styles.ratingHeader}>
    <Text style={styles.ratingText}>{item.rating} ⭐</Text>
  </View>
  <View style={{ padding: 16 }}>
    <Text style={styles.reviewer}>
      Client Name: {item.clientId?.name || "Client"}
    </Text>
    {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
  </View>
</View>

    );
    

  return (
    <View style={styles.container}>
      {/* Back Header */}
     {/* Back Arrow */}
<TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
  <Ionicons
    name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
    size={30}
    color="#215432"
  />
</TouchableOpacity>

{/* Title below the arrow */}
<Text style={styles.header}>{t("taskerReviews.title")}</Text>

<Text style={styles.averageText}>
  {t("taskerReviews.averageText", { rating: averageRating })}
</Text>


      {loading ? (
        <ActivityIndicator color="#213729" size="large" style={{ marginTop: 40 }} />
      ) : reviews.length === 0 ? (
        <Text style={styles.empty}>{t("taskerReviews.empty")}</Text>
      ) : (
        <FlatList
          data={validReviews}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        />

      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60, // ✅ reduced so content starts closer to top
    paddingHorizontal: 20,
  },
  
  backBtn: {
    padding: 4,
    marginBottom: 20, // ✅ smaller, neat spacing
  },
  

  header: {
    fontFamily: "InterBold",
    fontSize: 28,
    color: "#215432",
    textAlign: "left",
    marginBottom: 10, // ✅ add this to separate from the cards
  },
  
  
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 16, // ✅ normal spacing
    overflow: "hidden",
  },
  
  
  reviewHeader: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewer: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
  },
  stars: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    gap: 2,
  },
  comment: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#444",
    textAlign: I18nManager.isRTL ? "right" : "left",
    marginTop: 8,
  },
  empty: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 60,
  },
  averageText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  averageHighlight: {
    fontFamily: "InterBold",
    color: "#215432", // ✅ green rating
  },
  ratingHeader: {
    backgroundColor: "#215432", // ✅ green top bar
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ratingText: {
    fontFamily: "InterBold",
    fontSize: 14,
    color: "#ffffff",
  },
  
  
});
