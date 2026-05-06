import Constants from "expo-constants";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
const apiUrl = extra?.apiUrl || "https://binq.io";

export default function App() {
  const [locationStatus, setLocationStatus] = useState("Position non confirmée");

  const confirmLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Position requise", "La position est nécessaire pour permettre au livreur de vous trouver.");
      return;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocationStatus(`GPS confirmé · ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Binq Client iOS</Text>
          <Text style={styles.title}>Commandez. Recevez vite.</Text>
          <Text style={styles.subtitle}>L’application client séparée pour découvrir les commerces, commander et suivre la livraison.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Localisation client obligatoire</Text>
          <Text style={styles.cardText}>{locationStatus}</Text>
          <Pressable style={styles.primaryButton} onPress={confirmLocation}>
            <Text style={styles.primaryButtonText}>Confirmer ma position GPS</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          <Feature title="Explorer" text="Voir les boutiques et produits locaux." />
          <Feature title="Commander" text="Paiement sécurisé via le backend Binq." />
          <Feature title="Suivre" text="Position client transmise au livreur assigné." />
        </View>

        <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(`${apiUrl}/explorer`)}>
          <Text style={styles.secondaryButtonText}>Ouvrir la marketplace web</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 20, gap: 16 },
  hero: { backgroundColor: "#0f172a", borderRadius: 32, padding: 24, gap: 10 },
  kicker: { color: "#93c5fd", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.4 },
  title: { color: "white", fontSize: 34, fontWeight: "900", lineHeight: 38 },
  subtitle: { color: "#cbd5e1", fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: "white", borderRadius: 28, padding: 20, gap: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  cardTitle: { color: "#0f172a", fontSize: 18, fontWeight: "900" },
  cardText: { color: "#64748b", fontSize: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: "#2563eb", borderRadius: 18, paddingVertical: 15, alignItems: "center" },
  primaryButtonText: { color: "white", fontSize: 14, fontWeight: "900" },
  secondaryButton: { backgroundColor: "#111827", borderRadius: 18, paddingVertical: 15, alignItems: "center" },
  secondaryButtonText: { color: "white", fontSize: 14, fontWeight: "900" },
  grid: { gap: 10 },
  feature: { backgroundColor: "white", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#e2e8f0" },
  featureTitle: { color: "#0f172a", fontSize: 16, fontWeight: "900" },
  featureText: { color: "#64748b", fontSize: 13, lineHeight: 19, marginTop: 4 },
});
