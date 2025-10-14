import React from "react";
import { View, Text, StyleSheet } from "react-native";
import EmptyIllustration from "./EmptyIllustration";

/**
 * Standardized EmptyState component
 * Used across all screens for consistent empty state design
 */
export default function EmptyState({ 
  title, 
  subtitle, 
  illustrationSize = 140 
}) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIllustration}>
        <EmptyIllustration size={illustrationSize} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
    minHeight: 400,
  },
  emptyIllustration: {
    marginBottom: 30,
  },
  emptyTitle: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#215433",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  },
});
