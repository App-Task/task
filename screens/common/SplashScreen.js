import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Asset } from "expo-asset";
import { Video } from "expo-av"; // ✅ Import video component

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const [ready, setReady] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const preloadAssets = async () => {
      await Asset.loadAsync(require("../../assets/animation.mp4")); // ✅ preload animation
      setReady(true);
    };
    preloadAssets();
  }, []);

  useEffect(() => {
    if (!ready) return;

    const timer = setTimeout(() => {
      navigation.replace("Welcome");
    }, 3500); // ✅ after animation finishes (~3.5 sec)

    return () => clearTimeout(timer);
  }, [ready]);

  if (!ready) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <View style={styles.container}>
      <Video
        source={require("../../assets/animation.mp4")}
        style={styles.video}
        resizeMode="contain" // ✅ Keep proportion
        shouldPlay
        isLooping={false} // ✅ Play only once
        isMuted
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "rgba(30,47,36,255)", // ✅ Your requested color
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(30,47,36,255)", // ✅ Your requested color
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: width * 0.8,   // ✅ Make it bigger (80% of screen width)
    height: height * 0.8, // ✅ Also make it taller
  },
});
