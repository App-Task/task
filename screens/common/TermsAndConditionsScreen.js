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

export default function TermsAndConditionsScreen({ navigation }) {
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
        <Text style={styles.title}>Terms and Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Terms Content */}
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
          By accessing or using this Platform, you agree to be bound by these Terms and Conditions
          ("Terms"). If you do not agree with these Terms, please do not use the Platform.
        </Text>

        <Text style={styles.heading}>1. Nature of the Platform</Text>
        <Text style={styles.section}>
          [App Name] is a digital platform that connects clients ("Users") with freelance service providers
          ("Freelancers") for the purpose of hiring, collaboration, and project completion. The Platform acts
          solely as an intermediary and does not employ, manage, or guarantee the performance of any User or
          Freelancer.
        </Text>

        <Text style={styles.heading}>2. User Responsibilities</Text>
        <Text style={styles.section}>
          Users and Freelancers are solely responsible for:
        </Text>
        <Text style={styles.bullet}>• The accuracy of their profiles and communications</Text>
        <Text style={styles.bullet}>• Negotiating and entering into any agreements independently</Text>
        <Text style={styles.bullet}>• Payments, delivery of services, and any resulting disputes</Text>
        <Text style={styles.section}>All services are used at your own risk.</Text>

        <Text style={styles.heading}>3. No Legal Entity or Employment Relationship</Text>
        <Text style={styles.section}>
          This Platform is currently operated by individuals and is not a registered business under Bahraini or
          other jurisdictional laws. Use of the Platform does not establish any employment, agency, or
          partnership relationship with the Operator.
        </Text>

        <Text style={styles.heading}>4. Limitation of Liability</Text>
        <Text style={styles.section}>To the fullest extent permitted by law:</Text>
        <Text style={styles.bullet}>• The Operators shall not be liable for any damages, loss, or injury arising from:</Text>
        <Text style={styles.bullet}>  – Disputes between Users and Freelancers</Text>
        <Text style={styles.bullet}>  – Service quality, performance, or communication</Text>
        <Text style={styles.bullet}>  – Platform errors, outages, or misuse</Text>
        <Text style={styles.bullet}>  – Any indirect or consequential loss</Text>
        <Text style={styles.section}>The Platform is provided "as is" without warranties of any kind.</Text>

        <Text style={styles.heading}>5. Disputes Between Users</Text>
        <Text style={styles.section}>
          The Operators do not mediate disputes between Users. Users are encouraged to communicate clearly
          and resolve conflicts independently.
        </Text>

        <Text style={styles.heading}>6. User Conduct</Text>
        <Text style={styles.section}>Users agree not to:</Text>
        <Text style={styles.bullet}>• Violate Bahraini or international law</Text>
        <Text style={styles.bullet}>• Post false, abusive, or misleading content</Text>
        <Text style={styles.bullet}>• Use the Platform for fraudulent or harmful activity</Text>
        <Text style={styles.bullet}>• Circumvent the intended use of the platform</Text>
        <Text style={styles.section}>Violation of these rules may result in removal from the Platform.</Text>

        <Text style={styles.heading}>7. Privacy</Text>
        <Text style={styles.section}>
          Minimal personal information may be collected to support Platform functionality. No personal data will
          be sold or shared without consent, except where required by law.
        </Text>

        <Text style={styles.heading}>8. Changes to Terms</Text>
        <Text style={styles.section}>
          These Terms may be updated at any time. Continued use of the Platform constitutes acceptance of any
          revisions.
        </Text>

        <Text style={styles.heading}>9. Governing Law</Text>
        <Text style={styles.section}>
          These Terms are governed by the laws of the Kingdom of Bahrain, and any legal matters shall be
          addressed in the courts of Bahrain.
        </Text>

        <Text style={styles.heading}>10. Contact</Text>
        <Text style={styles.section}>
          For any questions or legal inquiries, please contact:
        </Text>
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
