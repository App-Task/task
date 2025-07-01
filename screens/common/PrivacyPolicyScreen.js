import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#213729"
          />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>
          <Text style={styles.bold}>Effective Date:</Text> [Insert Date]
        </Text>
        <Text style={styles.section}>
          <Text style={styles.bold}>Operator:</Text> This Platform is operated by a small founding team. The
          Platform is based in the Kingdom of Bahrain.
        </Text>
        <Text style={styles.section}>
          <Text style={styles.bold}>Platform:</Text> [App Name] (the "Platform" or "App")
        </Text>
        <Text style={styles.section}>
          Your privacy is important. This Privacy Policy outlines how your data is collected, used, and
          protected when you use the Platform.
        </Text>

        <Text style={styles.heading}>1. What Information We Collect</Text>
        <Text style={styles.bullet}>• Account Information: Name, email address, phone number, profile photo, bio, and skill tags</Text>
        <Text style={styles.bullet}>• Usage Information: Pages visited, time spent, actions taken (e.g., posting jobs, applying for work)</Text>
        <Text style={styles.bullet}>• Messages: Communications sent between users via the in-app chat or messaging system</Text>
        <Text style={styles.bullet}>• Technical Info: IP address, device type, browser, and operating system</Text>
        <Text style={styles.section}>We do not collect sensitive personal data unless strictly necessary.</Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.bullet}>• Create and manage your account</Text>
        <Text style={styles.bullet}>• Match freelancers and clients</Text>
        <Text style={styles.bullet}>• Improve user experience</Text>
        <Text style={styles.bullet}>• Detect abuse or fraud</Text>
        <Text style={styles.bullet}>• Comply with legal obligations</Text>

        <Text style={styles.heading}>3. How We Share Your Information</Text>
        <Text style={styles.section}>We do not sell or rent your data. We may share information only if:</Text>
        <Text style={styles.bullet}>• You give explicit consent</Text>
        <Text style={styles.bullet}>• Required by law</Text>
        <Text style={styles.bullet}>• Necessary for dispute resolution or enforcement</Text>
        <Text style={styles.bullet}>• Part of a visible platform feature (e.g. freelancer profiles)</Text>

        <Text style={styles.heading}>4. Cookies and Tracking</Text>
        <Text style={styles.bullet}>• Keep you logged in</Text>
        <Text style={styles.bullet}>• Remember preferences</Text>
        <Text style={styles.bullet}>• Track platform performance</Text>

        <Text style={styles.heading}>5. Data Storage & Security</Text>
        <Text style={styles.section}>
          We use secure cloud storage and take reasonable protective measures, though no system is 100% secure.
        </Text>

        <Text style={styles.heading}>6. Your Rights</Text>
        <Text style={styles.bullet}>• Access your data</Text>
        <Text style={styles.bullet}>• Edit or delete your profile</Text>
        <Text style={styles.bullet}>• Report misuse of your data</Text>
        <Text style={styles.section}>Contact us via email to make a request.</Text>

        <Text style={styles.heading}>7. Third-Party Services</Text>
        <Text style={styles.section}>
          Third-party tools (e.g. Stripe, Firebase) used in the Platform may collect data under their own policies.
        </Text>

        <Text style={styles.heading}>8. Children's Privacy</Text>
        <Text style={styles.section}>
          This Platform is not intended for children under 13. We do not knowingly collect data from minors.
        </Text>

        <Text style={styles.heading}>9. Changes to This Policy</Text>
        <Text style={styles.section}>
          Updates to this policy may be made. Continued use means acceptance of the new terms.
        </Text>

        <Text style={styles.heading}>10. Contact</Text>
        <Text style={styles.bullet}>• Email: [yourname]@[yourapp].com</Text>
        <Text style={styles.bullet}>• Location: Kingdom of Bahrain</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    color: "#213729",
    textAlign: "center",
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  heading: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#215432",
    marginBottom: 8,
    marginTop: 20,
  },
  section: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
    marginBottom: 12,
  },
  bullet: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    paddingLeft: 12,
    marginBottom: 6,
  },
  bold: {
    fontFamily: "InterBold",
  },
});
