import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function TaskDetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { task } = route.params;
  const { title, description, address, price, images = [], bids = [] } = task;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()} // ✅ Go back with left-slide animation
          >
            <Ionicons name="arrow-back" size={24} color="#213729" />
          </TouchableOpacity>
          <Text style={styles.heading} numberOfLines={1}>{title}</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Images */}
        {images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageRow}
          >
            {images.map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.image} />
            ))}
          </ScrollView>
        )}

        {/* Description */}
        <Text style={styles.label}>{t("taskDetails.description")}</Text>
        <Text style={styles.text}>{description}</Text>

        {/* Address */}
        <Text style={styles.label}>{t("taskDetails.address")}</Text>
        <Text style={styles.text}>{address}</Text>

        {/* Price */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>{t("taskDetails.offeredPrice")}</Text>
          <Text style={styles.price}>{price} SAR</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("EditTask", { task })}
          >
            <Text style={styles.buttonText}>{t("taskDetails.editTask")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("ViewBids", { bids })}
          >
            <Text style={styles.buttonText}>{t("taskDetails.viewBids")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              {t("taskDetails.cancelTask")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    paddingTop: 40,
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#213729",
    textAlign: "center",
    flex: 1,
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  imageRow: {
    marginBottom: 20,
    paddingVertical: 4,
  },
  image: {
    width: 120,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  label: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215432",
    marginBottom: 4,
    marginTop: 12,
  },
  text: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    marginBottom: 10,
    lineHeight: 22,
  },
  priceBox: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "center",
  },
  priceLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215432",
  },
  price: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#213729",
    marginTop: 6,
  },
  actions: {
    marginTop: 40,
  },
  button: {
    backgroundColor: "#213729",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#c1ff72",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#213729",
    fontFamily: "InterBold",
    fontSize: 16,
  },
});
