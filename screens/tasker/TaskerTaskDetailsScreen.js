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
      
    };
  
    init();
    return () => {
      isMounted = false;
    };
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
          onPress: () =>
            navigation.navigate("TaskerHome", {
              screen: "ExploreTasks",
              params: { refresh: true },
            }),
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
  if (task.status !== "Pending") {
    Alert.alert("Cannot Edit", "This task is no longer accepting bids.");
    return;
  }

  if (!bidAmount || !message) {
    Alert.alert(t("taskerTaskDetails.errorTitle"), t("taskerTaskDetails.fillFields"));
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

  
  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#213729" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        {task.images?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
            {task.images.map((uri, i) => (
  <TouchableOpacity key={i} onPress={() => setSelectedImage(uri)}>
    <Image source={{ uri }} style={styles.image} />
  </TouchableOpacity>
))}

          </ScrollView>
        )}

        <Text style={styles.title}>{task.title}</Text>

        <Text style={styles.label}>{t("taskerTaskDetails.location")}</Text>
        <Text style={styles.text}>{task.location}</Text>

        <Text style={styles.label}>{t("taskerTaskDetails.price")}</Text>
        <Text style={styles.text}>{task.budget} BHD</Text>
        <Text style={styles.label}>{t("taskerTaskDetails.description")}</Text>
        <Text style={styles.text}>{task.description || "-"}</Text>
        <Text style={styles.label}>{t("taskerTaskDetails.category")}</Text>
        <Text style={styles.text}>{task.category || "-"}</Text>



        {existingBid && !existingBid.isAccepted && task.status === "Pending" ? (
  <>
    <Text style={styles.label}>{t("taskerTaskDetails.editYourBid")}</Text>
    <TextInput
      style={styles.input}
      placeholder={t("taskerTaskDetails.bidAmount")}
      value={bidAmount}
      onChangeText={setBidAmount}
      keyboardType="numeric"
      textAlign={I18nManager.isRTL ? "right" : "left"}
      placeholderTextColor="#999"
    />
    <TextInput
      style={[styles.input, styles.textarea]}
      placeholder={t("taskerTaskDetails.bidMessage")}
      value={message}
      onChangeText={setMessage}
      multiline
      maxLength={150}
      textAlignVertical="top"
      textAlign={I18nManager.isRTL ? "right" : "left"}
      placeholderTextColor="#999"
    />
    <TouchableOpacity
      style={[styles.button, submitting && { backgroundColor: "#ccc" }]}
      onPress={handleUpdateBid}
      disabled={submitting}
    >
      <Text style={styles.buttonText}>
        {submitting ? t("taskerTaskDetails.submitting") : t("taskerTaskDetails.updateBid")}
      </Text>
    </TouchableOpacity>
  </>
) : loadingBid ? (
  <View style={styles.existingBidBox}>
    <Text style={styles.label}>{t("taskerTaskDetails.loadingBid")}</Text>
    <Text style={styles.text}>...</Text>
  </View>
) : existingBid ? (
  <View style={styles.existingBidBox}>
    <Text style={styles.label}>Your Bid:</Text>
    <Text style={styles.text}>{existingBid.amount} BHD</Text>
    <Text style={styles.label}>Your Message:</Text>
    <Text style={styles.text}>{existingBid.message}</Text>

    {existingBid.status && (
      <>
        <Text style={styles.label}>{t("taskerTaskDetails.status")}</Text>
        <Text style={[styles.text, { color: getStatusColor(existingBid.status) }]}>
          {existingBid.status}
        </Text>
      </>
    )}
  </View>
) : task.status !== "Pending" ? (
  <Text style={styles.text}>
    {t("taskerTaskDetails.taskClosedMessage") || "This task is no longer accepting bids."}
  </Text>
) : (
  <>
    <Text style={styles.label}>{t("taskerTaskDetails.enterBid")}</Text>
    <TextInput
      style={styles.input}
      placeholder={t("taskerTaskDetails.bidAmount")}
      value={bidAmount}
      onChangeText={setBidAmount}
      keyboardType="numeric"
      textAlign={I18nManager.isRTL ? "right" : "left"}
      placeholderTextColor="#999"
    />
    <TextInput
      style={[styles.input, styles.textarea]}
      placeholder={t("taskerTaskDetails.bidMessage")}
      value={message}
      onChangeText={setMessage}
      multiline
      maxLength={150}
      textAlignVertical="top"
      textAlign={I18nManager.isRTL ? "right" : "left"}
      placeholderTextColor="#999"
    />
    {!isVerified && (
      <View style={styles.verifyBanner}>
        <Text style={styles.verifyText}>You must be verified to place a bid.</Text>
      </View>
    )}
    <TouchableOpacity
      style={[styles.button, !isVerified && { backgroundColor: "#ccc" }]}
      onPress={handleBid}
      disabled={!isVerified}
    >
      <Text style={styles.buttonText}>
        {t("taskerTaskDetails.submitBid")}
      </Text>
    </TouchableOpacity>
  </>
)}

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
    marginBottom: 20,
  },
  image: {
    width: width * 0.7,
    height: 160,
    borderRadius: 12,
    marginRight: 14,
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
    right: 20,
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
  
  
  
  
  
});
