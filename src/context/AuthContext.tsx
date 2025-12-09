/**
 * Contexte d'authentification - Gestion sécurisée de l'état de connexion
 * 
 * Ce contexte fournit une gestion centralisée et sécurisée de l'authentification :
 * - État de connexion de l'utilisateur avec validation du token
 * - Fonctions de connexion et déconnexion avec gestion d'erreurs robuste
 * - Vérification automatique de l'expiration du token
 * - Persistance sécurisée de la session via localStorage
 * - Nettoyage automatique des tokens expirés
 * 
 * SECURITE:
 * - Validation de l'expiration du token à chaque chargement
 * - Aucune donnée sensible n'est loggée
 * - Nettoyage automatique en cas d'erreur ou d'expiration
 * - Gestion centralisée pour éviter les failles
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authService, { LoginResponse } from "../services/api/authService";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé pour le localStorage
const AUTH_STORAGE_KEY = "proxy_market_auth";
const USER_STORAGE_KEY = "proxy_market_user";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Vérifie si l'utilisateur est authentifié au chargement de l'application
   * 
   * Cette fonction :
   * - Récupère le token et les données utilisateur du localStorage
   * - Valide l'expiration du token
   * - Nettoie automatiquement les tokens expirés ou invalides
   * - Met à jour l'état d'authentification
   */
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authToken = localStorage.getItem(AUTH_STORAGE_KEY);
        const userData = localStorage.getItem(USER_STORAGE_KEY);

        if (authToken && userData) {
          // Vérifier si le token est valide (non expiré)
          const tokenData = JSON.parse(authToken);
          const now = Date.now();

          // Validation du token : vérifier la présence du token et la date d'expiration
          if (tokenData.token && tokenData.expiresAt && tokenData.expiresAt > now) {
            // Token valide : restaurer la session
            setIsAuthenticated(true);
            setUser(JSON.parse(userData));
          } else {
            // Token expiré ou invalide : nettoyer le localStorage
            localStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // Aucune session trouvée
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        // En cas d'erreur de parsing ou autre, nettoyer et réinitialiser
        // Ne pas logger l'erreur pour éviter d'exposer des informations sensibles
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Fonction de connexion
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe de l'utilisateur
   * @returns Promise<{ success: boolean; error?: string }> - Résultat de la connexion
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Appeler l'API d'authentification
      const response: LoginResponse = await authService.login({ email, password });

      if (response.success && response.data) {
        const { token, user: userData, expiresIn } = response.data;

        // Calculer la date d'expiration
        // Si expiresIn est fourni par l'API, l'utiliser, sinon utiliser 24h par défaut
        const expiresAt = expiresIn 
          ? Date.now() + expiresIn * 1000 
          : Date.now() + 24 * 60 * 60 * 1000; // 24 heures par défaut

        // Sauvegarder le token et les données utilisateur
        const tokenData = {
          token,
          expiresAt,
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokenData));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

        // Mettre à jour l'état
        setIsAuthenticated(true);
        setUser(userData);

        return { success: true };
      } else {
        // Réponse de l'API indiquant un échec
        return { 
          success: false, 
          error: response.message || "Erreur lors de la connexion" 
        };
      }
    } catch (error: any) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      const errorMessage = error.message || "Une erreur est survenue lors de la connexion";
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  /**
   * Fonction de déconnexion
   */
  const logout = async (): Promise<void> => {
    try {
      // Appeler l'API de déconnexion
      await authService.logout();
    } catch (error) {
      // Ne pas logger l'erreur pour éviter d'exposer des informations sensibles
    } finally {
      // Nettoyer le localStorage même en cas d'erreur API
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);

      // Mettre à jour l'état
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const updatedUser: User = {
        ...prevUser,
        ...data,
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const value: AuthContextType = {
        isAuthenticated,
        user,
        login,
        logout,
        isLoading,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 * @throws Error si utilisé en dehors d'un AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}

