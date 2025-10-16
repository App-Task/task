import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentMethodsScreen({ navigation }) {
  const { t } = useTranslation();

  const [methods, setMethods] = useState([
    {
      id: "1",
      type: "Visa",
      last4: "4242",
      isDefault: true,
    },
    {
      id: "2",
      type: "Mastercard",
      last4: "8231",
      isDefault: false,
    },
  ]);

  const renderMethod = ({ item }) => (
    <View
      style={[
        styles.card,
        item.isDefault && { borderColor: "#c1ff72", borderWidth: 2 },
      ]}
    >
      <View style={styles.row}>
        <Ionicons
          name="card-outline"
          size={22}
          color="#215433"
        />
        <Text style={styles.cardText}>
          {item.type} **** {item.last4}
        </Text>
      </View>

      {item.isDefault && (
        <Text style={styles.default}>{t("clientPaymentMethods.default")}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#215433"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t("clientPaymentMethods.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={methods}
        keyExtractor={(item) => item.id}
        renderItem={renderMethod}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>{t("clientPaymentMethods.add")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#215433",
    textAlign: "center",
    flex: 1,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  row: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
  },
  cardText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#215433",
    marginLeft: 10,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  default: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215432",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#215433",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "InterBold",
    fontSize: 16,
  },
});
