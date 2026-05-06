# Binq iOS

Binq est séparé en trois applications mobiles iOS Flutter/Dart :

- `Binq clients` : commande, localisation client, suivi commande.
- `Binq livreur` : livraisons assignées, position livreur, itinéraire Mapbox.
- `Binq commercant` : gestion boutique, commandes, assignation livreur, wallet.

## Pré-requis iOS

- Un Mac avec Xcode pour lancer un simulateur iOS ou compiler localement.
- Flutter SDK installé.
- CocoaPods pour compiler iOS.
- Variables transmises avec `--dart-define`.

## Lancer une app

Depuis la racine du projet :

- Client : `npm run ios:client:start`
- Livreur : `npm run ios:livreur:start`
- Commerçant : `npm run ios:commercant:start`

Les scripts racine lancent `flutter run -d ios` dans le dossier concerné.

## Copier vers Mac

Copiez ces trois dossiers sur le Mac :

- `Binq clients`
- `Binq livreur`
- `Binq commercant`

Chaque dossier contient son propre `pubspec.yaml`, `analysis_options.yaml`, `lib/main.dart`, `README.md` et `setup_on_mac.sh`.

## Build iOS natif

Dans le dossier d’une app :

1. `flutter pub get`
2. `flutter create --platforms=ios .` si le dossier `ios/` n’existe pas encore
3. `flutter run -d ios`
4. `flutter build ios`

Pour Mapbox iOS, configurez `MAPBOX_ACCESS_TOKEN` via `--dart-define` et les réglages iOS Mapbox si nécessaire.

## Connexion backend

Les apps pointent vers l’API web Binq avec :

- `BINQ_API_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `MAPBOX_ACCESS_TOKEN`

Exemple :

```bash
flutter run -d ios \
	--dart-define=BINQ_API_URL=https://binq.io \
	--dart-define=SUPABASE_URL=https://xxxxx.supabase.co \
	--dart-define=SUPABASE_ANON_KEY=eyJhbGci... \
	--dart-define=MAPBOX_ACCESS_TOKEN=pk.xxxxxxxxxxxxxxxxx
```

Le backend Next.js reste la source commune pour les commandes, paiements, livreurs, wallets et Mapbox.
