# Boutique Proxy Market - Dashboard de Gestion

Dashboard de gestion pour les franchisés de Proxy Market, permettant la gestion complète de leur boutique en ligne, de leurs produits, commandes et livreurs.

## 📋 Description

Boutique Proxy Market est une application web moderne développée en React et TypeScript qui permet aux franchisés de gérer efficacement leur boutique en ligne. L'application offre une interface intuitive pour gérer les produits, suivre les commandes, administrer les livreurs et consulter les statistiques de vente.

## ✨ Fonctionnalités principales

### 🏠 Dashboard
- Vue d'ensemble des métriques clés (clients, commandes, ventes, stock)
- Graphiques de statistiques et analyses
- Liste des commandes récentes
- Animations fluides pour les statistiques

### 📦 Gestion des produits
- Consultation de tous les produits vivriers disponibles
- Gestion du stock de la boutique
- Ajout de produits au store du franchisé
- Affichage professionnel des produits avec catégories

### 🛒 Gestion des commandes
- Liste complète des commandes avec pagination
- Séparation entre commandes en attente et commandes livrées
- Détails complets de chaque commande
- Attribution de commandes aux livreurs
- Suivi du statut des commandes en temps réel
- Notifications automatiques pour nouvelles commandes et changements de statut

### 🚚 Administration des livreurs
- Création de livreurs
- Liste des livreurs avec pagination
- Détails complets de chaque livreur
- Modification et suppression de livreurs
- Gestion du statut (actif/inactif)

### 👤 Profil utilisateur
- Consultation et modification du profil franchisé
- Gestion des informations personnelles

### 🔔 Système de notifications
- Notifications en temps réel pour nouvelles commandes
- Alertes pour changements de statut des commandes
- Indicateur visuel (clignotant) pour nouvelles notifications
- Historique des notifications

## 🛠️ Technologies utilisées

- **React 19** - Bibliothèque UI moderne
- **TypeScript** - Typage statique pour une meilleure maintenabilité
- **Tailwind CSS 4** - Framework CSS utilitaire
- **React Router 7** - Routage côté client
- **Axios** - Client HTTP pour les appels API
- **Vite** - Build tool rapide et moderne
- **ApexCharts** - Visualisation de données
- **React Icons** - Bibliothèque d'icônes

## 📦 Prérequis

- **Node.js** 18.x ou supérieur (recommandé : Node.js 20.x ou supérieur)
- **npm** ou **yarn** pour la gestion des dépendances

## 🚀 Installation

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-repo>
   cd Boutique_Proxy_Market
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```
   
   > 💡 Si vous rencontrez des problèmes lors de l'installation, utilisez le flag `--legacy-peer-deps`

3. **Configurer les variables d'environnement**
   
   Créer un fichier `.env` à la racine du projet avec les variables suivantes :
   ```env
   VITE_API_BASE_URL=http://boutique-api.proxymarketapp.com/api
   ```

4. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

   L'application sera accessible sur `http://localhost:5173`

## 📜 Scripts disponibles

- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run lint` - Vérifie le code avec ESLint
- `npm run preview` - Prévisualise la build de production

## 📁 Structure du projet

```
Boutique_Proxy_Market/
├── src/
│   ├── components/        # Composants réutilisables
│   │   ├── common/        # Composants communs (PageMeta, Breadcrumb, etc.)
│   │   ├── ui/            # Composants UI (Button, Input, etc.)
│   │   └── ...
│   ├── pages/             # Pages de l'application
│   │   ├── Dashboard/     # Page d'accueil
│   │   ├── Orders/        # Gestion des commandes
│   │   ├── Products/      # Gestion des produits
│   │   ├── Delivery/      # Gestion des livreurs
│   │   └── ...
│   ├── services/          # Services API
│   │   └── api/           # Appels API (orderService, deliveryService, etc.)
│   ├── context/           # Contextes React (Auth, Theme, Notifications)
│   ├── config/            # Configuration (navigation, constants)
│   ├── utils/             # Utilitaires
│   ├── types/             # Définitions TypeScript
│   └── App.tsx            # Point d'entrée de l'application
├── public/                # Fichiers statiques
├── assets/                # Assets du projet
├── package.json           # Dépendances et scripts
├── tsconfig.json          # Configuration TypeScript
├── vite.config.ts         # Configuration Vite
└── tailwind.config.js     # Configuration Tailwind CSS
```

## 🔐 Authentification

L'application utilise un système d'authentification basé sur des tokens JWT. Les tokens sont stockés de manière sécurisée dans le localStorage et sont automatiquement inclus dans les requêtes API.

### Endpoints API utilisés

- `POST /auth/login` - Connexion
- `GET /commandes-index` - Liste des commandes
- `GET /commande-detail/{id}` - Détails d'une commande
- `POST /attribution-au-livreur` - Attribution d'une commande
- `GET /livreur/index` - Liste des livreurs
- `POST /livreur/store` - Création d'un livreur
- `GET /livreur/show/{id}` - Détails d'un livreur
- `POST /livreur/update/{id}` - Modification d'un livreur
- Et plus...

## 🎨 Thème et personnalisation

L'application supporte le mode sombre (dark mode) avec basculement automatique. Les couleurs principales peuvent être personnalisées via Tailwind CSS.

## 📝 Bonnes pratiques de développement

- **TypeScript strict** - Typage strict activé pour une meilleure sécurité de type
- **Composants fonctionnels** - Utilisation exclusive de composants fonctionnels React
- **Hooks personnalisés** - Réutilisation de la logique métier via des hooks
- **Gestion d'erreurs** - Gestion centralisée des erreurs API
- **Code modulaire** - Structure modulaire pour faciliter la maintenance
- **Accessibilité** - Respect des standards d'accessibilité web

## 🤝 Contribution

Ce projet est privé et destiné à un usage interne. Pour toute question ou suggestion, contactez l'équipe de développement.

## 📄 Licence

Ce projet est propriétaire et confidentiel. Tous droits réservés.

## 👥 Équipe

Développé pour Proxy Market par l'équipe de développement.

---

**Version:** 1.0.0  
**Dernière mise à jour:** Décembre 2024
