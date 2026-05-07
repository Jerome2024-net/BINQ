import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

const binqApiUrl = String.fromEnvironment(
  'BINQ_API_URL',
  defaultValue: 'https://binq.io',
);
const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
const mapboxAccessToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN');

const _primaryGreen = Color(0xFF14852F);
const _darkGreen = Color(0xFF064E3B);
const _softGreen = Color(0xFFE8F8EE);
const _ink = Color(0xFF0F172A);
const _muted = Color(0xFF64748B);

void main() {
  runApp(const BinqClientApp());
}

class BinqClientApp extends StatelessWidget {
  const BinqClientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Binq Clients',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: _primaryGreen),
        useMaterial3: true,
        fontFamily: '.SF Pro Text',
      ),
      home: const ClientExplorerPage(),
    );
  }
}

class ClientExplorerPage extends StatefulWidget {
  const ClientExplorerPage({super.key});

  @override
  State<ClientExplorerPage> createState() => _ClientExplorerPageState();
}

class _ClientExplorerPageState extends State<ClientExplorerPage> {
  final TextEditingController _searchController = TextEditingController();
  String locationStatus = 'Position client non confirmée';
  String selectedCategory = 'Tout';
  String searchQuery = '';
  bool locating = false;

  static const categories = [
    _ExplorerCategory('Tout', CupertinoIcons.square_grid_2x2_fill),
    _ExplorerCategory('Restaurants', CupertinoIcons.house_fill),
    _ExplorerCategory('Courses', CupertinoIcons.cart_fill),
    _ExplorerCategory('Boutiques', CupertinoIcons.bag_fill),
    _ExplorerCategory('Beauté', CupertinoIcons.sparkles),
    _ExplorerCategory('Services', CupertinoIcons.wrench_fill),
  ];

  static const stores = [
    _Store(
      name: 'Chez Awa — Attiéké & grillades',
      category: 'Restaurants',
      distance: '1,2 km',
      eta: '18–25 min',
      rating: '4,8',
      image: '🍗',
      verified: true,
    ),
    _Store(
      name: 'Marché Frais Cocody',
      category: 'Courses',
      distance: '900 m',
      eta: '12–20 min',
      rating: '4,7',
      image: '🥭',
      verified: true,
    ),
    _Store(
      name: 'Binq Fashion Store',
      category: 'Boutiques',
      distance: '2,4 km',
      eta: '25–35 min',
      rating: '4,6',
      image: '👟',
      verified: false,
    ),
    _Store(
      name: 'Beauty Express',
      category: 'Beauté',
      distance: '1,8 km',
      eta: '20–30 min',
      rating: '4,9',
      image: '💄',
      verified: true,
    ),
  ];

  static const products = [
    _Product('Poulet braisé + alloco', 'Chez Awa', '3 500 FCFA', '🔥'),
    _Product('Panier fruits frais', 'Marché Frais Cocody', '5 000 FCFA', '🥭'),
    _Product('Livraison express pressing', 'Services Binq', '1 500 FCFA', '⚡'),
  ];

  List<_Store> get filteredStores {
    return stores.where((store) {
      final matchesCategory =
          selectedCategory == 'Tout' || store.category == selectedCategory;
      final query = searchQuery.trim().toLowerCase();
      final matchesSearch = query.isEmpty ||
          store.name.toLowerCase().contains(query) ||
          store.category.toLowerCase().contains(query);
      return matchesCategory && matchesSearch;
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> confirmLocation() async {
    setState(() => locating = true);
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Activez la localisation iOS.');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('Autorisation GPS refusée.');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      setState(() {
        locationStatus =
            'GPS confirmé · ${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}';
      });
    } catch (error) {
      setState(
        () => locationStatus = error.toString().replaceFirst('Exception: ', ''),
      );
    } finally {
      setState(() => locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final visibleStores = filteredStores;

    return CupertinoPageScaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
          children: [
            const _ExplorerHeader(),
            const SizedBox(height: 18),
            _SearchBox(
              controller: _searchController,
              onChanged: (value) => setState(() => searchQuery = value),
            ),
            const SizedBox(height: 14),
            _LocationCard(
              text: locationStatus,
              locating: locating,
              onPressed: locating ? null : confirmLocation,
            ),
            const SizedBox(height: 20),
            _CategoryRail(
              categories: categories,
              selected: selectedCategory,
              onSelected: (value) => setState(() => selectedCategory = value),
            ),
            const SizedBox(height: 22),
            const _SectionHeader(
              title: 'À découvrir maintenant',
              action: 'Voir tout',
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 142,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: products.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) =>
                    _ProductCard(product: products[index]),
              ),
            ),
            const SizedBox(height: 24),
            _SectionHeader(
              title: selectedCategory == 'Tout'
                  ? 'Commerces proches de vous'
                  : selectedCategory,
              action: '${visibleStores.length} résultat(s)',
            ),
            const SizedBox(height: 12),
            if (visibleStores.isEmpty)
              const _EmptyExplorerState()
            else
              ...visibleStores.map(
                (store) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _StoreCard(store: store),
                ),
              ),
            const SizedBox(height: 10),
            const _BackendCard(),
          ],
        ),
      ),
    );
  }
}

