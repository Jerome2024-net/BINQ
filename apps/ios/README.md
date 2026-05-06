# Binq iOS

Binq est séparé en trois applications mobiles iOS Expo :

- `binq-client` : commande, localisation client, suivi commande.
- `binq-livreur` : livraisons assignées, position livreur, itinéraire Mapbox.
- `binq-commercant` : gestion boutique, commandes, assignation livreur, wallet.

## Pré-requis iOS

- Un Mac avec Xcode pour lancer un simulateur iOS ou compiler localement.
- Node.js et npm.
- Un compte Expo/EAS pour générer des builds TestFlight/App Store.
- Variables dans `.env` copiées depuis `.env.example`.

## Lancer une app

Depuis la racine du projet :

- Client : `npm run ios:client:start`
- Livreur : `npm run ios:livreur:start`
- Commerçant : `npm run ios:commercant:start`

Puis, dans le terminal Expo, choisir `i` pour iOS.

## Build iOS natif

Dans le dossier d’une app :

1. `npm install`
2. `npm run prebuild:ios`
3. `npm run ios`

Pour Mapbox iOS, `MAPBOX_DOWNLOADS_TOKEN` est requis au moment du prebuild natif.

## Connexion backend

Les apps pointent vers l’API web Binq avec :

- `EXPO_PUBLIC_BINQ_API_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`

Le backend Next.js reste la source commune pour les commandes, paiements, livreurs, wallets et Mapbox.
