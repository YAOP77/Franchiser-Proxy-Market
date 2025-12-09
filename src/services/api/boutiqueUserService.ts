/**
 * Service de gestion des utilisateurs de boutique (franchisés) - Proxy Market Dashboard
 * 
 * Ce service gère toutes les opérations liées aux utilisateurs de boutique :
 * - Création d'un utilisateur de boutique
 */

import apiClient from "./axiosConfig";
import { formatApiErrorMessage, ApiValidationError } from "../../utils/apiErrorUtils";

/**
 * Interface pour les données de création d'utilisateur de boutique
 */
export interface CreateBoutiqueUserData {
  nom: string;
  prenoms: string;
  email: string;
  commune_id: string | number;
  role: "boutique_admin";
  password: string;
  contact_1: string;
  status: number; // 1 pour actif, 0 pour inactif
  boutique_id?: string; // UUID de la boutique (optionnel, requis pour l'endpoint)
}

/**
 * Interface pour les données de modification d'utilisateur de boutique
 */
export interface UpdateBoutiqueUserData {
  nom: string;
  prenoms: string;
  email: string;
  commune_id: string | number;
  role: "boutique_admin";
  password?: string; // Optionnel lors de la modification
  contact_1: string;
  contact_2?: string;
  status: number; // 1 pour actif, 0 pour inactif
}

/**
 * Interface pour la réponse de création d'utilisateur de boutique
 */
export interface CreateBoutiqueUserResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * Interface pour un utilisateur de boutique (franchisé)
 */
export interface BoutiqueUser {
  id: string;
  nom: string;
  prenoms: string;
  email: string;
  contact_1?: string | null;
  contact_2?: string | null;
  commune_id?: number | string;
  role: "boutique_admin" | string;
  status: number; // 0 = inactif, 1 = actif
  created_at?: string;
  updated_at?: string;
}

/**
 * Service de gestion des utilisateurs de boutique
 */
