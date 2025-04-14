import React, { useEffect, useState, useRef } from "react";
import {
  Animated,
  Image,
  View,
  StyleSheet,
  Easing,
  Text,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Asset } from "expo-asset";

export default function SplashScreen() {
  const [ready, setReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  // Preload logo before showing UI
  useEffect(() => {
    const preloadAssets = async () => {
      await Asset.loadAsync(require("../../assets/images/1.png"));
      setReady(true);
    };
    preloadAssets();
  }, []);

  // Animate once image is ready
  useEffect(() => {
    if (!ready) return;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace("Welcome");
    }, 3500);

    return () => clearTimeout(timer);
  }, [ready]);

  // Show a loading spinner while preloading the image
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#213729" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.centeredContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require("../../assets/images/1.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
          <Text style={styles.text}>Loading...</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  centeredContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  text: {
    color: "#213729",
    fontSize: 20,
    fontFamily: "InterBold",
    letterSpacing: 1,
  },
});
