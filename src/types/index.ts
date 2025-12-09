/**
 * Types TypeScript centralisés pour Proxy Market Dashboard
 * Tous les types et interfaces utilisés dans l'application sont définis ici
 */

/**
 * Type pour le thème de l'application
 */
export type Theme = "light" | "dark";

/**
 * Type pour les éléments de navigation
 */
export interface NavItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: NavSubItem[];
  badge?: "new" | "pro";
}

export interface NavSubItem {
  name: string;
  path: string;
  badge?: "new" | "pro";
}

/**
 * Type pour les données de réponse de l'API (à compléter lors de l'intégration)
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

/**
 * Type pour l'utilisateur (à compléter selon les besoins)
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
}

/**
 * Type pour les états de chargement
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Type pour les états du sidebar
 */
export interface SidebarState {
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
}

/**
 * Type générique pour les props de composants
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
