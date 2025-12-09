/**
 * Service d'authentification - Boutique Proxy Market
 * 
 * Ce service gère toutes les opérations liées à l'authentification :
 * - Connexion (login) via l'API : POST /auth/login
 * - Déconnexion (logout) via l'API : POST /auth-logout
 * - Vérification du token
 * 
 * IMPORTANT: 
 * - L'utilisateur doit être un gérant de boutique créé dans le back office
 * - Le statut du gérant doit être défini sur 1 pour pouvoir se connecter
 */

import apiClient from "./axiosConfig";

/**
 * Interface pour les données de connexion
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface pour la réponse de connexion
 */
export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role?: string;
    };
    expiresIn?: number; // Durée de validité en secondes
  };
}

/**
 * Interface pour la réponse d'erreur de l'API
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * Connexion d'un gérant de boutique
   * 
   * PREREQUIS:
   * - L'utilisateur doit être un gérant créé dans le back office
   * - Le statut du gérant doit être défini sur 1 (actif)
   * 
   * @param credentials - Email et mot de passe du gérant
   * @returns Promise<LoginResponse> - Réponse de l'API avec le token et les données utilisateur
   * @throws Error - Si l'authentification échoue ou si le statut n'est pas valide
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Appel à l'API de la boutique : POST /auth/login
      const response = await apiClient.post<any>("/auth/login", credentials);
      
      // Structure de réponse de l'API boutique :
      // { message, user: { id, nom, prenoms, email, role, ... }, token, retour }
      
      // Vérifier si la réponse contient un token ET retour = 1 (succès)
      // retour peut être un nombre (1) ou une chaîne ("1")
      if (response.data.token && (response.data.retour === 1 || response.data.retour === "1")) {
        // Construire le nom complet depuis nom et prenoms
        const user = response.data.user;
        const fullName = user 
          ? `${user.prenoms || ''} ${user.nom || ''}`.trim() || user.name || "Gerant"
          : "Gerant";
        
        const formattedResponse = {
          success: true,
          data: {
            token: response.data.token,
            user: {
              id: user?.id || "",
              name: fullName,
              email: user?.email || credentials.email,
              role: user?.role || "boutique_admin",
            },
            expiresIn: response.data.expiresIn || response.data.expires_in || 86400, // 24h par défaut
          },
        };
        return formattedResponse;
      }
      
      // Format avec wrapper success : { success: true, data: { token, user, ... } }
      if (response.data.success && response.data.data) {
        return response.data;
      }
      
      // Format avec wrapper data : { data: { token, user, ... } }
      if (response.data.data && response.data.data.token) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      
      // Si retour = 0 ou token absent, considérer comme un échec
      return {
        success: false,
        message: response.data.message || "Echec de l'authentification. Verifiez votre statut.",
      };
    } catch (error: any) {
      // Gestion centralisée des erreurs sans exposer de données sensibles
      if (error.response) {
        const apiError = error.response.data;
        
        // Erreur 401: Identifiants incorrects ou statut inactif
        if (error.response.status === 401) {
          const errorMessage = 
            apiError?.message || 
            "Identifiants incorrects ou compte inactif. Verifiez que votre statut est defini sur 1.";
          throw new Error(errorMessage);
        }
        
        // Erreur 403: Accès refusé (peut-être dû au statut)
        if (error.response.status === 403) {
          throw new Error("Acces refuse. Verifiez que votre compte est actif (statut = 1).");
        }
        
        // Autres erreurs API
        const errorMessage = 
          apiError?.message || 
          apiError?.error || 
          apiError?.errors?.email?.[0] ||
          apiError?.errors?.password?.[0] ||
          "Erreur lors de la connexion. Verifiez vos identifiants.";
        throw new Error(errorMessage);
      } else if (error.request) {
        // Erreur réseau
        throw new Error("Impossible de contacter le serveur. Verifiez votre connexion internet.");
      } else {
        // Erreur de configuration
        throw new Error(error.message || "Une erreur est survenue lors de la connexion");
      }
    }
  },

  /**
   * Déconnexion d'un gérant de boutique
   * 
   * Appelle l'API pour invalider le token côté serveur : POST /auth-logout
   * Même en cas d'erreur API, la déconnexion côté client est effectuée
   * 
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      // Appeler l'endpoint de déconnexion de la boutique
      // IMPORTANT: L'endpoint utilise un tiret (/auth-logout et non /auth/logout)
      await apiClient.post("/auth-logout");
    } catch (error) {
      // Même en cas d'erreur API (réseau, serveur, token invalide, etc.), 
      // on continue le processus de déconnexion côté client
      // Cela garantit que l'utilisateur peut toujours se déconnecter localement
      // Ne pas logger les erreurs pour éviter d'exposer des informations sensibles
    }
  },

  /**
   * Vérifier la validité du token
   * @returns Promise<boolean> - true si le token est valide
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await apiClient.get("/auth/verify");
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  },
};

export default authService;

