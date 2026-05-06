# Binq Livreur — Flutter iOS

Ce dossier contient l'application iOS Flutter/Dart destinée aux livreurs Binq.

## Contenu

- `pubspec.yaml` : dépendances Flutter
- `analysis_options.yaml` : règles Dart
- `lib/main.dart` : interface livreur
- `setup_on_mac.sh` : génération du projet iOS natif sur Mac

## Installation sur Mac

```bash
cd "Binq livreur"
chmod +x setup_on_mac.sh
./setup_on_mac.sh
flutter run -d ios \
  --dart-define=BINQ_API_URL=https://binq.io \
  --dart-define=SUPABASE_URL=https://xxxxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGci... \
  --dart-define=MAPBOX_ACCESS_TOKEN=pk.xxxxxxxxxxxxxxxxx
```

L'app livreur gère le suivi GPS, les livraisons assignées et la position client.
