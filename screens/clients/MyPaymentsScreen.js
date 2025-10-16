import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

const samplePayments = [
  { id: "1", date: "2025-05-01", amount: 150, status: "Completed" },
  { id: "2", date: "2025-04-24", amount: 200, status: "Completed" },
  { id: "3", date: "2025-04-17", amount: 175, status: "Pending" },
];

export default function MyPaymentsScreen({ navigation }) {
  const { t } = useTranslation();

  const total = samplePayments.reduce((acc, p) => acc + p.amount, 0);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.amount}>+ {item.amount} SAR</Text>
      <Text style={styles.meta}>
        {t("clientPayments.date")}: {item.date}
      </Text>
      <Text style={styles.meta}>
        {t("clientPayments.status")}: {t(`clientPayments.${item.status.toLowerCase()}`)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#215433"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t("clientPayments.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.totalLabel}>{t("clientPayments.total")}</Text>
        <Text style={styles.total}>+ {total} SAR</Text>
      </View>

      {/* List */}
      <FlatList
        data={samplePayments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
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
  header: {
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
    fontSize: 24,
    color: "#215433",
    textAlign: "center",
    flex: 1,
  },
  summary: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 30,
  },
  totalLabel: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215432",
    marginBottom: 6,
  },
  total: {
    fontFamily: "InterBold",
    fontSize: 20,
    color: "#215433",
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  amount: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#215432",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  meta: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
});
