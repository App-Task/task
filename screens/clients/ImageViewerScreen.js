import React from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ImageViewerScreen({ route, navigation }) {
  const { uri } = route.params;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={30} color="#fff" />
      </TouchableOpacity>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  backBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
});
