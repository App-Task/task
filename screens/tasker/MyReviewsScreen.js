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

const dummyReviews = [
  {
    id: "1",
    reviewer: "Ahmed Ali",
    rating: 5,
    comment: "Great work, very reliable and fast!",
  },
  {
    id: "2",
    reviewer: "Mona Saleh",
    rating: 4,
    comment: "Good service, would recommend.",
  },
];

export default function MyReviewsScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setReviews(dummyReviews);
      setLoading(false);
    }, 1000);
  }, []);

  const averageRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0
  ).toFixed(1);

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
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewer}>{item.reviewer}</Text>
        <View style={styles.stars}>{renderStars(item.rating)}</View>
      </View>
      <Text style={styles.comment}>{item.comment}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#213729"
          />
        </TouchableOpacity>
        <Text style={styles.header}>{t("taskerReviews.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.averageBox}>
        <Text style={styles.averageLabel}>{t("taskerReviews.average")}:</Text>
        <Text style={styles.averageValue}>{averageRating}</Text>
        <Ionicons name="star" size={22} color="#c1ff72" />
      </View>

      {loading ? (
        <ActivityIndicator color="#213729" size="large" style={{ marginTop: 40 }} />
      ) : reviews.length === 0 ? (
        <Text style={styles.empty}>{t("taskerReviews.empty")}</Text>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
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
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    textAlign: "center",
    flex: 1,
  },
  averageBox: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    marginBottom: 20,
  },
  averageLabel: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#213729",
    marginRight: 8,
  },
  averageValue: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#213729",
    marginRight: 6,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  },
  empty: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 60,
  },
});
