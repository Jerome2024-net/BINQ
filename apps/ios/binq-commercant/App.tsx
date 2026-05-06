import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
const apiUrl = extra?.apiUrl || "https://binq.io";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Binq Commerçant iOS</Text>
          <Text style={styles.title}>Vendez. Assignez. Encaissez.</Text>
          <Text style={styles.subtitle}>Application dédiée aux marchands pour gérer boutique, commandes, livreurs et portefeuille.</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Commandes" value="Live" />
          <Stat label="Livreurs" value="Assign." />
          <Stat label="Wallet" value="XOF" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Flux commerçant</Text>
          <Text style={styles.cardText}>Chaque commande doit contenir la position GPS client. Le marchand sélectionne ensuite un livreur actif, ce qui renseigne `livreur_id`.</Text>
        </View>

        <View style={styles.grid}>
          <Feature title="Boutique" text="Produits, stock, prix et visibilité locale." />
          <Feature title="Commandes" text="Accepter, préparer, assigner un livreur." />
          <Feature title="Portefeuille" text="Encaissement marchand, frais Binq et retraits." />
        </View>

        <Pressable style={styles.primaryButton} onPress={() => Linking.openURL(`${apiUrl}/commandes`)}>
          <Text style={styles.primaryButtonText}>Ouvrir mes commandes</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  safeArea: { flex: 1, backgroundColor: "#111827" },
  container: { padding: 20, gap: 16 },
  hero: { backgroundColor: "#020617", borderRadius: 32, padding: 24, gap: 10, borderWidth: 1, borderColor: "#1f2937" },
  kicker: { color: "#60a5fa", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.4 },
  title: { color: "white", fontSize: 34, fontWeight: "900", lineHeight: 38 },
  subtitle: { color: "#cbd5e1", fontSize: 15, lineHeight: 22 },
  statsRow: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, backgroundColor: "#1f2937", borderRadius: 22, padding: 15, borderWidth: 1, borderColor: "#374151" },
  statValue: { color: "white", fontSize: 19, fontWeight: "900" },
  statLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "700", marginTop: 4 },
  card: { backgroundColor: "white", borderRadius: 28, padding: 20, gap: 12 },
  cardTitle: { color: "#0f172a", fontSize: 18, fontWeight: "900" },
  cardText: { color: "#64748b", fontSize: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: "#2563eb", borderRadius: 18, paddingVertical: 15, alignItems: "center" },
  primaryButtonText: { color: "white", fontSize: 14, fontWeight: "900" },
  grid: { gap: 10 },
  feature: { backgroundColor: "#1f2937", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#374151" },
  featureTitle: { color: "white", fontSize: 16, fontWeight: "900" },
  featureText: { color: "#cbd5e1", fontSize: 13, lineHeight: 19, marginTop: 4 },
});
