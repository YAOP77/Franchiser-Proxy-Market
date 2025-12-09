/**
 * Configuration et constantes centralisées pour Proxy Market Dashboard
 * Ce fichier contient toutes les valeurs constantes utilisées dans l'application
 */

/**
 * Informations sur l'application
 */
export const APP_CONFIG = {
  name: "Proxy Market",
  shortName: "ProxyMarket",
  description: "Dashboard de gestion pour Proxy Market",
  version: "1.0.0",
} as const;

/**
 * Routes de l'application
 */
export const ROUTES = {
  // Pages principales
  HOME: "/",
  DASHBOARD: "/",
  
  // Authentification
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
  
  // Pages utilisateur
  PROFILE: "/profile",
  CALENDAR: "/calendar",
  
  // Autres pages
  BLANK: "/blank",
  NOT_FOUND: "*",
} as const;

/**
 * Configuration des métadonnées par page
 */
export const PAGE_META = {
  HOME: {
    title: "Dashboard | Proxy Market",
    description: "Tableau de bord principal de Proxy Market",
  },
  PROFILE: {
    title: "Profil Utilisateur | Proxy Market",
    description: "Gérer votre profil utilisateur",
  },
  SIGN_IN: {
    title: "Connexion | Proxy Market",
    description: "Connectez-vous à votre compte Proxy Market",
  },
  SIGN_UP: {
    title: "Inscription | Proxy Market",
    description: "Créez un compte Proxy Market",
  },
} as const;

/**
 * Configuration de l'API (à compléter lors de l'intégration)
 */
export const API_CONFIG = {
  // Base URL sera définie lors de l'intégration
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 30000, // 30 secondes
  retryAttempts: 3,
} as const;

/**
 * Configuration du thème
 */
export const THEME_CONFIG = {
  defaultTheme: "light" as const,
  storageKey: "proxy-market-theme",
} as const;

/**
 * Configuration de la sidebar
 */
export const SIDEBAR_CONFIG = {
  collapsedWidth: 90,
  expandedWidth: 290,
  transitionDuration: 300, // ms
} as const;
