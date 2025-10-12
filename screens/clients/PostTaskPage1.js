import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  I18nManager,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const getCategories = (t) => [
  {
    id: "cleaning",
    name: t("clientPostTask.page1.categories.cleaning"),
    description: t("clientPostTask.page1.categories.cleaningDesc"),
    icon: "water",
    color: "#8B5CF6"
  },
  {
    id: "handyman",
    name: t("clientPostTask.page1.categories.handyman"),
    description: t("clientPostTask.page1.categories.handymanDesc"),
    icon: "construct",
    color: "#10B981"
  },
  {
    id: "shopping",
    name: t("clientPostTask.page1.categories.shopping"),
    description: t("clientPostTask.page1.categories.shoppingDesc"),
    icon: "basket",
    color: "#3B82F6"
  },
  {
    id: "pet",
    name: t("clientPostTask.page1.categories.pet"),
    description: t("clientPostTask.page1.categories.petDesc"),
    icon: "paw",
    color: "#EC4899"
  },
  {
    id: "moving",
    name: t("clientPostTask.page1.categories.moving"),
    description: t("clientPostTask.page1.categories.movingDesc"),
    icon: "car",
    color: "#F59E0B"
  },
  {
    id: "furniture",
    name: t("clientPostTask.page1.categories.furniture"),
    description: t("clientPostTask.page1.categories.furnitureDesc"),
    icon: "bed",
    color: "#6366F1"
  },
  {
    id: "yardwork",
    name: t("clientPostTask.page1.categories.yardwork"),
    description: t("clientPostTask.page1.categories.yardworkDesc"),
    icon: "leaf",
    color: "#10B981"
  },
  {
    id: "other",
    name: t("clientPostTask.page1.categories.other"),
    description: t("clientPostTask.page1.categories.otherDesc"),
    icon: "ellipsis-horizontal",
    color: "#6B7280"
  }
];

export default function PostTaskPage1() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const categories = getCategories(t);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleContinue = () => {
    if (!selectedCategory) {
      return;
    }

    navigation.navigate("PostTaskPage2", {
      category: selectedCategory,
    });
  };


  const renderCategoryItem = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryCard,
        selectedCategory?.id === category.id && styles.categoryCardSelected
      ]}
      onPress={() => handleCategorySelect(category)}
    >
      <View style={styles.categoryIconContainer}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <Ionicons name={category.icon} size={24} color="#ffffff" />
        </View>
      </View>
      <View style={styles.categoryContent}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
      </View>
      {selectedCategory?.id === category.id && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#215432" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>{t("clientPostTask.page1.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, styles.progressBarActive]} />
        <View style={[styles.progressBar, styles.progressBarInactive]} />
        <View style={[styles.progressBar, styles.progressBarInactive]} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{t("clientPostTask.page1.selectCategory")}</Text>
        
        <View style={styles.categoriesContainer}>
          {categories.map(renderCategoryItem)}
        </View>
      </ScrollView>

      {/* Continue Button */}
      {selectedCategory && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>{t("clientPostTask.page1.continue")}</Text>
          </TouchableOpacity>
        </View>
      )}
          </View>
        </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(248, 246, 247)",
  },
  header: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "InterBold",
    color: "#000000",
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: "#215432",
  },
  progressBarInactive: {
    backgroundColor: "#e0e0e0",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased space for floating button
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#000000",
    marginBottom: 24,
    marginTop: 8,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  categoriesContainer: {
    gap: 12,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: 400,
  },
  categoryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryCardSelected: {
    borderColor: "#215432",
    borderWidth: 2,
  },
  categoryIconContainer: {
    marginRight: I18nManager.isRTL ? 0 : 20,
    marginLeft: I18nManager.isRTL ? 20 : 0,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryContent: {
    flex: 1,
    marginRight: I18nManager.isRTL ? 0 : 12,
    marginLeft: I18nManager.isRTL ? 12 : 0,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#000000",
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  categoryDescription: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#666666",
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  checkmarkContainer: {
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  continueButton: {
    backgroundColor: "#215432",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: "#ffffff",
  },
});
