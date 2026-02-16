# TontineApp - Tontine en Ligne

Application web de gestion de tontines (épargne collective rotative) en ligne.

## 🚀 Fonctionnalités

- **Page d'accueil** : Landing page avec présentation de l'application
- **Authentification** : Pages de connexion et inscription
- **Dashboard** : Tableau de bord avec statistiques et aperçu des tontines
- **Gestion des Tontines** : Créer, rejoindre et suivre des tontines
- **Suivi des Paiements** : Historique complet des cotisations
- **Gestion des Membres** : Voir les membres, rôles et statuts
- **Planning des Tours** : Calendrier des tours de bénéfice

## 🛠️ Technologies

- **Next.js 14** avec App Router
- **TypeScript**
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes

## 📦 Installation

```bash
npm install
```

## 🏃 Lancement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
src/
├── app/
│   ├── page.tsx              # Page d'accueil (landing)
│   ├── layout.tsx            # Layout principal
│   ├── globals.css           # Styles globaux
│   ├── connexion/page.tsx    # Page de connexion
│   ├── inscription/page.tsx  # Page d'inscription
│   ├── dashboard/
│   │   ├── layout.tsx        # Layout dashboard
│   │   └── page.tsx          # Tableau de bord
│   ├── tontines/
│   │   ├── layout.tsx        # Layout tontines
│   │   ├── page.tsx          # Liste des tontines
│   │   ├── creer/page.tsx    # Formulaire de création
│   │   └── [id]/page.tsx     # Détails d'une tontine
│   └── paiements/
│       ├── layout.tsx        # Layout paiements
│       └── page.tsx          # Liste des paiements
├── components/
│   ├── Navbar.tsx            # Barre de navigation
│   ├── Footer.tsx            # Pied de page
│   └── DashboardLayout.tsx   # Layout avec sidebar
├── lib/
│   └── data.ts               # Données de démonstration
└── types/
    └── index.ts              # Types TypeScript
```

## 🎨 Pages

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Landing page |
| Connexion | `/connexion` | Formulaire de connexion |
| Inscription | `/inscription` | Formulaire d'inscription |
| Dashboard | `/dashboard` | Tableau de bord |
| Tontines | `/tontines` | Liste des tontines |
| Créer Tontine | `/tontines/creer` | Création de tontine |
| Détails Tontine | `/tontines/[id]` | Détails d'une tontine |
| Paiements | `/paiements` | Historique des paiements |
