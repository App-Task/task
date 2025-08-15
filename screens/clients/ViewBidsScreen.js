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
  const [accepting, setAccepting] = useState(false);


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
      setAccepting(true); // Show the overlay
      const res = await axios.put(`https://task-kq94.onrender.com/api/bids/${bid._id}/accept`);
      console.log("✅ Bid accepted:", res.data);
  
      setAcceptedBidId(bid._id);
      setAccepting(false); // Hide the overlay
  
      Alert.alert(
        t("clientViewBids.acceptedTitle"),
        t("clientViewBids.acceptedMessage", {
          name: bid.taskerId?.name || "Tasker",
        }),
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("ClientHome", {
                screen: "Tasks",
                params: { refreshTasks: true, targetTab: "Started" },
              });
            },
          },
        ]
      );
    } catch (err) {
      setAccepting(false); // Hide on error too
      console.error("❌ Accept bid error:", err.message);
      Alert.alert(t("common.errorTitle"), t("clientViewBids.acceptError"));
    }
  };
  

  const handleChat = (bid) => {
    const name = bid.taskerId?.name || "Tasker";
    const otherUserId = bid.taskerId?._id;
    console.log("💬 Navigating to Chat with:", { name, otherUserId });
    navigation.navigate("Chat", { name, otherUserId });
  };
  const renderBid = ({ item }) => {
    const isThisAccepted =
      item._id === acceptedBidId || item.status === "Accepted";
    const alreadyPicked = acceptedBidId && item._id !== acceptedBidId;
  
    const review = reviews[item.taskerId?._id];
    const average = review?.average;
    const comment = review?.latest?.comment;
  
    return (
      <View style={styles.card}>
        {/* ✅ Tasker Info Header */}
        <View style={styles.taskerHeader}>
          <View>
            <Text style={styles.taskerName}>
              {item.taskerId?.name || "Tasker"}
            </Text>
            {average && (
              <Text style={styles.taskerRating}>⭐ {average.toFixed(1)}</Text>
            )}
          </View>
  
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("TaskerProfile", {
                taskerId: item.taskerId?._id,
              })
            }
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
          </TouchableOpacity>
        </View>
  
        {/* ✅ Price and Message */}
        <View style={{ padding: 16 }}>
          <Text style={styles.priceOffered}>
            Price offered:{" "}
            <Text style={{ fontWeight: "bold" }}>{item.amount} BHD</Text>
          </Text>
          {item.message ? (
            <Text style={styles.message}>{item.message}</Text>
          ) : null}
        </View>
  
        {/* ✅ Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => handleChat(item)}
          >
            <Text style={styles.chatText}>{t("clientViewBids.chat")}</Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={[
              styles.acceptBtn,
              isThisAccepted
                ? { backgroundColor: "#888" }
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
                ? "Tasker already selected"
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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={30} color="#215432" />
        </TouchableOpacity>
        <Text style={styles.title}>Bids Received</Text>
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


      {accepting && (
  <View style={styles.acceptingOverlay}>
    <View style={styles.acceptingBox}>
      <ActivityIndicator size="large" color="#213729" style={{ marginBottom: 10 }} />
      <Text style={styles.acceptingText}>{t("clientViewBids.acceptingBid")}</Text>
    </View>
  </View>
)}

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
    paddingTop: 10, // Reduced to push content closer to arrow
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 20, // Small space below arrow
  },
  
  title: {
    fontFamily: "InterBold",
    fontSize: 26,
    color: "#213729",
    marginBottom: -30, // reduced spacing
  },
  
  listContent: {
    paddingBottom: 60,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1, // Add thin border
    borderColor: "#cccccc", // Light gray border like in the picture
    marginBottom: 16,
    overflow: "hidden", // So the green header connects perfectly to the white box
  },
  

  taskerHeader: {
    backgroundColor: "#215432",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  

  taskerName: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#ffffff",
  },
  taskerRating: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#c1ff72", // Lime green stars
    marginTop: 2,
  },

  taskerPrice: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#ffffff",
  },

  viewProfileText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#ffffff",
    textDecorationLine: "underline",
  },

  priceOffered: {
    fontFamily: "InterBold",
    fontSize: 14,
    color: "#000",
    marginBottom: 6,
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
    flex: 1,
    borderWidth: 1,
    borderColor: "#215432",
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#ffffff",
  },
  chatText: {
    color: "#215432",
    fontFamily: "InterBold",
  },
  acceptBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#215432",
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  acceptText: {
    color: "#215432",
    fontFamily: "InterBold",
  },
  empty: {
    fontFamily: "Inter",
    textAlign: "center",
    marginTop: 40,
    color: "#999",
    fontSize: 14,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },


  acceptingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  acceptingBox: {
    backgroundColor: "#ffffff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  acceptingText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
  },

  
  
});
