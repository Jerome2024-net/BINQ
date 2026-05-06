import Constants from "expo-constants";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const extra = Constants.expoConfig?.extra as { apiUrl?: string; mapboxToken?: string } | undefined;
const apiUrl = extra?.apiUrl || "https://binq.io";

export default function App() {
  const [tracking, setTracking] = useState("Suivi live inactif");

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Position requise", "Autorisez la position pour suivre l’itinéraire vers le client.");
      return;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
    setTracking(`Livreur localisé · ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Binq Livreur iOS</Text>
          <Text style={styles.title}>Vos livraisons. La position client. L’itinéraire.</Text>
          <Text style={styles.subtitle}>Application dédiée aux livreurs assignés via `livreur_id`.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statut GPS</Text>
          <Text style={styles.cardText}>{tracking}</Text>
          <Pressable style={styles.primaryButton} onPress={startTracking}>
            <Text style={styles.primaryButtonText}>Activer mon suivi livreur</Text>
          </Pressable>
        </View>

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapTitle}>Carte Mapbox</Text>
          <Text style={styles.mapText}>{extra?.mapboxToken ? "Token Mapbox détecté." : "Ajoutez EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN."}</Text>
          <Text style={styles.mapText}>La carte native affichera le point client, le point livreur et l’itinéraire.</Text>
        </View>

        <View style={styles.grid}>
          <Feature title="Livraisons assignées" text="Liste des commandes où `livreur_id` correspond au compte connecté." />
          <Feature title="Suivi live" text="Position livreur via iOS Location Services." />
          <Feature title="Gains" text="Affichage du montant livraison crédité au wallet." />
        </View>

        <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(`${apiUrl}/livraisons`)}>
          <Text style={styles.secondaryButtonText}>Ouvrir le dashboard livraisons</Text>
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
  safeArea: { flex: 1, backgroundColor: "#f0fdf4" },
  container: { padding: 20, gap: 16 },
  hero: { backgroundColor: "#064e3b", borderRadius: 32, padding: 24, gap: 10 },
  kicker: { color: "#86efac", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.4 },
  title: { color: "white", fontSize: 31, fontWeight: "900", lineHeight: 36 },
  subtitle: { color: "#d1fae5", fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: "white", borderRadius: 28, padding: 20, gap: 12, borderWidth: 1, borderColor: "#bbf7d0" },
  cardTitle: { color: "#064e3b", fontSize: 18, fontWeight: "900" },
  cardText: { color: "#047857", fontSize: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: "#059669", borderRadius: 18, paddingVertical: 15, alignItems: "center" },
  primaryButtonText: { color: "white", fontSize: 14, fontWeight: "900" },
  secondaryButton: { backgroundColor: "#111827", borderRadius: 18, paddingVertical: 15, alignItems: "center" },
  secondaryButtonText: { color: "white", fontSize: 14, fontWeight: "900" },
  mapPlaceholder: { minHeight: 190, backgroundColor: "#dcfce7", borderRadius: 28, padding: 22, justifyContent: "center", borderWidth: 1, borderColor: "#86efac" },
  mapTitle: { color: "#064e3b", fontSize: 22, fontWeight: "900" },
  mapText: { color: "#047857", fontSize: 13, lineHeight: 20, marginTop: 6 },
  grid: { gap: 10 },
  feature: { backgroundColor: "white", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#bbf7d0" },
  featureTitle: { color: "#064e3b", fontSize: 16, fontWeight: "900" },
  featureText: { color: "#047857", fontSize: 13, lineHeight: 19, marginTop: 4 },
});
