import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ViewBidsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { bids } = route.params;

  const handleAccept = (bidder) => {
    Alert.alert(t("viewBids.acceptedTitle"), t("viewBids.acceptedMessage", { name: bidder.name }));
    // TODO: Navigate to payment or task progress flow
  };

  const handleChat = (bidder) => {
    navigation.navigate("Chat", { name: bidder.name });
  };

  const renderBid = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>{item.price} SAR</Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.chatBtn} onPress={() => handleChat(item)}>
          <Text style={styles.chatText}>{t("viewBids.chat")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
          <Text style={styles.acceptText}>{t("viewBids.accept")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#213729" />
          </TouchableOpacity>
          <Text style={styles.title}>{t("viewBids.title")}</Text>
          <View style={styles.backBtn} />
        </View>

        <FlatList
          data={bids}
          keyExtractor={(item) => item.id}
          renderItem={renderBid}
          ListEmptyComponent={
            <Text style={styles.empty}>{t("viewBids.noBids")}</Text>
          }
          contentContainerStyle={styles.listContent}
        />
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
});
