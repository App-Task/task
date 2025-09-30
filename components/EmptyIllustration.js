import React from "react";
import { View, Image } from "react-native";

/**
 * EmptyIllustration
 * Reusable stopwatch + mug illustration using the provided image
 */
export default function EmptyIllustration({ size = 220 }) {
  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Image
        source={require("../assets/images/image(1).png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}


