import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";

export default function MessagesScreen({ navigation }) {
  const { t } = useTranslation();

  const [conversations] = useState([
    {
      id: "1",
      name: "Sarah Hassan",
      lastMessage: "Thanks! I’ll be there on time.",
      time: "1h ago",
    },
    {
      id: "2",
      name: "Mohammed Al-Faraj",
      lastMessage: "Can you confirm your availability?",
      time: "3h ago",
    },
    {
      id: "3",
      name: "Ali Tarek",
      lastMessage: "Task completed. Thanks!",
      time: "1d ago",
    },
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Chat", { name: item.name })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.message} numberOfLines={1}>
        {item.lastMessage}
      </Text>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("clientMessages.title")}</Text>

      {conversations.length === 0 ? (
        <Text style={styles.empty}>{t("clientMessages.placeholder")}</Text>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: "InterBold",
    fontSize: 24,
    color: "#213729",
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  name: {
    fontFamily: "InterBold",
    fontSize: 16,
    color: "#213729",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  message: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  time: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#999",
    textAlign: I18nManager.isRTL ? "left" : "right",
  },
  empty: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
});
