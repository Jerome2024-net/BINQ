# Binq Commerçant — Flutter iOS

Ce dossier contient l'application iOS Flutter/Dart destinée aux commerçants Binq.

## Contenu

- `pubspec.yaml` : dépendances Flutter
- `analysis_options.yaml` : règles Dart
- `lib/main.dart` : interface commerçant
- `setup_on_mac.sh` : génération du projet iOS natif sur Mac

## Installation sur Mac

```bash
cd "Binq commercant"
chmod +x setup_on_mac.sh
./setup_on_mac.sh
flutter run -d ios \
  --dart-define=BINQ_API_URL=https://binq.io \
  --dart-define=SUPABASE_URL=https://xxxxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGci... \
  --dart-define=MAPBOX_ACCESS_TOKEN=pk.xxxxxxxxxxxxxxxxx
```

L'app commerçant gère boutique, commandes, assignation livreur et portefeuille.
