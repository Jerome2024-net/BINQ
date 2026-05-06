import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

const binqApiUrl = String.fromEnvironment('BINQ_API_URL', defaultValue: 'https://binq.io');
const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
const mapboxAccessToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN');

void main() {
  runApp(const BinqCommercantApp());
}

class BinqCommercantApp extends StatelessWidget {
  const BinqCommercantApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Binq Commerçant',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true).copyWith(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB), brightness: Brightness.dark)),
      home: const CommercantHomePage(),
    );
  }
}

class CommercantHomePage extends StatelessWidget {
  const CommercantHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFF111827),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            _HeroCard(),
            SizedBox(height: 16),
            _StatsRow(),
            SizedBox(height: 16),
            _FlowCard(),
            SizedBox(height: 16),
            _FeatureTile(title: 'Boutique', text: 'Produits, stock, prix, photos et visibilité locale.'),
            SizedBox(height: 10),
            _FeatureTile(title: 'Commandes', text: 'Accepter, préparer et assigner un livreur actif.'),
            SizedBox(height: 10),
            _FeatureTile(title: 'Portefeuille', text: 'Encaissement marchand, frais Binq et retraits.'),
            SizedBox(height: 16),
            _BackendCard(),
          ],
        ),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: const Color(0xFF020617), borderRadius: BorderRadius.circular(32), border: Border.all(color: const Color(0xFF1F2937))),
      child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Binq Commerçant iOS', style: TextStyle(color: Color(0xFF60A5FA), fontWeight: FontWeight.w900, letterSpacing: 1.4, fontSize: 12)),
        SizedBox(height: 10),
        Text('Vendez.\nAssignez.\nEncaissez.', style: TextStyle(color: Colors.white, fontSize: 34, height: 1.05, fontWeight: FontWeight.w900)),
        SizedBox(height: 10),
        Text('Application Flutter dédiée aux marchands pour gérer boutique, commandes, livreurs et wallet.', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 15, height: 1.45)),
      ]),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow();

  @override
  Widget build(BuildContext context) {
    return const Row(children: [
      Expanded(child: _StatCard(value: 'Live', label: 'Commandes')),
      SizedBox(width: 10),
      Expanded(child: _StatCard(value: 'Assign.', label: 'Livreurs')),
      SizedBox(width: 10),
      Expanded(child: _StatCard(value: 'XOF', label: 'Wallet')),
    ]);
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(color: const Color(0xFF1F2937), borderRadius: BorderRadius.circular(22), border: Border.all(color: const Color(0xFF374151))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 11, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class _FlowCard extends StatelessWidget {
  const _FlowCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(28)),
      child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Flux commerçant', style: TextStyle(color: Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.w900)),
        SizedBox(height: 8),
        Text('Chaque commande doit contenir la position GPS client. Le commerçant assigne ensuite un livreur actif, ce qui renseigne livreur_id.', style: TextStyle(color: Color(0xFF64748B), fontSize: 14, height: 1.45)),
      ]),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({required this.title, required this.text});
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: const Color(0xFF1F2937), borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0xFF374151))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text(text, style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13, height: 1.45)),
      ]),
    );
  }
}

class _BackendCard extends StatelessWidget {
  const _BackendCard();

  @override
  Widget build(BuildContext context) {
    return Text('Backend: $binqApiUrl', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w700));
  }
}
