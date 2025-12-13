import React, { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  I18nManager,
  Linking,
  TextInput,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getTaskById } from "../../services/taskService";
import { useIsFocused } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import Modal from "react-native-modal";
const { width, height } = Dimensions.get("window");

export default function TaskDetailsViewBidsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { task: initialTask, showProfileTabs = false, showOffersTab = false } = route.params;

  const [task, setTask] = useState(initialTask);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [bids, setBids] = useState([]);
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [coords, setCoords] = useState(null);
  const [activeTab, setActiveTab] = useState(showProfileTabs ? "profile" : (showOffersTab ? "offers" : "details"));
  const [acceptedBidId, setAcceptedBidId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [accepting, setAccepting] = useState(false);
  
  // Tasker profile states
  const [tasker, setTasker] = useState(null);
  const [taskerReviewData, setTaskerReviewData] = useState({ reviews: [] });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [reportBid, setReportBid] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isFocused) {
      fetchTask();
      // If we're showing profile tabs and have a taskerId, fetch the profile and switch to profile tab
      if (showProfileTabs && route.params?.taskerId) {
        fetchTaskerProfile(route.params.taskerId);
        setActiveTab("profile"); // Automatically switch to profile tab
      }
    }
  }, [isFocused, showProfileTabs, route.params?.taskerId]);

  const fetchTask = async () => {
    try {
      const freshTask = await getTaskById(initialTask._id);
      setTask(freshTask);

      const res = await fetch(`https://task-kq94.onrender.com/api/bids/task/${initialTask._id}`);
      const bidData = await res.json();
      setBids(bidData);

      // Check for accepted bid
      const accepted = bidData.find((bid) => bid.status === "Accepted");
      if (accepted) {
        setAcceptedBidId(accepted._id);
      } else {
        setAcceptedBidId(null);
      }

      // Fetch reviews for taskers
      const taskerIds = bidData.map((bid) => bid.taskerId?._id).filter(Boolean);
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
      console.error("❌ Task fetch failed:", err.message);
      Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.loadTaskError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTask();
    if (tasker && tasker._id) {
      await fetchTaskerProfile(tasker._id);
    }
  };

  // Derive coords from task
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (typeof task?.latitude === "number" && typeof task?.longitude === "number") {
          if (!cancelled) setCoords({ latitude: task.latitude, longitude: task.longitude });
          return;
        }
        if (typeof task?.location === "string") {
          const match = task.location.match(/-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?/);
          if (match) {
            const [lat, lng] = match[0].split(",").map((v) => parseFloat(v.trim()));
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              if (!cancelled) setCoords({ latitude: lat, longitude: lng });
              return;
            }
          }
        }
        if (task?.location) {
          const results = await Location.geocodeAsync(task.location);
          if (results && results[0] && !cancelled) {
            setCoords({ latitude: results[0].latitude, longitude: results[0].longitude });
          }
        }
      } catch (e) {
        console.log("Geocoding error:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [task?.location, task?.latitude, task?.longitude]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#4CAF50";
      case "Pending":
        return "#FF9800";
      case "Started":
      case "In Progress":
        return "#FFB74D";
      case "Cancelled":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const openInGoogleMaps = async (lat, lng, labelRaw = t("common.taskLocation")) => {
    try {
      const label = encodeURIComponent(labelRaw || t("common.taskLocation"));
      const appUrl = `comgooglemaps://?q=${lat},${lng}(${label})&center=${lat},${lng}&zoom=14`;
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) return Linking.openURL(appUrl);
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert(t("common.errorTitle"), t("common.mapError"));
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      t("clientTaskDetails.cancelTaskConfirmTitle"),
      t("clientTaskDetails.cancelTaskConfirmMessage"),
      [
        { text: t("clientTaskDetails.no") },
        {
          text: t("clientTaskDetails.yes"),
          onPress: () => {
            SecureStore.getItemAsync("userId").then(async (clientId) => {
              if (!clientId) {
                Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.userIdNotFound"));
                return;
              }
              try {
                setCanceling(true);
                const cancelPayload = { cancelledBy: clientId };
                const res = await fetch(
                  `https://task-kq94.onrender.com/api/tasks/${task._id}/cancel`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(cancelPayload),
                  }
                );
                if (!res.ok) throw new Error("Failed to cancel task");
                setCanceling(false);
                Alert.alert(t("clientTaskDetails.taskCancelled"));
                navigation.navigate("ClientHome", {
                  screen: "Tasks",
                  params: {
                    refreshTasks: true,
                    targetTab: "Previous",
                    subTab: "Cancelled",
                    unique: Date.now(),
                  },
                });
              } catch (err) {
                setCanceling(false);
                Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.cancelTaskError"));
              }
            });
          },
        },
      ]
    );
  };
  const handleAccept = async (bid) => {
    try {
      setAccepting(true);
      const res = await axios.put(`https://task-kq94.onrender.com/api/bids/${bid._id}/accept`);
      console.log("✅ Bid accepted:", res.data);

      setAcceptedBidId(bid._id);
      setAccepting(false);

      Alert.alert(
        t("clientViewBids.acceptedTitle"),
        t("clientViewBids.acceptedMessage", {
          name: bid.taskerId?.name || t("clientViewBids.taskerFallbackName"),
        }),
        [
          {
            text: t("clientViewBids.ok"),
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
      setAccepting(false);
      console.error("❌ Accept bid error:", err.message);
      Alert.alert(t("common.errorTitle"), t("clientViewBids.acceptError"));
    }
  };

  const handleChat = (bid) => {
    const name = bid.taskerId?.name || t("clientViewBids.taskerFallbackName");
    const otherUserId = bid.taskerId?._id;
    console.log("💬 Navigating to Chat with:", { name, otherUserId });
    navigation.navigate("Chat", { name, otherUserId });
  };

  const handleReport = (bid) => {
    setReportBid(bid);
    setShowReportModal(true);
  };

  const handleViewProfile = (bid) => {
    navigation.navigate("TaskerProfile", { 
      taskerId: bid.taskerId?._id,
      taskId: task._id
    });
  };

  // Tasker profile functions
  const fetchTaskerProfile = async (taskerId) => {
    try {
      const [userRes, reviewRes] = await Promise.all([
        axios.get(`https://task-kq94.onrender.com/api/users/${taskerId}`),
        axios.get(`https://task-kq94.onrender.com/api/reviews/all/tasker/${taskerId}`),
      ]);
      setTasker(userRes.data);
      setTaskerReviewData({ reviews: reviewRes.data || [] });
    } catch (err) {
      console.error("❌ Error loading tasker profile:", err.message);
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    
    setIsReporting(true);
    try {
      const userId = await SecureStore.getItemAsync("userId");
      // Determine which tasker to report (from bid or from profile)
      const reportedUserId = reportBid?.taskerId?._id || tasker?._id;
      
      await axios.post("https://task-kq94.onrender.com/api/reports", {
        reporterId: userId,
        reportedUserId: reportedUserId,
        reason: reportReason,
        taskId: task._id,
      });
      
      setIsReporting(false);
      setShowReportModal(false);
      setReportReason("");
      setReportBid(null);
      Alert.alert(t("common.reportSubmitted"), t("common.reportThankYou"));
    } catch (err) {
      setIsReporting(false);
      console.error("❌ Report error:", err.message);
      Alert.alert(t("common.errorTitle"), t("common.reportError"));
    }
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
        {/* Green Header with Tasker Name and Report Icon */}
        <View style={styles.taskerHeader}>
          <Text style={styles.taskerName}>
            {item.taskerId?.name || t("clientViewBids.taskerFallbackName")}
          </Text>
          <TouchableOpacity 
            style={styles.reportIcon}
            onPress={() => handleReport(item)}
          >
            <Ionicons name="flag-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Light Gray Content Section */}
        <View style={styles.cardContent}>
          <Text style={styles.priceOffered}>
            {t("clientViewBids.priceOffered")}: <Text style={styles.priceAmount}>{item.amount} {t("clientViewBids.currency")}</Text>
          </Text>
          {item.message ? (
            <Text style={styles.message}>{item.message}</Text>
          ) : (
            <Text style={styles.message}>
              It is a long established fact that a reader will be distracted by the readable content of a page when It is a long established fact that a reader will be distracted by the readable content of a page when
            </Text>
          )}
        </View>

        {/* Three Action Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewProfile(item)}
          >
            <Text style={styles.actionButtonText}>{t("clientViewBids.viewProfile")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleChat(item)}
          >
            <Text style={styles.actionButtonText}>{t("clientViewBids.chat")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
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
            <Text style={[
              styles.actionButtonText,
              (isThisAccepted || alreadyPicked) && styles.disabledButtonText
            ]}>
              {isThisAccepted
                ? t("clientViewBids.accepted")
                : alreadyPicked
                ? t("clientViewBids.alreadySelected")
                : t("clientViewBids.accept")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return { backgroundColor: "#4CAF50" };
      case "Pending":
        return { backgroundColor: "#FF9800" };
      case "Started":
        return { backgroundColor: "#FFEB3B" };
      case "Cancelled":
        return { backgroundColor: "#F44336" };
      default:
        return { backgroundColor: "#999" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#000000" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const { title, description, budget, images = [] } = task;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with back button - matching ViewBidsScreen structure */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={30} color="#215432" />
          </TouchableOpacity>
          
          <View style={styles.backBtn} />
        </View>

        <View style={styles.tabContainer}>
          {showProfileTabs ? (
            // Profile page: Show Task Details and Tasker Profile
            <>
              <TouchableOpacity
                style={[styles.tab, activeTab === "details" ? styles.activeTab : null]}
                onPress={() => setActiveTab("details")}
              >
                <Text style={[styles.tabText, activeTab === "details" ? styles.activeTabText : null]}>
                  {t("clientTaskDetails.taskDetails")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "profile" ? styles.activeTab : null]}
                onPress={() => {
                  setActiveTab("profile");
                  // Fetch tasker profile when switching to profile tab
                  if (route.params?.taskerId) {
                    fetchTaskerProfile(route.params.taskerId);
                  }
                }}
              >
                <Text style={[styles.tabText, activeTab === "profile" ? styles.activeTabText : null]}>
                  {t("clientTaskDetails.taskerProfile")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Offers page: Show Task Details and Offers
            <>
              <TouchableOpacity
                style={[styles.tab, activeTab === "details" ? styles.activeTab : null]}
                onPress={() => setActiveTab("details")}
              >
                <Text style={[styles.tabText, activeTab === "details" ? styles.activeTabText : null]}>
                  {t("clientTaskDetails.taskDetails")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "offers" ? styles.activeTab : null]}
                onPress={() => setActiveTab("offers")}
              >
                <Text style={[styles.tabText, activeTab === "offers" ? styles.activeTabText : null]}>
                  {t("clientViewBids.title")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {activeTab === "details" ? (
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000000"
                colors={["#000000"]}
                progressBackgroundColor="#ffffff"
              />
            }
          >
            {/* Spacing */}
            <View style={styles.spacing} />

            {/* Divider Above Title */}
            <View style={styles.divider} />

            {/* Task Overview */}
            <View style={styles.taskOverview}>
              <View style={styles.taskTitleRow}>
                <Text style={styles.taskTitle}>{task.title || t("common.taskTitle")}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                  <Text style={styles.statusText}>{t(`clientMyTasks.${task.status?.toLowerCase()}`)}</Text>
                </View>
              </View>
            </View>

            {/* Bottom Divider */}
            <View style={styles.divider} />

            {/* Task Detail Layout */}
            <View style={styles.taskDetailLayout}>
              <View style={styles.taskMeta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{t("clientTaskDetails.postedOn")}</Text>
                  <Text style={styles.metaValue}>{formatDate(task.createdAt)}</Text>
                </View>
                <View style={styles.metaRowRight}>
                  <Text style={styles.metaLabelRight}>{t("clientTaskDetails.budget")}</Text>
                  <Text style={styles.metaValueRight}>{task.budget || "0"} {t("common.currency")}</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("clientTaskDetails.description")}</Text>
              <Text style={styles.descriptionText}>
                {task.description || t("clientTaskDetails.noDescription")}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Images - Only show if there are actual images */}
            {task.images && task.images.length > 0 && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("clientTaskDetails.images")}</Text>
                  <View style={styles.imageContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {task.images.map((uri, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.imagePlaceholder}
                          onPress={() => setPreviewImage(uri)}
                        >
                          <Image source={{ uri }} style={styles.taskImage} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                {/* Divider */}
                <View style={styles.divider} />
              </>
            )}

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("clientTaskDetails.location")}</Text>
              {coords ? (
                <View style={styles.mapPlaceholder}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    pointerEvents="none"
                  >
                    <Marker coordinate={coords} />
                  </MapView>
                </View>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="location-outline" size={32} color="#ccc" />
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonSection}>
              {task.status === "Pending" && (
                <>
                  {bids.length === 0 && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => navigation.navigate("EditTask", { task })}
                    >
                      <Text style={styles.editButtonText}>{t("clientTaskDetails.editTask")}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleDelete}
                    disabled={canceling}
                  >
                    {canceling ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.cancelButtonText}>{t("clientTaskDetails.cancelTask")}</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {task.status === "Started" && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => {
                    Alert.alert(
                      t("clientTaskDetails.markCompletedConfirmTitle"),
                      t("clientTaskDetails.markCompletedConfirmMessage"),
                      [
                        { text: t("clientTaskDetails.no") },
                        {
                          text: t("clientTaskDetails.yes"),
                          onPress: async () => {
                            try {
                              setCompleting(true);
                              await fetch(`https://task-kq94.onrender.com/api/tasks/${task._id}/complete`, { method: "PATCH" });
                              await fetchTask();
                              setCompleting(false);
                              navigation.navigate("ClientHome", {
                                screen: "Tasks",
                                params: {
                                  refreshTasks: true,
                                  targetTab: "Previous",
                                  subTab: "Completed",
                                  unique: Date.now(),
                                },
                              });
                            } catch {
                              setCompleting(false);
                              Alert.alert(t("clientTaskDetails.errorTitle"), t("clientTaskDetails.markCompletedError"));
                            }
                          },
                        },
                      ]
                    );
                  }}
                  disabled={completing}
                >
                  {completing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.completeButtonText}>{t("clientTaskDetails.markAsComplete")}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
        ) : activeTab === "offers" ? (
          <>
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#215433"
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
          </>
        ) : activeTab === "profile" ? (
          <>
            {tasker ? (
              <ScrollView 
                style={styles.profileScrollView} 
                contentContainerStyle={styles.profileScrollContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#000000"
                    colors={["#000000"]}
                    progressBackgroundColor="#ffffff"
                  />
                }
              >
                {/* Big centered avatar */}
                <View style={styles.avatarWrap}>
                  {tasker.profileImage ? (
                    <Image source={{ uri: tasker.profileImage }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {typeof tasker.name === "string" && tasker.name.trim().length > 0
                          ? tasker.name.trim()[0].toUpperCase()
                          : "?"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Name & basics */}
                <View style={styles.infoSection}>
                  <Text style={styles.name}>{tasker.name}</Text>

                  <Text style={styles.profileDetails}>
                    <Text style={styles.profileLabel}>{t("taskerProfile.location")} </Text>
                    {tasker.location || t("taskerProfile.notProvided")}
                  </Text>

                  {/* About section */}
                  <Text style={styles.aboutTitle}>
                    <Text style={styles.aboutBold}>{t("taskerProfile.about")} </Text>
                    {tasker.about || t("taskerProfile.notProvided")}
                  </Text>
                </View>

                {/* Report User Button */}
                <TouchableOpacity 
                  style={styles.reportButton}
                  onPress={() => setShowReportModal(true)}
                >
                  <Text style={styles.reportButtonText}>{t("common.reportUser")}</Text>
                </TouchableOpacity>

                {/* Reviews Section */}
                <View style={styles.reviewsSection}>
                  {/* Reviews Header */}
                  <View style={styles.reviewsHeader}>
                    <Text style={styles.reviewsTitle}>{t("taskerProfile.reviews")}</Text>
                    <Text style={styles.reviewsAvg}>
                      {t("taskerProfile.avgRating")} {taskerReviewData.reviews.length > 0
                        ? (taskerReviewData.reviews.reduce((s, r) => s + (r?.rating || 0), 0) / taskerReviewData.reviews.length).toFixed(1)
                        : "0.0"}
                    </Text>
                  </View>

                  {/* Reviews */}
                  {taskerReviewData.reviews.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.noReviewsTitle}>{t("taskerProfile.noReviewsYet")}</Text>
                      <Text style={styles.noReviewsSubtitle}>{t("taskerProfile.noReviewsSubtitle")}</Text>
                    </View>
                  ) : (
                    taskerReviewData.reviews.map((rev, idx) => (
                      <React.Fragment key={idx}>
                        <View style={styles.reviewCard}>
                          <Text style={styles.reviewTaskTitle}>
                            {rev.taskId?.title || rev.taskTitle || t("common.taskTitle")}
                          </Text>
                          
                          <View style={styles.reviewStarsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={star <= rev.rating ? "star" : "star-outline"}
                                size={16}
                                color="#215432"
                                style={styles.reviewStar}
                              />
                            ))}
                          </View>

                          {rev.comment ? (
                            <Text style={styles.reviewComment}>{rev.comment}</Text>
                          ) : null}
                        </View>
                        {idx < taskerReviewData.reviews.length - 1 && (
                          <View style={styles.reviewDivider} />
                        )}
                      </React.Fragment>
                    ))
                  )}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.profileLoadingContainer}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.profileLoadingText}>{t("taskerProfile.loadingProfile")}</Text>
              </View>
            )}
          </>
        ) : null}

        {/* Image Preview */}
        {previewImage && (
          <View style={styles.previewOverlay}>
            <TouchableOpacity
              style={styles.closePreviewBtn}
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
          </View>
        )}
      </View>

      {/* Loading overlays */}
      {completing && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#000000" style={{ marginBottom: 10 }} />
            <Text style={styles.overlayText}>{t("clientTaskDetails.completingTask")}</Text>
          </View>
        </View>
      )}

      {canceling && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#000000" style={{ marginBottom: 10 }} />
            <Text style={styles.overlayText}>{t("clientTaskDetails.cancelingTask")}</Text>
          </View>
        </View>
      )}

      {/* Report Modal */}
      <Modal isVisible={showReportModal}>
        <View style={styles.modalContainer}>
          {isReporting ? (
            <View style={styles.modalContent}>
              <ActivityIndicator size="large" color="#000000" style={{ marginBottom: 10 }} />
              <Text style={styles.modalText}>{t("common.submittingReport")}</Text>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t("common.reportTasker")}</Text>
              <Text style={styles.modalSubtitle}>
                {t("common.reportDescription")}
              </Text>
              
              <TextInput
                style={styles.reportInput}
                placeholder={t("common.reportPlaceholder")}
                multiline
                numberOfLines={4}
                value={reportReason}
                onChangeText={(text) => {
                  if (text.length <= 300) setReportReason(text);
                }}
                maxLength={300}
              />
              
              <Text style={styles.characterCount}>
                {reportReason.length}/300 {t("common.characters")}
              </Text>

              <View style={[styles.modalButtons, I18nManager.isRTL && styles.modalButtonsRTL]}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowReportModal(false);
                    setReportReason("");
                    setReportBid(null);
                  }}
                >
                  <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSubmitButton,
                    { backgroundColor: reportReason.trim() ? "#F44336" : "#ccc" }
                  ]}
                  onPress={submitReport}
                  disabled={!reportReason.trim()}
                >
                  <Text style={styles.modalSubmitText}>{t("common.submit")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
    paddingTop: 10, // Reduced to push content closer to arrow
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    direction: "ltr",
  },
  
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  
  tabContainer: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    backgroundColor: "#E5E5E5",
    borderRadius: 25,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#215432",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  activeTabText: {
    color: "#fff",
    fontFamily: "InterBold",
  },

    scrollView: {
      flex: 1,
    },
    taskOverview: {
      paddingHorizontal: 0,
      paddingVertical: 20,
    },
    spacing: {
      height: 20,
    },
    taskDetailLayout: {
      paddingHorizontal: 0,
      paddingVertical: 20,
    },
  taskTitleRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitle: {
    flex: 1,
    fontFamily: "InterBold",
    fontSize: 28,
    color: "#215432",
    marginRight: I18nManager.isRTL ? 0 : 12,
    marginLeft: I18nManager.isRTL ? 12 : 0,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  taskMeta: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
    metaRow: {
      flex: 1,
      alignItems: "flex-start",
    },
    metaRowRight: {
      flex: 1,
      alignItems: "flex-end",
    },
    metaLabelRight: {
      fontFamily: "Inter",
      fontSize: 14,
      color: "#666",
      marginBottom: 4,
      textAlign: "right",
    },
    metaValueRight: {
      fontFamily: "InterBold",
      fontSize: 20,
      color: "#215433",
      textAlign: "right",
    },
  metaLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  metaValue: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215433",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
    divider: {
      height: 2,
      backgroundColor: "#e0e0e0",
      marginHorizontal: 0,
      marginVertical: 20,
    },
    section: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
  sectionTitle: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#666666",
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  descriptionText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
    imageContainer: {
      marginTop: 8,
    },
    imagePlaceholder: {
      width: 80,
      height: 80,
      backgroundColor: "#f5f5f5",
      borderRadius: 8,
      marginRight: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    taskImage: {
      width: "100%",
      height: "100%",
      borderRadius: 8,
    },
    mapPlaceholder: {
      height: 150,
      backgroundColor: "#f5f5f5",
      borderRadius: 8,
      marginTop: 8,
      justifyContent: "center",
      alignItems: "center",
    },

    // Button styles
    buttonSection: {
      marginTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    editButton: {
      backgroundColor: "#ffffff",
      borderWidth: 2,
      borderColor: "#215432",
      borderRadius: 25,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    editButtonText: {
      color: "#215432",
      fontFamily: "InterBold",
      fontSize: 16,
    },
    cancelButton: {
      backgroundColor: "#215432",
      borderWidth: 2,
      borderColor: "#215432",
      borderRadius: 25,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    cancelButtonText: {
      color: "#fff",
      fontFamily: "InterBold",
      fontSize: 16,
    },
    completeButton: {
      backgroundColor: "#215432",
      borderWidth: 2,
      borderColor: "#215432",
      borderRadius: 25,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    completeButtonText: {
      color: "#fff",
      fontFamily: "InterBold",
      fontSize: 16,
    },

  // Title section
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 32,
    fontFamily: "InterBold",
    color: "#215432",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 12,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  // Info section
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontFamily: "InterBold",
  },
  budgetValue: {
    fontSize: 16,
    color: "#215432",
    fontFamily: "InterBold",
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 20,
  },

  // Section styling
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#333",
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666",
    lineHeight: 20,
  },

  // Images
  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    backgroundColor: "#E5E5E5",
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },

  // Map
  mapContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E5E5E5",
    height: 180,
  },
  map: {
    width: "100%",
    height: "100%",
  },

  // Buttons
  buttonSection: {
    marginTop: 20,
  },
  editButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#215432",
    borderRadius: 25,  // More rounded/oval
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  editButtonText: {
    color: "#215432",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#215432",  // Green background
    borderWidth: 2,
    borderColor: "#215432",
    borderRadius: 25,  // More rounded/oval
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  cancelButtonText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  completeButton: {
    backgroundColor: "#215432",  // Green background
    borderWidth: 2,
    borderColor: "#215432",
    borderRadius: 25,  // More rounded/oval
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  completeButtonText: {
    color: "#fff",
    fontFamily: "InterBold",
    fontSize: 16,
  },

  // Preview overlay
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  previewImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
  closePreviewBtn: {
    position: "absolute",
    top: 40,
    left: I18nManager.isRTL ? undefined : 20,
    right: I18nManager.isRTL ? 20 : undefined,
    zIndex: 1001,
  },

  // Loading overlays
  overlay: {
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
  overlayBox: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  overlayText: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
  },
    // Bid-related styles
    card: {
      backgroundColor: "#fff",
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#E5E5E5",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    taskerHeader: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#215432", // App's green color
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    taskerName: {
      fontSize: 18,
      fontFamily: "InterBold",
      color: "#ffffff",
      textAlign: I18nManager.isRTL ? "right" : "left",
    },
    reportIcon: {
      padding: 4,
    },
    cardContent: {
      backgroundColor: "#f5f5f5", // Light gray like in image
      padding: 16,
    },
    priceOffered: {
      fontSize: 14,
      fontFamily: "Inter",
      color: "#666",
      marginBottom: 12,
      textAlign: I18nManager.isRTL ? "right" : "left",
    },
    priceAmount: {
      fontFamily: "InterBold",
      color: "#333",
    },
    message: {
      fontSize: 14,
      fontFamily: "Inter",
      color: "#666",
      lineHeight: 20,
      textAlign: I18nManager.isRTL ? "right" : "left",
    },
    buttonsRow: {
      flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
      backgroundColor: "#f5f5f5", // Light gray background
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 8,
    },
    actionButton: {
      flex: 1,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#215432", // App's green border
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    actionButtonText: {
      fontFamily: "Inter",
      fontSize: 14,
      color: "#333",
      textAlign: "center",
    },
    disabledButtonText: {
      color: "#999",
    },
    empty: {
      textAlign: "center",
      fontSize: 16,
      fontFamily: "Inter",
      color: "#666",
      marginTop: 50,
    },
    listContent: {
      paddingTop: 10,
      paddingBottom: 20,
    },

    // Tasker profile styles
    profileScrollView: {
      flex: 1,
      backgroundColor: "#ffffff",
    },
    profileScrollContent: {
      paddingBottom: 40,
      backgroundColor: "#ffffff",
    },
    profileLoadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 50,
    },
    profileLoadingText: {
      marginTop: 10,
      fontSize: 16,
      color: "#666",
      fontFamily: "Inter",
    },
    avatarWrap: {
      alignItems: "center",
      marginTop: 20,
      marginBottom: 20,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: "#ffffff",
      backgroundColor: "#e8efe9",
    },
    avatarFallback: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#215432",
      borderWidth: 3,
      borderColor: "#ffffff",
    },
    avatarFallbackText: {
      fontFamily: "InterBold",
      fontSize: 40,
      color: "#ffffff",
    },
    infoSection: {
      alignSelf: "stretch",
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    name: {
      fontSize: 22,
      fontFamily: "InterBold",
      color: "#215432",
      textAlign: "center",
      marginBottom: 12,
    },
    profileDetails: {
      fontSize: 14,
      color: "#616161",
      textAlign: "center",
      marginBottom: 8,
    },
    profileLabel: {
      fontFamily: "InterBold",
      color: "#215432",
    },
    aboutTitle: {
      fontFamily: "Inter",
      fontSize: 14,
      color: "#616161",
      lineHeight: 20,
      marginTop: 12,
      textAlign: "center",
    },
    aboutBold: { 
      fontFamily: "InterBold", 
      color: "#215432" 
    },
    reportButton: {
      backgroundColor: "#F44336",
      borderRadius: 8,
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: "center",
      marginBottom: 20,
      alignSelf: "stretch",
      marginHorizontal: 20,
    },
    reportButtonText: {
      color: "#ffffff",
      fontFamily: "InterBold",
      fontSize: 16,
    },
    reviewsSection: {
      marginTop: 20,
      paddingHorizontal: 20,
    },
    reviewsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    reviewsTitle: { 
      fontFamily: "InterBold", 
      fontSize: 16, 
      color: "#215432" 
    },
    reviewsAvg: { 
      fontFamily: "InterBold", 
      fontSize: 14, 
      color: "#215432" 
    },
    emptyContainer: {
      alignItems: "center",
      marginTop: 20,
    },
    noReviewsTitle: {
      fontFamily: "InterBold",
      fontSize: 18,
      color: "#215432",
      textAlign: "center",
      marginBottom: 8,
    },
    noReviewsSubtitle: {
      fontFamily: "Inter",
      fontSize: 14,
      color: "#616161",
      textAlign: "center",
    },
    reviewCard: {
      backgroundColor: "transparent",
      borderRadius: 0,
      padding: 0,
      marginBottom: 16,
    },
    reviewTaskTitle: {
      fontFamily: "InterBold",
      fontSize: 14,
      color: "#215432",
      marginBottom: 8,
      textAlign: "left",
    },
    reviewStarsContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    reviewStar: {
      marginRight: 2,
    },
    reviewComment: { 
      fontFamily: "Inter", 
      fontSize: 13, 
      color: "#616161",
      lineHeight: 18,
      textAlign: "left",
    },
    reviewDivider: {
      height: 1,
      backgroundColor: "#E0E0E0",
      marginBottom: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: "#ffffff",
      borderRadius: 20,
      padding: 20,
      width: "90%",
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: "InterBold",
      color: "#215432",
      textAlign: "center",
      marginBottom: 10,
    },
    modalSubtitle: {
      fontSize: 14,
      color: "#666",
      textAlign: "center",
      marginBottom: 20,
    },
    modalText: {
      fontSize: 16,
      color: "#215432",
      textAlign: "center",
    },
    reportInput: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      fontFamily: "Inter",
      textAlignVertical: "top",
      marginBottom: 10,
    },
    characterCount: {
      fontSize: 12,
      color: "#999",
      textAlign: "right",
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    modalButtonsRTL: {
      flexDirection: "row-reverse",
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#ddd",
      alignItems: "center",
    },
    modalCancelText: {
      fontSize: 16,
      fontFamily: "Inter",
      color: "#666",
    },
    modalSubmitButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: "center",
    },
    modalSubmitText: {
      fontSize: 16,
      fontFamily: "InterBold",
      color: "#ffffff",
    },
});