const boutiqueUserService = {
  /**
   * Récupérer les détails d'un utilisateur de boutique (franchisé/gérant)
   * Endpoint: GET /boutique-user/show/{gerant_id}/{boutique_id}
   * @param gerantId - UUID du gérant (franchisé)
   * @param boutiqueId - UUID de la boutique
   * @returns Promise avec les données du franchisé
   */
  async getBoutiqueUserDetails(gerantId: string, boutiqueId: string): Promise<{
    success: boolean;
    data?: BoutiqueUser;
    error?: string;
  }> {
    try {
      // Validation des paramètres
      if (!gerantId || !gerantId.trim()) {
        throw new Error("L'ID du gérant est requis");
      }
      if (!boutiqueId || !boutiqueId.trim()) {
        throw new Error("L'ID de la boutique est requis");
      }

      const endpoint = `/boutique-user/show/${gerantId.trim()}/${boutiqueId.trim()}`;
      const response = await apiClient.get<unknown>(endpoint);
      
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // Vérifier si la réponse est une chaîne d'erreur
      if (typeof response.data === 'string') {
        const responseString: string = response.data;
        const lowerResponse = responseString.toLowerCase();
        if (lowerResponse.includes('connecté') || 
            lowerResponse.includes('authentification') ||
            lowerResponse.includes('unauthorized')) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }
        throw new Error("Réponse inattendue de l'API");
      }

      // L'API peut retourner les données dans différentes structures
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as Record<string, unknown>;
        
        // Structure { data: {...} }
        if (responseData.data && typeof responseData.data === 'object') {
          return {
            success: true,
            data: responseData.data as BoutiqueUser,
          };
        }
        
        // Structure { user: {...} }
        if (responseData.user && typeof responseData.user === 'object') {
          return {
            success: true,
            data: responseData.user as BoutiqueUser,
          };
        }
        
        // Structure { boutique_user: {...} }
        if (responseData.boutique_user && typeof responseData.boutique_user === 'object') {
          return {
            success: true,
            data: responseData.boutique_user as BoutiqueUser,
          };
        }
        
        // Si la réponse directe contient les champs d'un BoutiqueUser
        if (responseData.id && responseData.email) {
          return {
            success: true,
            data: responseData as unknown as BoutiqueUser,
          };
        }
      }
      
      // Structure non reconnue
      if (import.meta.env.DEV) {
        console.warn("getBoutiqueUserDetails: Structure de réponse non reconnue", response.data);
      }
      throw new Error("Format de réponse inattendu");
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: {
              message?: string;
              error?: string;
            };
          };
        };
        
        const status = axiosError.response?.status;
        const apiError = axiosError.response?.data;
        
        if (status === 404) {
          return {
            success: false,
            error: "Franchisé non trouvé ou accès non autorisé",
          };
        }
        
        if (status === 401 || status === 403) {
          return {
            success: false,
            error: "Accès non autorisé. Veuillez vous reconnecter.",
          };
        }
        
        const errorMessage =
          apiError?.message ||
          apiError?.error ||
          `Erreur ${status}: ${axiosError.response?.statusText}` ||
          "Erreur lors de la récupération des détails du franchisé";
        
        return { success: false, error: errorMessage };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de la récupération des détails du franchisé";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Créer un nouvel utilisateur de boutique
   * Endpoint: POST /boutique-user/store/{boutique_id}
   * @param userData - Données de l'utilisateur de boutique à créer (doit inclure boutique_id)
   * @returns Promise<CreateBoutiqueUserResponse> - Réponse de l'API
   */
  async createBoutiqueUser(userData: CreateBoutiqueUserData): Promise<CreateBoutiqueUserResponse> {
    try {
      // Vérifier que boutique_id est fourni
      if (!userData.boutique_id || !userData.boutique_id.trim()) {
        throw new Error("L'ID de la boutique (boutique_id) est requis pour créer un utilisateur de boutique");
      }

      // Préparer les données exactement comme l'API les attend
      const payload: Record<string, unknown> = {
        nom: userData.nom.trim(),
        prenoms: userData.prenoms.trim(),
        email: userData.email.trim().toLowerCase(),
        commune_id: typeof userData.commune_id === "string" 
          ? userData.commune_id 
          : String(userData.commune_id),
        role: userData.role,
        password: userData.password,
        contact_1: userData.contact_1.trim(),
        status: userData.status,
      };

      // Construire l'URL avec l'ID de la boutique
      const endpoint = `/boutique-user/store/${userData.boutique_id.trim()}`;
      const response = await apiClient.post<unknown>(endpoint, payload);
      
      // Vérifier le statut HTTP pour confirmer la création réussie
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La création a échoué avec le statut HTTP ${response.status}`);
      }
      
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // Parser la réponse de l'API
      const responseData = response.data as Record<string, unknown>;
      
      // Vérifier si c'est une erreur explicite
      if (responseData.error || (responseData.retour === 0) || (responseData.cls === 'error')) {
        const errorMessage = typeof responseData.error === 'string' 
          ? responseData.error 
          : typeof responseData.message === 'string' 
          ? responseData.message 
          : typeof responseData.msg === 'string'
          ? responseData.msg
          : "Erreur lors de la création de l'utilisateur de boutique";
        throw new Error(errorMessage);
      }

      // Retourner une réponse de succès
      if (responseData.retour === 1 && responseData.cls === 'success') {
        return {
          success: true,
          message: typeof responseData.msg === 'string' 
            ? responseData.msg 
            : typeof responseData.message === 'string'
            ? responseData.message
            : "Utilisateur de boutique créé avec succès",
          data: responseData.user || responseData.data || responseData,
        };
      }

      // Si la structure de réponse n'est pas reconnue, considérer comme succès si pas d'erreur
      return {
        success: true,
        message: typeof responseData.msg === 'string' 
          ? responseData.msg 
          : typeof responseData.message === 'string'
          ? responseData.message
          : "Utilisateur de boutique créé avec succès",
        data: responseData.user || responseData.data || responseData,
      };
    } catch (error: unknown) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            statusText?: string; 
            data?: ApiValidationError & {
              msg?: string;
              message?: string;
            };
          }; 
        };
        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;
        
        // Erreur 404 : Route non trouvée
        if (status === 404) {
          const errorMsg = apiError?.message || apiError?.msg || apiError?.error;
          if (errorMsg && typeof errorMsg === 'string') {
            return { success: false, error: errorMsg };
          }
          return { success: false, error: "La route API n'a pas été trouvée. Veuillez vérifier la configuration de l'API." };
        }
        
        // Erreur 422 : Validation échouée
        if (status === 422 && apiError) {
          const errorMessage = formatApiErrorMessage(
            apiError as ApiValidationError,
            "Erreur de validation : Veuillez vérifier tous les champs requis"
          );
          return { success: false, error: errorMessage };
        }
        
        // Erreur 500 : Erreur serveur
        if (status === 500) {
          const errorMsg = apiError?.message || apiError?.error || apiError?.msg;
          if (errorMsg && typeof errorMsg === 'string') {
            return { success: false, error: `Erreur serveur : ${errorMsg}` };
          }
          if (apiError && typeof apiError === 'object' && 'errors' in apiError) {
            const errorMessage = formatApiErrorMessage(
              apiError as ApiValidationError,
              "Erreur serveur : Veuillez vérifier les données envoyées"
            );
            return { success: false, error: errorMessage };
          }
          return { success: false, error: "Erreur serveur : Veuillez vérifier les données envoyées et réessayer" };
        }
        
        // Message d'erreur générique
        let errorMessage: string;
        if (apiError?.message && typeof apiError.message === 'string') {
          errorMessage = apiError.message;
        } else if (apiError?.msg && typeof apiError.msg === 'string') {
          errorMessage = apiError.msg;
        } else if (apiError?.error) {
          // Utiliser formatApiErrorMessage pour gérer les objets d'erreur
          errorMessage = formatApiErrorMessage(apiError as ApiValidationError, "Erreur lors de la création de l'utilisateur de boutique");
        } else if (status) {
          errorMessage = `Erreur ${status}: ${axiosError.response?.statusText || "Erreur inconnue"}`;
        } else {
          errorMessage = "Erreur lors de la création de l'utilisateur de boutique";
        }
        return { success: false, error: errorMessage };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de la création de l'utilisateur de boutique";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Récupérer la liste des utilisateurs de boutique (franchisés/gérants)
   * Endpoint: GET /boutique-user/index/{boutique_id}
   * @param boutique_id - UUID de la boutique (requis)
   * @param page - Numéro de page (par défaut: 1)
   * @returns Promise avec les données paginées ou la liste complète
   */
  async getBoutiqueUsers(boutique_id: string, page?: number): Promise<{
    data: BoutiqueUser[];
    meta?: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
    links?: {
      first: string | null;
      last: string | null;
      prev: string | null;
      next: string | null;
    };
  }> {
    try {
      // Vérifier que boutique_id est fourni
      if (!boutique_id || !boutique_id.trim()) {
        throw new Error("L'ID de la boutique (boutique_id) est requis pour récupérer les utilisateurs de boutique");
      }

      // Construire l'URL avec l'ID de la boutique et la pagination
      const baseUrl = `/boutique-user/index/${boutique_id.trim()}`;
      const url = page ? `${baseUrl}?page=${page}` : baseUrl;
      const response = await apiClient.get<unknown>(url);
      
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // Vérifier si la réponse est une chaîne d'erreur
      if (typeof response.data === 'string') {
        const responseString: string = response.data;
        const lowerResponse = responseString.toLowerCase();
        if (lowerResponse.includes('connecté') || 
            lowerResponse.includes('connecte') ||
            lowerResponse.includes('authentification') ||
            lowerResponse.includes('unauthorized')) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }
        throw new Error("Réponse inattendue de l'API");
      }

      // L'API peut retourner les données dans différentes structures
      // Vérifier d'abord si c'est un tableau direct
      if (Array.isArray(response.data)) {
        return {
          data: response.data as BoutiqueUser[],
        };
      }
      
      // Si c'est un objet, vérifier les différentes structures
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        const responseData = response.data as Record<string, unknown>;
        
        // Si la réponse est paginée avec structure { data: [...], links: {...}, meta: {...} }
        if (responseData.data && Array.isArray(responseData.data)) {
          return {
            data: responseData.data as BoutiqueUser[],
            meta: responseData.meta as {
              current_page: number;
              from: number;
              last_page: number;
              per_page: number;
              to: number;
              total: number;
            },
            links: responseData.links as {
              first: string | null;
              last: string | null;
              prev: string | null;
              next: string | null;
            },
          };
        }
        
        // Si la réponse est dans un wrapper { users: [...] } ou { boutique_users: [...] }
        if ((responseData.users && Array.isArray(responseData.users)) || 
            (responseData.boutique_users && Array.isArray(responseData.boutique_users))) {
          return {
            data: (responseData.users || responseData.boutique_users) as BoutiqueUser[],
          };
        }
      }
      
      // Retourner un tableau vide si la structure n'est pas reconnue
      if (import.meta.env.DEV) {
        console.warn("getBoutiqueUsers: Structure de réponse non reconnue", response.data);
      }
      return { data: [] };
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: {
              message?: string;
              error?: string;
            };
          };
        };
        
        const status = axiosError.response?.status;
        const apiError = axiosError.response?.data;
        
        // Erreurs critiques : authentification, autorisation
        if (status === 401 || status === 403) {
          const errorMessage =
            apiError?.message ||
            apiError?.error ||
            `Erreur ${status}: ${axiosError.response?.statusText}` ||
            "Erreur d'authentification lors de la récupération des utilisateurs de boutique";
          throw new Error(errorMessage);
        }
        
        // Autres erreurs HTTP : logger en mode développement
        if (import.meta.env.DEV) {
          console.error("getBoutiqueUsers: Erreur lors de la récupération", {
            status,
            message: apiError?.message || apiError?.error,
          });
        }
        
        // Retourner un tableau vide pour ne pas bloquer l'affichage
        return { data: [] };
      } else if (error && typeof error === 'object' && 'request' in error) {
        // Erreur réseau : aucune réponse du serveur
        if (import.meta.env.DEV) {
          console.error("getBoutiqueUsers: Erreur réseau - Aucune réponse du serveur");
        }
        return { data: [] };
      } else {
        // Autre type d'erreur
        if (error instanceof Error) {
          if (import.meta.env.DEV) {
            console.error("getBoutiqueUsers: Erreur inattendue", error);
          }
          // Propager l'erreur si c'est une erreur d'authentification
          if (error.message.includes("authentifié") || error.message.includes("authentification")) {
            throw error;
          }
        }
        return { data: [] };
      }
    }
  },

  /**
   * Mettre à jour un utilisateur de boutique (franchisé/gérant)
   * Endpoint: POST /boutique-user/update/{gerant_id}/{boutique_id}
   * @param gerantId - UUID du gérant (franchisé)
   * @param boutiqueId - UUID de la boutique
   * @param userData - Données de l'utilisateur à mettre à jour
   * @returns Promise avec le résultat de la mise à jour
   */
  async updateBoutiqueUser(
    gerantId: string,
    boutiqueId: string,
    userData: UpdateBoutiqueUserData
  ): Promise<CreateBoutiqueUserResponse> {
    try {
      // Validation des paramètres
      if (!gerantId || !gerantId.trim()) {
        throw new Error("L'ID du gérant est requis");
      }
      if (!boutiqueId || !boutiqueId.trim()) {
        throw new Error("L'ID de la boutique est requis");
      }

      // Préparer les données exactement comme l'API les attend
      const payload: Record<string, unknown> = {
        nom: userData.nom.trim(),
        prenoms: userData.prenoms.trim(),
        email: userData.email.trim().toLowerCase(),
        commune_id: userData.commune_id,
        role: userData.role || "boutique_admin",
        contact_1: userData.contact_1.trim(),
        status: userData.status,
      };

      // Ajouter contact_2 seulement s'il est fourni
      if (userData.contact_2 && userData.contact_2.trim()) {
        payload.contact_2 = userData.contact_2.trim();
      }

      // Ajouter le mot de passe seulement s'il est fourni (modification)
      if (userData.password && userData.password.trim()) {
        payload.password = userData.password.trim();
      }

      const endpoint = `/boutique-user/update/${gerantId.trim()}/${boutiqueId.trim()}`;
      const response = await apiClient.post<unknown>(endpoint, payload);

      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // Vérifier si la réponse est une chaîne d'erreur
      if (typeof response.data === 'string') {
        const responseString: string = response.data;
        const lowerResponse = responseString.toLowerCase();
        if (lowerResponse.includes('erreur') || 
            lowerResponse.includes('error') ||
            lowerResponse.includes('échec') ||
            lowerResponse.includes('failed')) {
          throw new Error(responseString);
        }
      }

      // L'API peut retourner les données dans différentes structures
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as Record<string, unknown>;
        
        // Structure { success: true, message: "...", data: {...} }
        if (responseData.success === true) {
          return {
            success: true,
            message: (responseData.message as string) || "Franchisé modifié avec succès",
            data: responseData.data,
          };
        }
        
        // Structure { message: "...", user: {...} }
        if (responseData.message && responseData.user) {
          return {
            success: true,
            message: responseData.message as string,
            data: responseData.user,
          };
        }
        
        // Structure { message: "..." } (sans données supplémentaires)
        if (responseData.message) {
          return {
            success: true,
            message: responseData.message as string,
            data: responseData,
          };
        }
      }
      
      // Réponse par défaut si structure non reconnue mais pas d'erreur
      return {
        success: true,
        message: "Franchisé modifié avec succès",
        data: response.data,
      };
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: ApiValidationError & {
              message?: string;
              msg?: string;
              error?: string | Record<string, string | string[]>;
            };
          };
        };
        
        const status = axiosError.response?.status;
        const apiError = axiosError.response?.data;
        
        if (status === 404) {
          return {
            success: false,
            error: "Franchisé non trouvé ou accès non autorisé",
          };
        }
        
        if (status === 401 || status === 403) {
          return {
            success: false,
            error: "Accès non autorisé. Veuillez vous reconnecter.",
          };
        }
        
        if (status === 422 && apiError?.error && typeof apiError.error === 'object') {
          return {
            success: false,
            error: formatApiErrorMessage(apiError.error as Record<string, string | string[]>),
          };
        }
        
        const errorMessage =
          apiError?.message ||
          apiError?.msg ||
          (typeof apiError?.error === 'string' ? apiError.error : undefined) ||
          `Erreur ${status}: ${axiosError.response?.statusText}` ||
          "Erreur lors de la modification du franchisé";
        
        return { success: false, error: errorMessage };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de la modification du franchisé";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Supprimer un utilisateur de boutique (franchisé/gérant)
   * Endpoint: GET /boutique-user/delete/{gerant_id}/{boutique_id}
   * @param gerantId - UUID du gérant (franchisé)
   * @param boutiqueId - UUID de la boutique
   * @returns Promise avec le résultat de la suppression
   */
  async deleteBoutiqueUser(
    gerantId: string,
    boutiqueId: string
  ): Promise<CreateBoutiqueUserResponse> {
    try {
      // Validation des paramètres
      if (!gerantId || !gerantId.trim()) {
        throw new Error("L'ID du gérant est requis");
      }
      if (!boutiqueId || !boutiqueId.trim()) {
        throw new Error("L'ID de la boutique est requis");
      }

      const endpoint = `/boutique-user/delete/${gerantId.trim()}/${boutiqueId.trim()}`;
      const response = await apiClient.get<unknown>(endpoint);

      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // Vérifier si la réponse est une chaîne d'erreur
      if (typeof response.data === 'string') {
        const responseString: string = response.data;
        const lowerResponse = responseString.toLowerCase();
        if (lowerResponse.includes('erreur') || 
            lowerResponse.includes('error') ||
            lowerResponse.includes('échec') ||
            lowerResponse.includes('failed')) {
          throw new Error(responseString);
        }
      }

      // L'API peut retourner les données dans différentes structures
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as Record<string, unknown>;
        
        // Structure { success: true, message: "..." }
        if (responseData.success === true) {
          return {
            success: true,
            message: (responseData.message as string) || "Franchisé supprimé avec succès",
            data: responseData.data,
          };
        }
        
        // Structure { message: "..." }
        if (responseData.message) {
          return {
            success: true,
            message: responseData.message as string,
            data: responseData,
          };
        }
      }
      
      // Réponse par défaut si structure non reconnue mais pas d'erreur
      return {
        success: true,
        message: "Franchisé supprimé avec succès",
        data: response.data,
      };
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: ApiValidationError & {
              message?: string;
              msg?: string;
              error?: string | Record<string, string | string[]>;
            };
          };
        };
        
        const status = axiosError.response?.status;
        const apiError = axiosError.response?.data;
        
        if (status === 404) {
          return {
            success: false,
            error: "Franchisé non trouvé ou accès non autorisé",
          };
        }
        
        if (status === 401 || status === 403) {
          return {
            success: false,
            error: "Accès non autorisé. Veuillez vous reconnecter.",
          };
        }
        
        if (status === 422 && apiError?.error && typeof apiError.error === 'object') {
          return {
            success: false,
            error: formatApiErrorMessage(apiError.error as Record<string, string | string[]>),
          };
        }
        
        const errorMessage =
          apiError?.message ||
          apiError?.msg ||
          (typeof apiError?.error === 'string' ? apiError.error : undefined) ||
          `Erreur ${status}: ${axiosError.response?.statusText}` ||
          "Erreur lors de la suppression du franchisé";
        
        return { success: false, error: errorMessage };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de la suppression du franchisé";
      return { success: false, error: errorMessage };
    }
  },
};

export default boutiqueUserService;