class _ExplorerHeader extends StatelessWidget {
  const _ExplorerHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: _darkGreen,
        borderRadius: BorderRadius.circular(32),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              _BinqMark(),
              SizedBox(width: 10),
              Text(
                'Binq Clients',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 26),
          const Text(
            'Explorer',
            style: TextStyle(
              color: Color(0xFFBBF7D0),
              fontWeight: FontWeight.w900,
              letterSpacing: 1.3,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Commandez local.\nRecevez vite.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 36,
              height: 1.02,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Restaurants, courses, boutiques et services autour de vous avec livraison Binq.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.78),
              fontSize: 15,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _BinqMark extends StatelessWidget {
  const _BinqMark();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: _primaryGreen,
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Icon(
        CupertinoIcons.cart_fill,
        color: Colors.white,
        size: 24,
      ),
    );
  }
}

class _SearchBox extends StatelessWidget {
  const _SearchBox({required this.controller, required this.onChanged});

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: CupertinoTextField(
        controller: controller,
        onChanged: onChanged,
        placeholder: 'Rechercher restaurant, produit, boutique...',
        padding: const EdgeInsets.symmetric(vertical: 14),
        prefix: const Padding(
          padding: EdgeInsets.only(right: 8),
          child: Icon(CupertinoIcons.search, color: _muted, size: 20),
        ),
        decoration: const BoxDecoration(color: Colors.transparent),
        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _LocationCard extends StatelessWidget {
  const _LocationCard({
    required this.text,
    required this.locating,
    required this.onPressed,
  });

  final String text;
  final bool locating;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _softGreen,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Row(
        children: [
          const Icon(CupertinoIcons.location_solid, color: _primaryGreen),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: _darkGreen,
                fontSize: 13,
                height: 1.35,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          CupertinoButton(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            color: _primaryGreen,
            borderRadius: BorderRadius.circular(16),
            onPressed: onPressed,
            child: Text(
              locating ? 'GPS...' : 'Activer',
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

class _ExplorerCategory {
  const _ExplorerCategory(this.name, this.icon);
  final String name;
  final IconData icon;
}

class _CategoryRail extends StatelessWidget {
  const _CategoryRail({
    required this.categories,
    required this.selected,
    required this.onSelected,
  });

  final List<_ExplorerCategory> categories;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final category = categories[index];
          final active = category.name == selected;
          return CupertinoButton(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            color: active ? _primaryGreen : Colors.white,
            borderRadius: BorderRadius.circular(18),
            onPressed: () => onSelected(category.name),
            child: Row(
              children: [
                Icon(
                  category.icon,
                  size: 17,
                  color: active ? Colors.white : _primaryGreen,
                ),
                const SizedBox(width: 7),
                Text(
                  category.name,
                  style: TextStyle(
                    color: active ? Colors.white : _ink,
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.action});

  final String title;
  final String action;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: _ink,
              fontSize: 20,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        Text(
          action,
          style: const TextStyle(
            color: _primaryGreen,
            fontSize: 13,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }
}

class _Product {
  const _Product(this.name, this.store, this.price, this.icon);

  final String name;
  final String store;
  final String price;
  final String icon;
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});

  final _Product product;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 210,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(product.icon, style: const TextStyle(fontSize: 28)),
          const Spacer(),
          Text(
            product.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: _ink,
              fontWeight: FontWeight.w900,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            product.store,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: _muted, fontSize: 12),
          ),
          const SizedBox(height: 8),
          Text(
            product.price,
            style: const TextStyle(
              color: _primaryGreen,
              fontWeight: FontWeight.w900,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _Store {
  const _Store({
    required this.name,
    required this.category,
    required this.distance,
    required this.eta,
    required this.rating,
    required this.image,
    required this.verified,
  });

  final String name;
  final String category;
  final String distance;
  final String eta;
  final String rating;
  final String image;
  final bool verified;
}

class _StoreCard extends StatelessWidget {
  const _StoreCard({required this.store});

  final _Store store;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 68,
            height: 68,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: _softGreen,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Text(store.image, style: const TextStyle(fontSize: 30)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        store.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: _ink,
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    if (store.verified)
                      const Icon(
                        CupertinoIcons.checkmark_seal_fill,
                        color: _primaryGreen,
                        size: 18,
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  store.category,
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _StoreBadge(
                      icon: CupertinoIcons.star_fill,
                      text: store.rating,
                    ),
                    _StoreBadge(
                      icon: CupertinoIcons.location_fill,
                      text: store.distance,
                    ),
                    _StoreBadge(
                      icon: CupertinoIcons.clock_fill,
                      text: store.eta,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StoreBadge extends StatelessWidget {
  const _StoreBadge({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: _primaryGreen, size: 12),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              color: _ink,
              fontSize: 11,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyExplorerState extends StatelessWidget {
  const _EmptyExplorerState();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          Icon(CupertinoIcons.search, color: _primaryGreen, size: 32),
          SizedBox(height: 10),
          Text(
            'Aucun commerce trouvé',
            style: TextStyle(
              color: _ink,
              fontSize: 17,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Essayez une autre recherche ou une autre catégorie.',
            textAlign: TextAlign.center,
            style: TextStyle(color: _muted, height: 1.4),
          ),
        ],
      ),
    );
  }
}

class _BackendCard extends StatelessWidget {
  const _BackendCard();

  @override
  Widget build(BuildContext context) {
    return const Text(
      'Backend: $binqApiUrl',
      textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: 12,
        color: Color(0xFF94A3B8),
        fontWeight: FontWeight.w700,
      ),
    );
  }
}
