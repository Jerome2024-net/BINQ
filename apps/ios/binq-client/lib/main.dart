import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

const binqApiUrl = String.fromEnvironment('BINQ_API_URL', defaultValue: 'https://binq.io');
const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
const mapboxAccessToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN');

void main() {
  runApp(const BinqClientApp());
}

class BinqClientApp extends StatelessWidget {
  const BinqClientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Binq Client',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
        fontFamily: '.SF Pro Text',
      ),
      home: const ClientHomePage(),
    );
  }
}

class ClientHomePage extends StatefulWidget {
  const ClientHomePage({super.key});

  @override
  State<ClientHomePage> createState() => _ClientHomePageState();
}

class _ClientHomePageState extends State<ClientHomePage> {
  String locationStatus = 'Position client non confirmée';
  bool locating = false;

  Future<void> confirmLocation() async {
    setState(() => locating = true);
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) throw Exception('Activez la localisation iOS.');

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        throw Exception('Autorisation GPS refusée.');
      }

      final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() {
        locationStatus = 'GPS confirmé · ${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}';
      });
    } catch (error) {
      setState(() => locationStatus = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() => locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _HeroCard(
              eyebrow: 'Binq Client iOS',
              title: 'Commandez.\nRecevez vite.',
              subtitle: 'Application client Flutter pour découvrir les commerces, commander et transmettre la position GPS au livreur.',
              color: Color(0xFF0F172A),
              accent: Color(0xFF93C5FD),
            ),
            const SizedBox(height: 16),
            _ActionCard(
              title: 'Localisation obligatoire',
              text: locationStatus,
              buttonText: locating ? 'Localisation...' : 'Confirmer ma position GPS',
              onPressed: locating ? null : confirmLocation,
            ),
            const SizedBox(height: 16),
            const _FeatureGrid(features: [
              _Feature('Explorer', 'Boutiques et produits locaux.'),
              _Feature('Commander', 'Paiement sécurisé par le backend Binq.'),
              _Feature('Suivre', 'Adresse GPS disponible pour la livraison.'),
            ]),
            const SizedBox(height: 16),
            const _BackendCard(),
          ],
        ),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.eyebrow, required this.title, required this.subtitle, required this.color, required this.accent});

  final String eyebrow;
  final String title;
  final String subtitle;
  final Color color;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(32)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(eyebrow, style: TextStyle(color: accent, fontWeight: FontWeight.w900, letterSpacing: 1.4, fontSize: 12)),
        const SizedBox(height: 10),
        Text(title, style: const TextStyle(color: Colors.white, fontSize: 34, height: 1.05, fontWeight: FontWeight.w900)),
        const SizedBox(height: 10),
        Text(subtitle, style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 15, height: 1.45)),
      ]),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.title, required this.text, required this.buttonText, required this.onPressed});

  final String title;
  final String text;
  final String buttonText;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(28), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
        const SizedBox(height: 8),
        Text(text, style: const TextStyle(fontSize: 14, height: 1.45, color: Color(0xFF64748B))),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: CupertinoButton(borderRadius: BorderRadius.circular(18), color: const Color(0xFF2563EB), onPressed: onPressed, child: Text(buttonText, style: const TextStyle(fontWeight: FontWeight.w900))),
        ),
      ]),
    );
  }
}

class _Feature {
  const _Feature(this.title, this.text);
  final String title;
  final String text;
}

class _FeatureGrid extends StatelessWidget {
  const _FeatureGrid({required this.features});
  final List<_Feature> features;

  @override
  Widget build(BuildContext context) {
    return Column(children: features.map((feature) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _FeatureTile(feature: feature))).toList());
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({required this.feature});
  final _Feature feature;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(feature.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
        const SizedBox(height: 4),
        Text(feature.text, style: const TextStyle(fontSize: 13, height: 1.45, color: Color(0xFF64748B))),
      ]),
    );
  }
}

class _BackendCard extends StatelessWidget {
  const _BackendCard();

  @override
  Widget build(BuildContext context) {
    return Text('Backend: $binqApiUrl', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontWeight: FontWeight.w700));
  }
}
