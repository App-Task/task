import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import EmptyIllustration from "./EmptyIllustration";

export default function VerificationPopup({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          {/* Title */}
          <Text style={styles.title}>Ooops... you're still not verified</Text>
          
          {/* Empty State Icon */}
          <View style={styles.iconContainer}>
            <EmptyIllustration size={180} />
          </View>
          
          {/* Message */}
          <Text style={styles.message}>
            We aim to verify your documents within 48 hours, If you have any questions please don't hesitate to contact us.
          </Text>
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 9999,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popupContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#215432",
    textAlign: "center",
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: "#215432",
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "InterBold",
  },
});
