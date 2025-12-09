/**
 * Service de gestion des boutiques - Proxy Market Dashboard
 * 
 * Ce service gère toutes les opérations liées aux boutiques :
 * - Création d'une boutique
 * - Récupération de la liste des boutiques
 * - Modification d'une boutique
 * - Suppression d'une boutique
 */

import apiClient from "./axiosConfig";
import { formatApiErrorMessage, ApiValidationError } from "../../utils/apiErrorUtils";

/**
 * Interface pour les données de création de boutique
 */
export interface CreateFranchiseData {
  name: string;
  email: string;
  contact_1: string;
  contact_2?: string;
  adresse: string;
  latitude: number;
  longitude: number;
  commune_id: number;
  status: string; // "0" ou "1" (chaîne) - le backend le convertit en nombre
}

/**
 * Interface pour la réponse de création de boutique
 */
export interface CreateFranchiseResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * Interface pour une boutique
 */
export interface Boutique {
  id: string;
  name: string;
  email: string;
  contact_1: string;
  contact_2: string | null;
  logo: string | null;
  details: string | null;
  adresse: string;
  localisation: string; // Format WKB/PostGIS
  commune_id: number;
  created_by: string;
  updated_by: string | null;
  status: number; // 0 = inactif, 1 = actif
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface pour les données de modification de boutique
 */
export interface UpdateBoutiqueData {
  name: string;
  email: string;
  contact_1: string;
  contact_2?: string;
  adresse: string;
  latitude: number;
  longitude: number;
  commune_id: number;
  status: string; // "0" ou "1" (chaîne) - le backend le convertit en nombre
}

/**
 * Service de gestion des boutiques
 */
const franchiseService = {

  /**
   * Récupérer la liste des boutiques avec pagination
   * @param page - Numéro de page (par défaut: 1)
   * @returns Promise avec les données paginées
   */
  async getBoutiques(page: number = 1): Promise<{
    data: Boutique[];
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
    links: {
      first: string | null;
      last: string | null;
      prev: string | null;
      next: string | null;
    };
  }> {
    try {
      const url = `/boutiques?page=${page}`;
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
      const responseData = response.data as Record<string, unknown>;
      
      // Si la réponse est paginée avec structure { data: [...], links: {...}, meta: {...} }
      if (responseData.data && Array.isArray(responseData.data) && responseData.meta) {
        const meta = responseData.meta as {
          current_page: number;
          from: number;
          last_page: number;
          per_page: number;
          to: number;
          total: number;
        };
        const links = responseData.links as {
          first: string | null;
          last: string | null;
          prev: string | null;
          next: string | null;
        };
        
        return {
          data: responseData.data as Boutique[],
          meta,
          links,
        };
      }
      
      // Si la réponse contient un tableau de boutiques directement (pas de pagination)
      if (Array.isArray(responseData)) {
        // Convertir en format paginé avec une seule page
        return {
          data: responseData as Boutique[],
          meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            per_page: responseData.length,
            to: responseData.length,
            total: responseData.length,
          },
          links: {
            first: null,
            last: null,
            prev: null,
            next: null,
          },
        };
      }
      
      // Si la réponse contient un objet avec une propriété boutiques
      if (responseData.boutiques && Array.isArray(responseData.boutiques)) {
        const boutiques = responseData.boutiques as Boutique[];
        // Convertir en format paginé avec une seule page
        return {
          data: boutiques,
          meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            per_page: boutiques.length,
            to: boutiques.length,
            total: boutiques.length,
          },
          links: {
            first: null,
            last: null,
            prev: null,
            next: null,
          },
        };
      }
      
      // Si la structure n'est pas reconnue, retourner un tableau vide avec pagination
      return {
        data: [],
        meta: {
          current_page: 1,
          from: 0,
          last_page: 1,
          per_page: 0,
          to: 0,
          total: 0,
        },
        links: {
          first: null,
          last: null,
          prev: null,
          next: null,
        },
      };
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            statusText?: string; 
            data?: ApiValidationError & {
              msg?: string;
            };
          };
        };
        const status = axiosError.response?.status;
        
        if (status === 401) {
          throw new Error("Non autorisé. Veuillez vous reconnecter.");
        }
        
        if (status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        
        if (status === 404) {
          throw new Error("Endpoint non trouvé. Veuillez contacter l'administrateur.");
        }
        
        const rawErrorMessage = axiosError.response?.data?.message 
          || axiosError.response?.data?.error 
          || axiosError.response?.data?.msg
          || `Erreur ${status || 'inconnue'}: ${axiosError.response?.statusText || 'Une erreur est survenue'}`;
        const errorMessage = typeof rawErrorMessage === 'string' ? rawErrorMessage : "Erreur lors de la récupération des boutiques";
        throw new Error(errorMessage);
      }
      
      // Erreur réseau ou autre
      const networkErrorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de la récupération des boutiques";
      throw new Error(networkErrorMessage);
    }
  },

  /**
   * Récupérer les détails d'une boutique par son ID
   * @param boutiqueId - Identifiant de la boutique
   * @returns Promise<Boutique> - Détails de la boutique
   */
  async getBoutiqueById(boutiqueId: string): Promise<Boutique> {
    try {
      const response = await apiClient.get<unknown>(`/boutiques/${boutiqueId}`);
      
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // L'API peut retourner les données dans différentes structures
      const responseData = response.data as Record<string, unknown>;
      
      // Si la réponse contient un objet boutique directement
      if (responseData.boutique && typeof responseData.boutique === 'object') {
        return responseData.boutique as Boutique;
      }
      
      // Si la réponse contient un objet data avec la boutique
      if (responseData.data && typeof responseData.data === 'object') {
        return responseData.data as Boutique;
      }
      
      // Si la réponse est directement l'objet boutique
      if (responseData.id && typeof responseData.id === 'string') {
        return responseData as unknown as Boutique;
      }
      
      throw new Error("Structure de réponse API non reconnue");
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            statusText?: string; 
            data?: ApiValidationError & {
              msg?: string;
            };
          };
        };
        const status = axiosError.response?.status;
        
        if (status === 401) {
          throw new Error("Non autorisé. Veuillez vous reconnecter.");
        }
        
        if (status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        
        if (status === 404) {
          throw new Error("Boutique non trouvée.");
        }
        
        const rawErrorMsg = axiosError.response?.data?.message 
          || axiosError.response?.data?.error 
          || axiosError.response?.data?.msg
          || `Erreur ${status || 'inconnue'}: ${axiosError.response?.statusText || 'Une erreur est survenue'}`;
        const errorMessage = typeof rawErrorMsg === 'string' ? rawErrorMsg : "Erreur lors de la récupération des détails de la boutique";
        throw new Error(errorMessage);
      }
      
      // Erreur réseau ou autre
      const networkErrorMsg = error instanceof Error 
        ? error.message 
        : "Erreur lors de la récupération des détails de la boutique";
      throw new Error(networkErrorMsg);
    }
  },

  /**
   * Créer une nouvelle boutique
   * @param franchiseData - Données de la boutique à créer
   * @returns Promise<CreateFranchiseResponse> - Réponse de l'API
   */
  async createFranchise(franchiseData: CreateFranchiseData): Promise<CreateFranchiseResponse> {
    try {
      // Valider que latitude et longitude sont définis et valides
      if (franchiseData.latitude === null || franchiseData.latitude === undefined || isNaN(Number(franchiseData.latitude))) {
        throw new Error("La latitude est requise et doit être un nombre valide");
      }
      
      if (franchiseData.longitude === null || franchiseData.longitude === undefined || isNaN(Number(franchiseData.longitude))) {
        throw new Error("La longitude est requise et doit être un nombre valide");
      }
      
      // Convertir en nombres pour s'assurer qu'ils sont bien des nombres et non des strings
      const latitudeNum = parseFloat(String(franchiseData.latitude));
      const longitudeNum = parseFloat(String(franchiseData.longitude));
      
      // Vérifier à nouveau après conversion
      if (isNaN(latitudeNum) || isNaN(longitudeNum)) {
        throw new Error("Les coordonnées latitude et longitude doivent être des nombres valides");
      }
      
      // L'API attend latitude et longitude directement (le backend fait la conversion en format WKB/PostGIS)
      // Préparer les données exactement comme l'API les attend
      // Champs requis selon la réponse de l'API : name, email, contact_1, contact_2 (peut être vide), 
      // adresse, latitude, longitude, commune_id, status
      // NOTE: Pas de champ password - le backend ne l'attend pas pour la création de boutique
      const payload: Record<string, unknown> = {
        name: franchiseData.name.trim(),
        email: franchiseData.email.trim().toLowerCase(),
        contact_1: franchiseData.contact_1.trim(),
        contact_2: franchiseData.contact_2 && franchiseData.contact_2.trim() 
          ? franchiseData.contact_2.trim() 
          : "",
        adresse: franchiseData.adresse.trim(),
        latitude: latitudeNum,
        longitude: longitudeNum,
        commune_id: Number(franchiseData.commune_id),
        status: franchiseData.status,
      };

      // Vérification finale : s'assurer que latitude et longitude sont bien dans le payload
      // Note: On vérifie aussi si les valeurs sont 0 (qui est valide pour certaines coordonnées)
      if (
        payload.latitude === null || 
        payload.latitude === undefined || 
        payload.longitude === null || 
        payload.longitude === undefined ||
        typeof payload.latitude !== 'number' ||
        typeof payload.longitude !== 'number'
      ) {
        throw new Error(`Les coordonnées latitude et longitude sont requises mais manquantes dans le payload. Latitude: ${payload.latitude}, Longitude: ${payload.longitude}`);
      }

      // S'assurer que les valeurs ne sont pas NaN
      if (isNaN(payload.latitude as number) || isNaN(payload.longitude as number)) {
        throw new Error(`Les coordonnées latitude et longitude doivent être des nombres valides. Latitude: ${payload.latitude}, Longitude: ${payload.longitude}`);
      }

      const response = await apiClient.post<unknown>("/boutiques", payload);
      
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
      // Si retour === 0 ou cls === 'error', c'est une erreur
      if (responseData.error || (responseData.retour === 0) || (responseData.cls === 'error')) {
        const errorMessage = typeof responseData.error === 'string' 
          ? responseData.error 
          : typeof responseData.message === 'string' 
          ? responseData.message 
          : typeof responseData.msg === 'string'
          ? responseData.msg
          : "Erreur lors de la création de la boutique";
        throw new Error(errorMessage);
      }

      // Retourner une réponse de succès
      // L'API retourne : { msg, cls, retour, boutique }
      // Vérifier que retour === 1 et cls === 'success' pour confirmer le succès
      if (responseData.retour === 1 && responseData.cls === 'success') {
        return {
          success: true,
          message: typeof responseData.msg === 'string' 
            ? responseData.msg 
            : typeof responseData.message === 'string'
            ? responseData.message
            : "Boutique créée avec succès",
          data: responseData.boutique || responseData.data || responseData,
        };
      }

      // Si la structure de réponse n'est pas reconnue, considérer comme succès si pas d'erreur
      return {
        success: true,
        message: typeof responseData.msg === 'string' 
          ? responseData.msg 
          : typeof responseData.message === 'string'
          ? responseData.message
          : "Boutique créée avec succès",
        data: responseData.boutique || responseData.data || responseData,
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
            };
          };
        };
        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;
        
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
          // Essayer d'extraire un message d'erreur plus détaillé
          const errorMsg = apiError?.message || apiError?.error || apiError?.msg;
          if (errorMsg && typeof errorMsg === 'string') {
            return { success: false, error: `Erreur serveur : ${errorMsg}` };
          }
          // Si l'erreur contient des détails sur les erreurs de validation
          if (apiError && typeof apiError === 'object' && 'errors' in apiError) {
            const errorMessage = formatApiErrorMessage(
              apiError as ApiValidationError,
              "Erreur serveur : Veuillez vérifier les données envoyées"
            );
            return { success: false, error: errorMessage };
          }
          return { success: false, error: "Erreur serveur : Veuillez vérifier les données envoyées (format localisation, champs requis, etc.) et réessayer" };
        }
        
        // Message d'erreur générique
        const rawErrorMessage = 
          apiError?.message || 
          apiError?.error || 
          apiError?.msg ||
          (status ? `Erreur ${status}: ${axiosError.response?.statusText}` : "Erreur lors de la création de la boutique");
        const errorMessage = typeof rawErrorMessage === 'string' ? rawErrorMessage : "Erreur lors de la création de la boutique";
        return { success: false, error: errorMessage };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de la création de la boutique";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Modifier une boutique existante
   * @param boutiqueId - Identifiant de la boutique à modifier
   * @param boutiqueData - Données de la boutique à mettre à jour
   * @returns Promise<CreateFranchiseResponse> - Réponse de l'API
   */
  async updateBoutique(boutiqueId: string, boutiqueData: UpdateBoutiqueData): Promise<CreateFranchiseResponse> {
    try {
      // Valider que latitude et longitude sont définis et valides
      if (boutiqueData.latitude === null || boutiqueData.latitude === undefined || isNaN(Number(boutiqueData.latitude))) {
        throw new Error("La latitude est requise et doit être un nombre valide");
      }
      
      if (boutiqueData.longitude === null || boutiqueData.longitude === undefined || isNaN(Number(boutiqueData.longitude))) {
        throw new Error("La longitude est requise et doit être un nombre valide");
      }
      
      // Convertir en nombres pour s'assurer qu'ils sont bien des nombres et non des strings
      const latitudeNum = parseFloat(String(boutiqueData.latitude));
      const longitudeNum = parseFloat(String(boutiqueData.longitude));
      
      // Vérifier à nouveau après conversion
      if (isNaN(latitudeNum) || isNaN(longitudeNum)) {
        throw new Error("Les coordonnées latitude et longitude doivent être des nombres valides");
      }
      
      // Préparer les données exactement comme l'API les attend
      const payload: Record<string, unknown> = {
        name: boutiqueData.name.trim(),
        email: boutiqueData.email.trim().toLowerCase(),
        contact_1: boutiqueData.contact_1.trim(),
        contact_2: boutiqueData.contact_2 && boutiqueData.contact_2.trim() 
          ? boutiqueData.contact_2.trim() 
          : "",
        adresse: boutiqueData.adresse.trim(),
        latitude: latitudeNum,
        longitude: longitudeNum,
        commune_id: Number(boutiqueData.commune_id),
        status: boutiqueData.status,
      };

      // Vérification finale : s'assurer que latitude et longitude sont bien dans le payload
      if (
        payload.latitude === null || 
        payload.latitude === undefined || 
        payload.longitude === null || 
        payload.longitude === undefined ||
        typeof payload.latitude !== 'number' ||
        typeof payload.longitude !== 'number'
      ) {
        throw new Error(`Les coordonnées latitude et longitude sont requises mais manquantes dans le payload. Latitude: ${payload.latitude}, Longitude: ${payload.longitude}`);
      }

      // S'assurer que les valeurs ne sont pas NaN
      if (isNaN(payload.latitude as number) || isNaN(payload.longitude as number)) {
        throw new Error(`Les coordonnées latitude et longitude doivent être des nombres valides. Latitude: ${payload.latitude}, Longitude: ${payload.longitude}`);
      }

      const response = await apiClient.put<unknown>(`/boutiques/${boutiqueId}`, payload);
      
      // Vérifier le statut HTTP pour confirmer la modification réussie
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La modification a échoué avec le statut HTTP ${response.status}`);
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
          : "Erreur lors de la modification de la boutique";
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
            : "Boutique modifiée avec succès",
          data: responseData.boutique || responseData.data || responseData,
        };
      }

      // Si la structure de réponse n'est pas reconnue, considérer comme succès si pas d'erreur
      return {
        success: true,
        message: typeof responseData.msg === 'string' 
          ? responseData.msg 
          : typeof responseData.message === 'string'
          ? responseData.message
          : "Boutique modifiée avec succès",
        data: responseData.boutique || responseData.data || responseData,
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
            };
          };
        };
        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;
        
        // Erreur 422 : Validation échouée
        if (status === 422 && apiError) {
          const errorMessage = formatApiErrorMessage(
            apiError as ApiValidationError,
            "Erreur de validation : Veuillez vérifier tous les champs requis"
          );
          throw new Error(errorMessage);
        }
        
        // Erreur 404 : Boutique non trouvée
        if (status === 404) {
          throw new Error("Boutique non trouvée.");
        }
        
        // Erreur 401 : Non autorisé
        if (status === 401) {
          throw new Error("Non autorisé. Veuillez vous reconnecter.");
        }
        
        // Erreur 403 : Accès refusé
        if (status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        
        // Erreur 500 : Erreur serveur
        if (status === 500) {
          const errorMsg = apiError?.message || apiError?.error || apiError?.msg;
          if (errorMsg && typeof errorMsg === 'string') {
            throw new Error(`Erreur serveur : ${errorMsg}`);
          }
          if (apiError && typeof apiError === 'object' && 'errors' in apiError) {
            const errorMessage = formatApiErrorMessage(
              apiError as ApiValidationError,
              "Erreur serveur : Veuillez vérifier les données envoyées"
            );
            throw new Error(errorMessage);
          }
          throw new Error("Erreur serveur : Veuillez vérifier les données envoyées et réessayer");
        }
        
        // Message d'erreur générique
        const rawErrorMessage = 
          apiError?.message || 
          apiError?.error || 
          apiError?.msg ||
          (status ? `Erreur ${status}: ${axiosError.response?.statusText}` : "Erreur lors de la modification de la boutique");
        const errorMessage = typeof rawErrorMessage === 'string' ? rawErrorMessage : "Erreur lors de la modification de la boutique";
        throw new Error(errorMessage);
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de la modification de la boutique";
      throw new Error(errorMessage);
    }
  },

  /**
   * Supprimer une boutique
   * @param boutiqueId - Identifiant de la boutique à supprimer
   * @returns Promise<void>
   */
  async deleteBoutique(boutiqueId: string): Promise<void> {
    if (!boutiqueId) {
      throw new Error("Identifiant boutique manquant");
    }

    try {
      const response = await apiClient.delete(`/boutiques/${boutiqueId}`);
      
      // Vérifier le statut HTTP pour confirmer la suppression réussie
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La suppression a échoué avec le statut HTTP ${response.status}`);
      }
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: {
              message?: string;
              error?: string;
              msg?: string;
            } | string;
          };
        };

        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;

        // Erreur 404 : Boutique non trouvée
        if (status === 404) {
          throw new Error("Boutique non trouvée");
        }

        // Erreur 401 : Non autorisé
        if (status === 401) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }

        // Erreur 403 : Accès refusé
        if (status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }

        // Gérer les différents formats de messages d'erreur
        let errorMessage = "Erreur lors de la suppression de la boutique";
        
        if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError && typeof apiError === 'object') {
          errorMessage = apiError.message || apiError.error || apiError.msg || errorMessage;
        }

        if (status) {
          errorMessage = `${errorMessage} (${status})`;
        }

        throw new Error(errorMessage);
      } else if (error && typeof error === "object" && "request" in error) {
        // Erreur réseau (pas de réponse du serveur)
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
      } else {
        // Autres erreurs (déjà formatées)
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression de la boutique";
        throw new Error(errorMessage);
      }
    }
  },
};

export default franchiseService;

