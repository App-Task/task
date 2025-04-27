import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Asset } from "expo-asset";
import { Video } from "expo-av";

export default function SplashScreen() {
  const [ready, setReady] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const preloadAssets = async () => {
      await Asset.loadAsync(require("../../assets/animation.mp4"));
      setReady(true);
    };
    preloadAssets();
  }, []);

  useEffect(() => {
    if (!ready) return;

    const timer = setTimeout(() => {
      navigation.replace("Welcome");
    }, 3500);

    return () => clearTimeout(timer);
  }, [ready]);

  if (!ready) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <Video
          source={require("../../assets/animation.mp4")}
          style={styles.video}
          resizeMode="cover" // ✅ Important: change to "cover" so it fills!
          shouldPlay
          isLooping={false}
          isMuted
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "rgba(31, 42, 36, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(31, 42, 36, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoWrapper: {
    backgroundColor: "rgba(31, 42, 36, 1)", // background for any small gaps
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
