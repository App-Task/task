import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator } from "react-native";





const { width } = Dimensions.get("window");

export default function ViewBidsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { taskId } = route.params;

  const [bids, setBids] = useState([]);
  const [acceptedBidId, setAcceptedBidId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      console.log("📦 Fetching bids for taskId:", taskId);

      const fetchBids = async () => {
        try {
          const res = await axios.get(`https://task-kq94.onrender.com/api/bids/task/${taskId}`);
          console.log("✅ Bids fetched successfully:", res.data);

          setBids(res.data);

          const accepted = res.data.find((bid) => bid.status === "Accepted");
          if (accepted) {
            console.log("🔒 Already accepted bid:", accepted._id);
            setAcceptedBidId(accepted._id);
          } else {
            setAcceptedBidId(null);
          }

          const taskerIds = res.data.map((bid) => bid.taskerId?._id).filter(Boolean);
          const reviewMap = {};

          await Promise.all(
            taskerIds.map(async (id) => {
              try {
                const reviewRes = await axios.get(
                  `https://task-kq94.onrender.com/api/reviews/tasker/${id}`
                );
                reviewMap[id] = reviewRes.data;
              } catch (err) {
                console.warn(`⚠️ Failed to fetch review for tasker ${id}`);
              }
            })
          );

          setReviews(reviewMap);
        } catch (err) {
          console.error("❌ Failed to load bids:", err.message);
          if (err.response) {
            console.log("❌ Backend response:", err.response.data);
            console.log("❌ Status code:", err.response.status);
            console.log("❌ Full error object:", err.toJSON());
          }
        } finally {
          setLoading(false);
        }
      };

      fetchBids();

      return () => {};
    }, [taskId])
  );

  const handleAccept = async (bid) => {
    try {
      const res = await axios.put(`https://task-kq94.onrender.com/api/bids/${bid._id}/accept`);
      console.log("✅ Bid accepted:", res.data);

      setAcceptedBidId(bid._id);

      Alert.alert(
        t("clientViewBids.acceptedTitle"),
        t("clientViewBids.acceptedMessage", {
          name: bid.taskerId?.name || "Tasker",
        })
      );
    } catch (err) {
      console.error("❌ Accept bid error:", err.message);
      Alert.alert("Error", "Something went wrong while accepting the bid.");
    }
  };

  const handleChat = (bid) => {
    const name = bid.taskerId?.name || "Tasker";
    const otherUserId = bid.taskerId?._id;
    console.log("💬 Navigating to Chat with:", { name, otherUserId });
    navigation.navigate("Chat", { name, otherUserId });
  };

  const renderBid = ({ item }) => {
    const isThisAccepted = item._id === acceptedBidId || item.status === "Accepted";
    const alreadyPicked = acceptedBidId && item._id !== acceptedBidId;

    const review = reviews[item.taskerId?._id];
    const average = review?.average;
    const comment = review?.latest?.comment;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.name}>{item.taskerId?.name || "Tasker"}</Text>
          <Text style={styles.price}>{item.amount} SAR</Text>
        </View>

        {average && (
          <Text style={styles.review}>
            ⭐ {average.toFixed(1)}
          </Text>
        )}


        <Text style={styles.message}>{item.message}</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.chatBtn} onPress={() => handleChat(item)}>
            <Text style={styles.chatText}>{t("clientViewBids.chat")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.acceptBtn,
              isThisAccepted
                ? { backgroundColor: "gray" }
                : alreadyPicked
                ? { backgroundColor: "#ccc" }
                : {},
            ]}
            onPress={() => {
              if (!acceptedBidId) {
                handleAccept(item);
              }
            }}
            disabled={!!acceptedBidId}
          >
            <Text style={styles.acceptText}>
              {isThisAccepted
                ? "Accepted"
                : alreadyPicked
                ? "Already picked a tasker"
                : t("clientViewBids.accept")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#213729" />
          </TouchableOpacity>
          <Text style={styles.title}>{t("clientViewBids.title")}</Text>
          <View style={styles.backBtn} />
        </View>

        {loading ? (
  <ActivityIndicator
    size="large"
    color="#213729"
    style={{ marginTop: 50 }}
  />
) : (
  <FlatList

            data={bids}
            keyExtractor={(item) => item._id}
            renderItem={renderBid}
            ListEmptyComponent={
              <Text style={styles.empty}>{t("clientViewBids.noBids")}</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
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
    backgroundColor: "#ffffff",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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
  listContent: {
    paddingBottom: 60,
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  name: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
  },
  price: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#215432",
  },
  message: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chatBtn: {
    backgroundColor: "#c1ff72",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  chatText: {
    color: "#213729",
    fontFamily: "InterBold",
  },
  acceptBtn: {
    backgroundColor: "#213729",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  acceptText: {
    color: "#ffffff",
    fontFamily: "InterBold",
  },
  empty: {
    fontFamily: "Inter",
    textAlign: "center",
    marginTop: 40,
    color: "#999",
    fontSize: 14,
  },
  review: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
    fontStyle: "italic",
  },
});
