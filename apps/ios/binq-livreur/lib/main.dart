import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

const binqApiUrl = String.fromEnvironment('BINQ_API_URL', defaultValue: 'https://binq.io');
const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
const mapboxAccessToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN');

void main() {
  runApp(const BinqLivreurApp());
}

class BinqLivreurApp extends StatelessWidget {
  const BinqLivreurApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Binq Livreur',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF059669)), useMaterial3: true, fontFamily: '.SF Pro Text'),
      home: const LivreurHomePage(),
    );
  }
}

class LivreurHomePage extends StatefulWidget {
  const LivreurHomePage({super.key});

  @override
  State<LivreurHomePage> createState() => _LivreurHomePageState();
}

class _LivreurHomePageState extends State<LivreurHomePage> {
  String trackingStatus = 'Suivi livreur inactif';
  bool tracking = false;

  Future<void> startTracking() async {
    setState(() => tracking = true);
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

      final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.bestForNavigation);
      setState(() {
        trackingStatus = 'Livreur localisé · ${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}';
      });
    } catch (error) {
      setState(() => trackingStatus = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() => tracking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF0FDF4),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _HeroCard(),
            const SizedBox(height: 16),
            _ActionCard(status: trackingStatus, loading: tracking, onPressed: tracking ? null : startTracking),
            const SizedBox(height: 16),
            const _MapPreview(),
            const SizedBox(height: 16),
            const _FeatureTile(title: 'Livraisons assignées', text: 'Les commandes où livreur_id correspond au compte connecté.'),
            const SizedBox(height: 10),
            const _FeatureTile(title: 'Position client', text: 'Point client Mapbox fourni par le checkout obligatoire.'),
            const SizedBox(height: 10),
            const _FeatureTile(title: 'Wallet livreur', text: 'Montant livraison crédité après paiement confirmé.'),
            const SizedBox(height: 16),
            Text('Backend: $binqApiUrl', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Color(0xFF047857), fontWeight: FontWeight.w700)),
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
      decoration: BoxDecoration(color: const Color(0xFF064E3B), borderRadius: BorderRadius.circular(32)),
      child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Binq Livreur iOS', style: TextStyle(color: Color(0xFF86EFAC), fontWeight: FontWeight.w900, letterSpacing: 1.4, fontSize: 12)),
        SizedBox(height: 10),
        Text('Vos livraisons.\nLa position client.\nL’itinéraire.', style: TextStyle(color: Colors.white, fontSize: 31, height: 1.08, fontWeight: FontWeight.w900)),
        SizedBox(height: 10),
        Text('Application Flutter dédiée aux livreurs assignés par les commerçants Binq.', style: TextStyle(color: Color(0xFFD1FAE5), fontSize: 15, height: 1.45)),
      ]),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.status, required this.loading, required this.onPressed});

  final String status;
  final bool loading;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(28), border: Border.all(color: const Color(0xFFBBF7D0))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Statut GPS livreur', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF064E3B))),
        const SizedBox(height: 8),
        Text(status, style: const TextStyle(fontSize: 14, height: 1.45, color: Color(0xFF047857))),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: CupertinoButton(borderRadius: BorderRadius.circular(18), color: const Color(0xFF059669), onPressed: onPressed, child: Text(loading ? 'Localisation...' : 'Activer mon suivi livreur', style: const TextStyle(fontWeight: FontWeight.w900))),
        ),
      ]),
    );
  }
}

class _MapPreview extends StatelessWidget {
  const _MapPreview();

  @override
  Widget build(BuildContext context) {
    return Container(
      minHeight: 190,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(28), border: Border.all(color: const Color(0xFF86EFAC))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
        const Text('Carte Mapbox native', style: TextStyle(color: Color(0xFF064E3B), fontSize: 22, fontWeight: FontWeight.w900)),
        const SizedBox(height: 8),
        Text(mapboxAccessToken.isEmpty ? 'Ajoutez MAPBOX_ACCESS_TOKEN avec --dart-define.' : 'Token Mapbox détecté.', style: const TextStyle(color: Color(0xFF047857), fontSize: 13, height: 1.45)),
        const SizedBox(height: 6),
        const Text('À connecter ensuite aux coordonnées delivery_latitude / delivery_longitude.', style: TextStyle(color: Color(0xFF047857), fontSize: 13, height: 1.45)),
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
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0xFFBBF7D0))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF064E3B))),
        const SizedBox(height: 4),
        Text(text, style: const TextStyle(fontSize: 13, height: 1.45, color: Color(0xFF047857))),
      ]),
    );
  }
}
