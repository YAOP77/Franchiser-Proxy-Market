/**
 * Context ThemeContext - Gestion du thème de l'application (light/dark mode)
 * 
 * Ce contexte permet de gérer le thème de l'application de manière centralisée.
 * Le thème est persisté dans le localStorage et appliqué au document HTML.
 */

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";
import { THEME_CONFIG } from "../config/constants";
import type { Theme } from "../types";

/**
 * Type pour le contexte du thème
 */
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

/**
 * Création du contexte avec une valeur par défaut undefined
 * pour détecter l'utilisation en dehors du Provider
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider du contexte Theme
 * Gère l'état du thème et sa persistance dans le localStorage
 * 
 * @param children - Composants enfants à envelopper
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(THEME_CONFIG.defaultTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialisation du thème depuis le localStorage au montage du composant
   * Évite le flash de contenu incorrect (FOUC) lors du chargement initial
   */
  useEffect(() => {
    // Récupération du thème sauvegardé dans le localStorage
    const savedTheme = localStorage.getItem(THEME_CONFIG.storageKey) as Theme | null;
    const initialTheme = savedTheme || THEME_CONFIG.defaultTheme;

    setTheme(initialTheme);
    setIsInitialized(true);
  }, []);

  /**
   * Application du thème au document HTML et sauvegarde dans le localStorage
   * S'exécute uniquement après l'initialisation pour éviter les erreurs SSR
   */
  useEffect(() => {
    if (isInitialized) {
      // Sauvegarde du thème dans le localStorage
      localStorage.setItem(THEME_CONFIG.storageKey, theme);

      // Application de la classe 'dark' au document HTML
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, isInitialized]);

  /**
   * Fonction pour basculer entre le thème light et dark
   */
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook personnalisé pour accéder au contexte Theme
 * @throws {Error} Si utilisé en dehors du ThemeProvider
 * @returns {ThemeContextType} Le contexte du thème avec theme et toggleTheme
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
