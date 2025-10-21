import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import EmptyState from "../../components/EmptyState";

const dummyPayments = [
  { id: "1", date: "2024-04-01", amount: 150, task: "Fix Sink" },
  { id: "2", date: "2024-03-20", amount: 300, task: "Assemble Furniture" },
];

export default function MyPaymentsScreen() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setTimeout(() => {
      setPayments(dummyPayments);
      setLoading(false);
    }, 1000);
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.task}>{item.task}</Text>
      <Text style={styles.amount}>{item.amount} BHD</Text>
      <Text style={styles.date}>{item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t("taskerPayments.title")}</Text>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === "all" && styles.activeFilter]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.activeFilterText,
            ]}
          >
            {t("taskerPayments.all")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === "recent" && styles.activeFilter]}
          onPress={() => setFilter("recent")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "recent" && styles.activeFilterText,
            ]}
          >
            {t("taskerPayments.recent")}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#000000" size="large" style={{ marginTop: 40 }} />
      ) : payments.length === 0 ? (
        <EmptyState 
          title="No Payments Yet" 
          subtitle="Your payment history will appear here once you complete tasks and receive payments."
        />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 60 }}
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
  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#215433",
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  filters: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 8,
  },
  filterText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666",
  },
  activeFilter: {
    backgroundColor: "#c1ff72",
  },
  activeFilterText: {
    color: "#215433",
    fontFamily: "InterBold",
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  task: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#215433",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  amount: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#215432",
    marginBottom: 2,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  date: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "#999",
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
