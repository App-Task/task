import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  I18nManager,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons"; // ✅ icon package
import { useNavigation } from "@react-navigation/native"; // ✅ for back navigation
import axios from "axios";
import { fetchCurrentUser } from "../../services/auth"; // or your actual path


const { width } = Dimensions.get("window");


export default function TaskDetailsScreen({ route }) {
  const { task: initialTask } = route.params;
  const [task, setTask] = useState(initialTask);
    const { t } = useTranslation();
  const navigation = useNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingBid, setLoadingBid] = useState(true); // ✅ NEW
  const isBiddingAllowed = task.status === "Pending";





  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const user = await fetchCurrentUser();
        if (isMounted) setIsVerified(user.isVerified);
  
        const res = await axios.get(`https://task-kq94.onrender.com/api/bids/tasker/${user._id}`);
        const bids = res.data;
        const foundBid = bids.find((b) => b.taskId?._id === task._id || b.taskId === task._id);
  
        if (foundBid && isMounted) {
          setExistingBid(foundBid);
          setBidAmount(String(foundBid.amount));
          setMessage(foundBid.message);
        }
      } catch (err) {
        console.error("❌ Failed to check user or bid:", err.message);
      } finally {
        if (isMounted) setLoadingBid(false); // ✅ Mark bid as loaded
      }
      
    };
  
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchFullTask = async () => {
      try {
        const res = await axios.get(`https://task-kq94.onrender.com/api/tasks/${initialTask._id}`);
        setTask(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch full task:", err.message);
      }
    };
  
    fetchFullTask();
  }, []);
  
  
  

  const [bidAmount, setBidAmount] = useState("");
const [message, setMessage] = useState("");
const [isVerified, setIsVerified] = useState(true);
const [existingBid, setExistingBid] = useState(null); // ✅ NEW



const handleBid = async () => {
  if (existingBid) {
    Alert.alert("Already Bid", "You’ve already submitted a bid for this task.");
    return;
  }

  if (!bidAmount || !message) {
    Alert.alert(t("taskerTaskDetails.errorTitle"), t("taskerTaskDetails.fillFields"));
    return;
  }
  
  if (Number(bidAmount) < 0.1) {
    Alert.alert(t("taskerTaskDetails.invalidBidTitle"), t("taskerTaskDetails.invalidBidMessage"));
    return;
  }
  
  

  try {
    setSubmitting(true); // ✅ Show popup

    const user = await fetchCurrentUser();

    if (!user.isVerified) {
      setSubmitting(false);
      Alert.alert("Access Denied", "You must be verified to place a bid.");
      return;
    }

    const res = await axios.post("https://task-kq94.onrender.com/api/bids", {
      taskId: task._id,
      taskerId: user._id,
      amount: Number(bidAmount),
      message,
    });

    setSubmitting(false); // ✅ Hide popup

    Alert.alert(
      t("taskerTaskDetails.successTitle"),
      t("taskerTaskDetails.bidSent"),
      [
        {
          text: "OK",
          onPress: () => {
            navigation.setParams({ refresh: true });
            navigation.goBack();
          }
          
        },
      ]
    );

    setBidAmount("");
    setMessage("");
  } catch (err) {
    console.error("❌ Bid error:", err.message);
    setSubmitting(false);
    Alert.alert("Error", "Something went wrong while submitting the bid.");
  }
};

