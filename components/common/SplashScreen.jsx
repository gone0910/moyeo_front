import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import { KaushanScript_400Regular } from "@expo-google-fonts/kaushan-script";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg"; // Importing the SVG library
import LoginScreen from "../../components/auth/LoginScreen";

export default function CombinedSplashScreen() {
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });
  const [showLogin, setShowLogin] = useState(false);

  if (!fontsLoaded) {
    return null; // Ensure fonts are loaded
  }

  return (
    <LinearGradient
      colors={["#1D4ED8", "#6D28D9"]}
      style={styles.container}
    >
      <Modal
        visible={showLogin}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogin(false)}
      >
        <LoginScreen />
      </Modal>

      <Text style={styles.title}>moyeo </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.LoginScreenButton}
          onPress={() => setShowLogin(true)}
        >
        </TouchableOpacity>
      </View>

      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 80,
    fontWeight: "bold",
    color: "white",
    fontFamily: "KaushanScript",
    marginBottom: 24,
  },
  loader: {
    marginTop: 20,
  },
  buttonContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
    flexDirection: "row",
    gap: 12,
  },
  LoginScreenButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },
  abstractShape: {
    position: "absolute",
    width: 600,
    height: 100,
    top: 330,
    left: -10,
  },
});