const handleUpdateBid = async () => {
  if (!existingBid) {
    Alert.alert("No Bid Found", "You haven't submitted a bid for this task yet.");
    return;
  }

  if (task.status !== "Pending") {
    Alert.alert("Cannot Edit", "This task is no longer accepting bids.");
    return;
  }


  if (!bidAmount || !message) {
    Alert.alert(t("taskerTaskDetails.errorTitle"), t("taskerTaskDetails.fillFields"));
    return;
  }
  
  if (Number(bidAmount) < 0.1) {
    Alert.alert(t("taskerTaskDetails.invalidBidTitle"), t("taskerTaskDetails.invalidBidMessage"));
    return;
  }
  
  

  try {
    setSubmitting(true);

    const res = await axios.patch(`https://task-kq94.onrender.com/api/bids/${existingBid._id}`, {
      amount: Number(bidAmount),
      message,
    });

    Alert.alert(
      t("taskerTaskDetails.successTitle"),
      t("taskerTaskDetails.bidSent"),
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
    

    setExistingBid(res.data); // update local state
  } catch (err) {
    console.error("❌ Update bid error:", err.message);
    Alert.alert("Error", "Something went wrong while updating the bid.");
  } finally {
    setSubmitting(false);
  }
};


const getStatusColor = (status) => {
  switch (status) {
    case "Accepted":
      return "#2e7d32";
    case "Rejected":
      return "#c62828";
    case "Pending":
    default:
      return "#666";
  }
};

const getStatusStyle = (status) => {
  switch (status) {
    case "Completed":
      return { backgroundColor: "#4CAF50" }; // Green
    case "Pending":
      return { backgroundColor: "#FF9800" }; // Orange
    case "Started":
      return { backgroundColor: "#FFEB3B" }; // Yellow
    case "Cancelled":
      return { backgroundColor: "#F44336" }; // Red
    default:
      return { backgroundColor: "#999" }; // Grey
  }
};


  
  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={30} color="#213729" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>

<View style={styles.topContent}>
  <View style={styles.topRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.heading}>{task.title}</Text>
      <Text style={styles.subText}>Offered Price: {task.budget} BHD</Text>
      <Text style={styles.subText}>
        {new Date(task.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}{" "}
        • {new Date(task.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>

    <View style={[styles.statusBadge, getStatusStyle(task.status)]}>
      <Text style={styles.statusText}>{task.status}</Text>
    </View>
  </View>
</View>

<View style={styles.detailsBox}>
  <Text style={styles.detailsText}>
    <Text style={{ fontFamily: "InterBold" }}>Description: </Text>
    {task.description || "-"}
  </Text>

  <Text style={[styles.detailsText, { marginTop: 12, fontFamily: "InterBold" }]}>Images:</Text>
  <View style={styles.imageRow}>
    {task.images?.length > 0 ? (
      task.images.map((uri, i) => (
        <TouchableOpacity key={i} onPress={() => setSelectedImage(uri)}>
          <Image source={{ uri }} style={styles.image} />
        </TouchableOpacity>
      ))
    ) : (
      <Text style={styles.detailsText}>No images</Text>
    )}
  </View>

  <Text style={[styles.detailsText, { marginTop: 12 }]}>
    <Text style={{ fontFamily: "InterBold" }}>Location: </Text>
    {task.location}
  </Text>

  <Text style={[styles.detailsText, { marginTop: 12 }]}>
    <Text style={{ fontFamily: "InterBold" }}>Category: </Text>
    {task.category || "-"}
  </Text>

  {/* Place Your Bid */}
  <Text style={[styles.detailsText, { marginTop: 12, fontFamily: "InterBold" }]}>Place Your Bid:</Text>
  <TextInput
  style={[
    styles.input,
    !isBiddingAllowed && { backgroundColor: "#ccc", color: "#666" }
  ]}
  placeholder="Bid (BHD)"
  value={bidAmount}
  onChangeText={isBiddingAllowed ? setBidAmount : undefined}
  keyboardType="numeric"
  editable={isBiddingAllowed}
  selectTextOnFocus={isBiddingAllowed}
  placeholderTextColor="#999"
/>

<TextInput
  style={[
    styles.input,
    styles.textarea,
    !isBiddingAllowed && { backgroundColor: "#ccc", color: "#666" }
  ]}
  placeholder="Message to Client (150 characters max).."
  value={message}
  onChangeText={isBiddingAllowed ? setMessage : undefined}
  editable={isBiddingAllowed}
  selectTextOnFocus={isBiddingAllowed}
  multiline
  maxLength={150}
  textAlignVertical="top"
  placeholderTextColor="#999"
/>

<TouchableOpacity
  style={[
    styles.whiteButton,
    (!isVerified || !isBiddingAllowed) && { backgroundColor: "#ccc" }
  ]}
  onPress={
    isBiddingAllowed
      ? existingBid
        ? handleUpdateBid
        : handleBid
      : null
  }
  disabled={!isVerified || !isBiddingAllowed}
>
  <Text style={styles.whiteButtonText}>
    {!isBiddingAllowed
      ? "Bidding Closed"
      : existingBid
      ? "Update Bid"
      : "Submit Bid"}
  </Text>
</TouchableOpacity>



</View>



{selectedImage && (
  <View style={styles.fullScreenOverlay}>
    <TouchableOpacity
      style={styles.closeButton}
      onPress={() => setSelectedImage(null)}
    >
      <Ionicons name="close" size={32} color="#fff" />
    </TouchableOpacity>

    <Image
      source={{ uri: selectedImage }}
      style={styles.fullScreenImage}
      resizeMode="contain"
    />
  </View>
)}





        <View style={{ height: 40 }} />
      </ScrollView>

      {submitting && (
  <View style={styles.submittingOverlay}>
    <View style={styles.submittingBox}>
      <Text style={styles.submittingText}>{t("taskerTaskDetails.submittingBid")}</Text>
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
  backButton: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  container: {
    backgroundColor: "#ffffff",
    padding: 24,
    paddingBottom: 60,
  },
  imageRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  
  title: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#213729",
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  label: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432",
    marginBottom: 4,
    marginTop: 18,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  text: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    marginBottom: 16,
  },
  textarea: {
    height: 120,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },

  verifyBanner: {
    backgroundColor: "#fff4e6",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifyText: {
    color: "#FFA500",
    fontFamily: "InterBold",
    fontSize: 14,
    textAlign: "center",
  },

  existingBidBox: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },

  fullScreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },

  closeButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10000,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 6,
  },

  submittingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  
  submittingBox: {
    backgroundColor: "#ffffff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  
  submittingText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 26,
    color: "#213729",
    marginBottom: 4,
  },
  subText: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
    fontWeight: "900",
  },
  topContent: {
    marginTop: 10,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 13,
  },
  detailsBox: {
    backgroundColor: "#215432",
    padding: 16,
    borderRadius: 20,
    marginTop: 16,
    flex: 1, // ✅ fills the remaining space
    minHeight: Dimensions.get("window").height * 0.7, // ✅ makes it tall even if content is small
    justifyContent: "space-between", // ✅ pushes content & buttons apart
  },
  
  detailsText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  whiteButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  whiteButtonText: {
    color: "#215432",
    fontFamily: "InterBold",
    fontSize: 15,
  },
  
  
  
  
  
});
