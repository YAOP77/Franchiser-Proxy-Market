/**
 * Service de gestion des administrateurs - Proxy Market Dashboard
 * 
 * Ce service gère toutes les opérations liées aux administrateurs :
 * - Création d'un administrateur
 * - Liste des communes (pour le formulaire)
 */

import apiClient from "./axiosConfig";
import { formatApiErrorMessage } from "../../utils/apiErrorUtils";

/**
 * Interface pour les données de création d'administrateur
 */
export interface CreateAdminData {
  nom: string;
  prenoms: string;
  email: string;
  password: string;
  contact_1: string;
  contact_2?: string;
  role: "admin" | "caissier" | "commercial";
  commune_id: number;
  adresse: string;
  status: string;
}

/**
 * Interface pour les données de modification d'administrateur
 * Le mot de passe est optionnel (non modifié si non fourni)
 */
export interface UpdateAdminData {
  nom: string;
  prenoms: string;
  email: string;
  password?: string;
  contact_1: string;
  contact_2?: string;
  role: "admin" | "caissier" | "commercial";
  commune_id: number;
  adresse: string;
  status: string;
}

/**
 * Interface pour la modification du profil administrateur connecté
 */
export interface ModifyProfileData {
  nom: string;
  prenoms: string;
  email: string;
  contact_1: string;
  contact_2?: string;
  commune_id?: string | number;
  adresse?: string;
  role?: string;
  status?: string;
}

/**
 * Interface pour une commune
 */
export interface Commune {
  id: number;
  libelle: string;
}

/**
 * Interface pour la réponse de création d'administrateur
 */
export interface CreateAdminResponse {
  success: boolean;
  message?: string;
  data?: Admin | unknown;
}

/**
 * Interface pour la réponse de modification d'administrateur
 */
export interface UpdateAdminResponse {
  success: boolean;
  message?: string;
  data?: Admin | unknown;
}

/**
 * Interface pour le payload envoyé à l'API lors de la création
 */
interface AdminPayload {
  nom: string;
  prenoms: string;
  email: string;
  password: string;
  contact_1: string;
  role: "admin" | "caissier" | "commercial";
  commune_id: number;
  adresse: string;
  status: string;
  contact_2?: string;
}

/**
 * Interface pour un administrateur (liste)
 * Adaptée à la structure réelle de l'API
 */
export interface Admin {
  id: string; // UUID string
  nom: string;
  prenoms: string;
  email: string;
  contact_1?: string | null;
  contact_2?: string | null;
  role: "admin" | "caissier" | "commercial" | "super_admin";
  commune_id?: string | number; // Peut être string (nom de la commune) ou number (ID)
  adresse?: string | null;
  status: number; // 1 pour actif, 0 pour inactif
  status_text?: string; // "Actif" ou "Inactif"
  image?: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminResponseWithCommune extends Admin {
  commune?: string;
}

/**
 * Interface pour la réponse paginée de l'API
 */
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

/**
 * Service de gestion des administrateurs
 */
export const adminService = {
  /**
   * Créer un nouvel administrateur
   * @param adminData - Données de l'administrateur à créer
   * @returns Promise<CreateAdminResponse> - Réponse de l'API
   */
  async createAdmin(adminData: CreateAdminData): Promise<CreateAdminResponse> {
    try {
      // S'assurer que les données sont formatées exactement comme l'API les attend
      // Ne pas envoyer contact_2 s'il est undefined ou vide
      const payload: AdminPayload = {
        nom: adminData.nom,
        prenoms: adminData.prenoms,
        email: adminData.email,
        password: adminData.password,
        contact_1: adminData.contact_1,
        role: adminData.role,
        commune_id: adminData.commune_id,
        adresse: adminData.adresse,
        status: adminData.status,
      };

      // Ajouter contact_2 seulement s'il existe et n'est pas vide
      if (adminData.contact_2 && adminData.contact_2.trim()) {
        payload.contact_2 = adminData.contact_2.trim();
      }

      // L'API peut retourner différentes structures de réponse, utiliser unknown pour la flexibilité
      const response = await apiClient.post<unknown>("/admins", payload);
      
      // Vérifier le statut HTTP pour confirmer la création réussie
      // Statut attendu : 201 (Created) ou 200 (OK)
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La création a échoué avec le statut HTTP ${response.status}`);
      }
      
      // L'API peut retourner différentes structures de réponse
      // Vérifier d'abord si c'est une erreur explicite
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as Record<string, unknown>;
        
        // Cas 1 : Réponse avec un champ d'erreur explicite
        if (responseData.error || responseData.erreur) {
          const errorMsg = typeof responseData.error === 'string' ? responseData.error :
                          typeof responseData.erreur === 'string' ? responseData.erreur :
                          typeof responseData.message === 'string' ? responseData.message :
                          "La création a échoué";
          throw new Error(errorMsg);
        }
        
        // Cas 2 : Réponse avec success explicite
        if (responseData.success !== undefined) {
          if (responseData.success === false) {
            const errorMsg = typeof responseData.message === 'string' ? responseData.message :
                            typeof responseData.msg === 'string' ? responseData.msg :
                            "La création de l'administrateur a échoué";
            throw new Error(errorMsg);
          }
          // Si success est true, retourner la réponse formatée
          return {
            success: true,
            message: typeof responseData.message === 'string' ? responseData.message : undefined,
            data: responseData.data as Admin | undefined,
          };
        }
        
        // Cas 3 : Réponse avec un message et retour (structure Laravel/PHP typique)
        if (responseData.retour !== undefined) {
          const retour = responseData.retour;
          if (retour === 0 || retour === false) {
            const errorMsg = typeof responseData.msg === 'string' ? responseData.msg :
                            typeof responseData.message === 'string' ? responseData.message :
                            "La création a échoué";
            throw new Error(errorMsg);
          }
          // retour === 1 signifie succès
          return {
            success: true,
            message: typeof responseData.msg === 'string' ? responseData.msg :
                    typeof responseData.message === 'string' ? responseData.message :
                    "Administrateur créé avec succès",
            data: (responseData.admin || responseData.data || responseData) as Admin | undefined,
          };
        }
        
        // Cas 4 : Réponse avec données directes (objet admin créé)
        if (responseData.id || responseData.email) {
          return {
            success: true,
            data: responseData as unknown as Admin,
            message: typeof responseData.message === 'string' ? responseData.message :
                    typeof responseData.msg === 'string' ? responseData.msg :
                    "Administrateur créé avec succès",
          };
        }
        
        // Cas 5 : Réponse avec message de succès
        if (responseData.message || responseData.msg) {
          const message = typeof responseData.message === 'string' ? responseData.message :
                         typeof responseData.msg === 'string' ? responseData.msg : '';
          // Si le message contient des mots-clés de succès
          const successKeywords = ['succès', 'créé', 'success', 'created', 'ajouté'];
          const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
          
          if (isSuccess) {
            return {
              success: true,
              message: message,
              data: (responseData.admin || responseData.data || responseData) as Admin | undefined,
            };
          }
        }
      }
      
      // Si le statut HTTP est 201 ou 200, considérer comme succès même si la structure est inattendue
      if (response.status === 201 || response.status === 200) {
        return {
          success: true,
          message: "Administrateur créé avec succès",
          data: response.data as Admin | undefined,
        };
      }
      
      // Si aucune condition n'est remplie, considérer comme une erreur
      throw new Error("Réponse inattendue de l'API lors de la création");
    } catch (error: unknown) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            statusText?: string; 
            data?: {
              message?: string;
              error?: string;
              errors?: {
                email?: string[];
                password?: string[];
                nom?: string[];
                prenoms?: string[];
                contact_1?: string[];
                role?: string[];
                commune_id?: string[];
                adresse?: string[];
                status?: string[];
              };
            };
          };
        };
        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;
        
        // Erreur 422 : Validation échouée - extraire tous les messages d'erreur
        if (status === 422 && apiError) {
          // formatApiErrorMessage attend un objet avec une structure spécifique
          const errorMessage = formatApiErrorMessage(
            apiError as any,
            "Erreur de validation : Veuillez vérifier tous les champs requis"
          );
          throw new Error(errorMessage);
        }
        
        // Message d'erreur générique
        const errorMessage = 
          apiError?.message || 
          apiError?.error || 
          apiError?.errors?.email?.[0] ||
          apiError?.errors?.password?.[0] ||
          apiError?.errors?.nom?.[0] ||
          apiError?.errors?.prenoms?.[0] ||
          apiError?.errors?.contact_1?.[0] ||
          apiError?.errors?.role?.[0] ||
          apiError?.errors?.commune_id?.[0] ||
          apiError?.errors?.adresse?.[0] ||
          apiError?.errors?.status?.[0] ||
          `Erreur ${status}: ${axiosError.response?.statusText}` ||
          "Erreur lors de la création de l'administrateur";
        throw new Error(errorMessage);
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
      } else {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la création de l'administrateur";
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Modifier un administrateur existant
   * @param adminId - ID de l'administrateur à modifier (UUID)
   * @param adminData - Données de l'administrateur à modifier
   * @returns Promise<UpdateAdminResponse> - Réponse de l'API
   */
  async updateAdmin(adminId: string, adminData: UpdateAdminData): Promise<UpdateAdminResponse> {
    try {
      // S'assurer que les données sont formatées exactement comme l'API les attend
      // Ne pas envoyer contact_2 s'il est undefined ou vide
      // Ne pas envoyer password s'il n'est pas fourni (optionnel pour la modification)
      interface UpdateAdminPayload {
        nom: string;
        prenoms: string;
        email: string;
        contact_1: string;
        role: "admin" | "caissier" | "commercial";
        commune_id: number;
        adresse: string;
        status: string;
        password?: string;
        contact_2?: string;
      }

      const payload: UpdateAdminPayload = {
        nom: adminData.nom,
        prenoms: adminData.prenoms,
        email: adminData.email,
        contact_1: adminData.contact_1,
        role: adminData.role,
        commune_id: adminData.commune_id,
        adresse: adminData.adresse,
        status: adminData.status,
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (adminData.password && adminData.password.trim()) {
        payload.password = adminData.password;
      }

      // Ajouter contact_2 seulement s'il existe et n'est pas vide
      if (adminData.contact_2 && adminData.contact_2.trim()) {
        payload.contact_2 = adminData.contact_2.trim();
      }

      // L'API peut retourner différentes structures de réponse, utiliser unknown pour la flexibilité
      const response = await apiClient.put<unknown>(`/admins/${adminId}`, payload);
      
      // Vérifier le statut HTTP pour confirmer la modification réussie
      // Statut attendu : 200 (OK) ou 201 (Created)
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La modification a échoué avec le statut HTTP ${response.status}`);
      }
      
      // L'API peut retourner différentes structures de réponse
      // Vérifier d'abord si c'est une erreur explicite
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as Record<string, unknown>;
        
        // Cas 1 : Réponse avec un champ d'erreur explicite
        if (responseData.error || responseData.erreur) {
          const errorMsg = typeof responseData.error === 'string' ? responseData.error :
                          typeof responseData.erreur === 'string' ? responseData.erreur :
                          typeof responseData.message === 'string' ? responseData.message :
                          "La modification a échoué";
          throw new Error(errorMsg);
        }
        
        // Cas 2 : Réponse avec success explicite
        if (responseData.success !== undefined) {
          if (responseData.success === false) {
            const errorMsg = typeof responseData.message === 'string' ? responseData.message :
                            typeof responseData.msg === 'string' ? responseData.msg :
                            "La modification de l'administrateur a échoué";
            throw new Error(errorMsg);
          }
          // Si success est true, retourner la réponse formatée
          return {
            success: true,
            message: typeof responseData.message === 'string' ? responseData.message : undefined,
            data: responseData.data as Admin | undefined,
          };
        }
        
        // Cas 3 : Réponse avec un message et retour (structure Laravel/PHP typique)
        if (responseData.retour !== undefined) {
          const retour = responseData.retour;
          if (retour === 0 || retour === false) {
            const errorMsg = typeof responseData.msg === 'string' ? responseData.msg :
                            typeof responseData.message === 'string' ? responseData.message :
                            "La modification a échoué";
            throw new Error(errorMsg);
          }
          // retour === 1 signifie succès
          return {
            success: true,
            message: typeof responseData.msg === 'string' ? responseData.msg :
                    typeof responseData.message === 'string' ? responseData.message :
                    "Administrateur modifié avec succès",
            data: (responseData.admin || responseData.data || responseData) as Admin | undefined,
          };
        }
        
        // Cas 4 : Réponse avec données directes (objet admin modifié)
        if (responseData.id || responseData.email) {
          return {
            success: true,
            data: responseData as unknown as Admin,
            message: typeof responseData.message === 'string' ? responseData.message :
                    typeof responseData.msg === 'string' ? responseData.msg :
                    "Administrateur modifié avec succès",
          };
        }
        
        // Cas 5 : Réponse avec message de succès
        if (responseData.message || responseData.msg) {
          const message = typeof responseData.message === 'string' ? responseData.message :
                         typeof responseData.msg === 'string' ? responseData.msg : '';
          // Si le message contient des mots-clés de succès
          const successKeywords = ['succès', 'modifié', 'updated', 'success', 'mis à jour'];
          const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
          
          if (isSuccess) {
            return {
              success: true,
              message: message,
              data: (responseData.admin || responseData.data || responseData) as Admin | undefined,
            };
          }
        }
      }
      
      // Si le statut HTTP est 200 ou 201, considérer comme succès même si la structure est inattendue
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          message: "Administrateur modifié avec succès",
          data: response.data as Admin | undefined,
        };
      }
      
      // Si aucune condition n'est remplie, considérer comme une erreur
      throw new Error("Réponse inattendue de l'API lors de la modification");
    } catch (error: unknown) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            statusText?: string; 
            data?: {
              message?: string;
              error?: string;
              errors?: {
                email?: string[];
                password?: string[];
                nom?: string[];
                prenoms?: string[];
                contact_1?: string[];
                role?: string[];
                commune_id?: string[];
                adresse?: string[];
                status?: string[];
              };
            };
          };
        };
        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;
        
        // Erreur 422 : Validation échouée - extraire tous les messages d'erreur
        if (status === 422 && apiError) {
          // formatApiErrorMessage attend un objet avec une structure spécifique
          const errorMessage = formatApiErrorMessage(
            apiError as Record<string, unknown>,
            "Erreur de validation : Veuillez vérifier tous les champs requis"
          );
          throw new Error(errorMessage);
        }
        
        // Message d'erreur générique
        const errorMessage = 
          apiError?.message || 
          apiError?.error || 
          apiError?.errors?.email?.[0] ||
          apiError?.errors?.password?.[0] ||
          apiError?.errors?.nom?.[0] ||
          apiError?.errors?.prenoms?.[0] ||
          apiError?.errors?.contact_1?.[0] ||
          apiError?.errors?.role?.[0] ||
          apiError?.errors?.commune_id?.[0] ||
          apiError?.errors?.adresse?.[0] ||
          apiError?.errors?.status?.[0] ||
          `Erreur ${status}: ${axiosError.response?.statusText}` ||
          "Erreur lors de la modification de l'administrateur";
        throw new Error(errorMessage);
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
      } else {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la modification de l'administrateur";
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Récupérer le profil de l'utilisateur connecté
   * @param adminId - ID de l'administrateur connecté (UUID)
   * @returns Promise<Admin> - Détails de l'administrateur
   */
  async getCurrentProfile(adminId: string): Promise<Admin> {
    try {
      if (!adminId) {
        throw new Error("Identifiant administrateur manquant pour la récupération du profil");
      }

      const response = await apiClient.get<{ 
        data?: Admin; 
        result?: Admin; 
        admin?: Admin; 
        [key: string]: unknown 
      }>(`/admins/${adminId}`);
      
      // Cas 1 : Réponse avec data
      if (response.data.data && typeof response.data.data === 'object') {
        return response.data.data as Admin;
      }
      
      // Cas 2 : Réponse avec result
      if (response.data.result && typeof response.data.result === 'object') {
        return response.data.result as Admin;
      }
      
      // Cas 3 : Réponse avec admin
      if (response.data.admin && typeof response.data.admin === 'object') {
        return response.data.admin as Admin;
      }
      
      // Cas 4 : Réponse directe (l'objet admin est à la racine)
      if (response.data.id) {
        return response.data as unknown as Admin;
      }
      
      throw new Error("Impossible de récupérer les informations du profil");
    } catch (error: unknown) {
      // Gestion des erreurs API
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {
          response?: {
            status?: number;
            data?: {
              message?: string;
              error?: string;
            };
          };
          message?: string;
        };
        
        const errorMessage =
          apiError?.response?.data?.message ||
          apiError?.response?.data?.error ||
          apiError?.message ||
          "Erreur lors de la récupération du profil";
        
        throw new Error(errorMessage);
      }
      
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la récupération du profil";
      throw new Error(errorMessage);
    }
  },

  /**
   * Récupérer le profil de l'utilisateur connecté (sans passer l'ID)
   * L'API identifie automatiquement l'utilisateur connecté via le token d'authentification
   * @returns Promise<Admin> - Détails de l'administrateur/franchisé connecté
   */
  async getMyProfile(): Promise<Admin> {
    try {
      // Essayer d'abord l'endpoint GET /mon-profil (si disponible)
      try {
        const response = await apiClient.get<{ 
          data?: Admin; 
          result?: Admin; 
          admin?: Admin;
          user?: Admin;
          [key: string]: unknown 
        }>("/mon-profil");
        
        // Cas 1 : Réponse avec data
        if (response.data.data && typeof response.data.data === 'object') {
          return response.data.data as Admin;
        }
        
        // Cas 2 : Réponse avec result
        if (response.data.result && typeof response.data.result === 'object') {
          return response.data.result as Admin;
        }
        
        // Cas 3 : Réponse avec admin
        if (response.data.admin && typeof response.data.admin === 'object') {
          return response.data.admin as Admin;
        }
        
        // Cas 4 : Réponse avec user
        if (response.data.user && typeof response.data.user === 'object') {
          return response.data.user as Admin;
        }
        
        // Cas 5 : Réponse directe (l'objet admin est à la racine)
        if (response.data.id) {
          return response.data as unknown as Admin;
        }
      } catch (endpointError) {
        // Si /mon-profil n'existe pas, on continue avec la méthode alternative
        // Ne pas propager l'erreur ici, on va essayer une autre approche
      }

      // Fallback : Si /mon-profil n'existe pas, on ne peut pas récupérer le profil sans ID
      // Cette méthode nécessite l'ID de l'utilisateur
      throw new Error("Endpoint /mon-profil non disponible. Veuillez utiliser getCurrentProfile avec l'ID utilisateur.");
    } catch (error: unknown) {
      // Gestion des erreurs API
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {
          response?: {
            status?: number;
            data?: {
              message?: string;
              error?: string;
            };
          };
          message?: string;
        };
        
        const errorMessage =
          apiError?.response?.data?.message ||
          apiError?.response?.data?.error ||
          apiError?.message ||
          "Erreur lors de la récupération du profil";
        
        throw new Error(errorMessage);
      }
      
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la récupération du profil";
      throw new Error(errorMessage);
    }
  },

  /**
   * Modifier le profil de l'administrateur connecté (franchisé)
   * L'API identifie automatiquement l'utilisateur connecté via le token d'authentification
   * @param profileData - Données du profil à mettre à jour
   * @returns Promise<UpdateAdminResponse> - Réponse de l'API
   */
  async modifyProfile(profileData: ModifyProfileData): Promise<UpdateAdminResponse> {
    try {
      const payload: Record<string, string | number> = {
        nom: profileData.nom,
        prenoms: profileData.prenoms,
        email: profileData.email,
        contact_1: profileData.contact_1,
      };

      if (profileData.contact_2 && profileData.contact_2.trim()) {
        payload.contact_2 = profileData.contact_2.trim();
      }

      if (profileData.commune_id !== undefined && profileData.commune_id !== null && profileData.commune_id !== "") {
        payload.commune_id = profileData.commune_id;
      }

      if (profileData.adresse && profileData.adresse.trim().length > 0) {
        payload.adresse = profileData.adresse.trim();
      }

      if (profileData.role) {
        payload.role = profileData.role;
      }

      if (profileData.status) {
        payload.status = profileData.status;
      }

      const response = await apiClient.post<unknown>("/modifier-mon-profil", payload);

      const isSuccessStatus = response.status >= 200 && response.status < 300;

      if (!isSuccessStatus) {
        throw new Error(`La modification du profil a échoué avec le statut HTTP ${response.status}`);
      }

      if (response.data && typeof response.data === "object") {
        const responseData = response.data as Record<string, unknown>;

        if (responseData.error || responseData.erreur) {
          const errorMsg = typeof responseData.error === "string"
            ? responseData.error
            : typeof responseData.erreur === "string"
            ? responseData.erreur
            : typeof responseData.message === "string"
            ? responseData.message
            : "La modification du profil a échoué";
          throw new Error(errorMsg);
        }

        if (responseData.success !== undefined) {
          if (responseData.success === false) {
            const errorMsg = typeof responseData.message === "string"
              ? responseData.message
              : typeof responseData.msg === "string"
              ? responseData.msg
              : "La modification du profil a échoué";
            throw new Error(errorMsg);
          }
          return {
            success: true,
            message: typeof responseData.message === "string" ? responseData.message : undefined,
            data: responseData.data as Admin | undefined,
          };
        }

        if (responseData.retour !== undefined) {
          const retour = responseData.retour;
          if (retour === 0 || retour === false) {
            const errorMsg = typeof responseData.msg === "string"
              ? responseData.msg
              : typeof responseData.message === "string"
              ? responseData.message
              : "La modification du profil a échoué";
            throw new Error(errorMsg);
          }
          return {
            success: true,
            message: typeof responseData.msg === "string"
              ? responseData.msg
              : typeof responseData.message === "string"
              ? responseData.message
              : "Profil modifié avec succès",
            data: (responseData.admin || responseData.data || responseData) as Admin | undefined,
          };
        }

        if (responseData.id || responseData.email) {
          return {
            success: true,
            data: responseData as unknown as Admin,
            message: typeof responseData.message === "string"
              ? responseData.message
              : typeof responseData.msg === "string"
              ? responseData.msg
              : "Profil modifié avec succès",
          };
        }

        if (responseData.message || responseData.msg) {
          const message = typeof responseData.message === "string"
            ? responseData.message
            : typeof responseData.msg === "string"
            ? responseData.msg
            : "";
          const successKeywords = ["succès", "modifié", "success", "updated", "profil"];
          const isSuccess = successKeywords.some((keyword) => message.toLowerCase().includes(keyword));

          if (isSuccess) {
            return {
              success: true,
              message,
              data: (responseData.admin || responseData.data || responseData) as Admin | undefined,
            };
          }
        }
      }

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: "Profil modifié avec succès",
          data: response.data as Admin | undefined,
        };
      }

      throw new Error("Réponse inattendue de l'API lors de la modification du profil");
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: {
              message?: string;
              error?: string;
              errors?: {
                email?: string[];
                prenoms?: string[];
                nom?: string[];
                contact_1?: string[];
                contact_2?: string[];
                commune_id?: string[];
                adresse?: string[];
                status?: string[];
                role?: string[];
              };
            };
          };
        };

        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;

        if (status === 422 && apiError) {
          const errorMessage = formatApiErrorMessage(
            apiError as Record<string, unknown>,
            "Erreur de validation : Veuillez vérifier tous les champs requis"
          );
          throw new Error(errorMessage);
        }

        const errorMessage =
          apiError?.message ||
          apiError?.error ||
          apiError?.errors?.email?.[0] ||
          apiError?.errors?.prenoms?.[0] ||
          apiError?.errors?.nom?.[0] ||
          apiError?.errors?.contact_1?.[0] ||
          apiError?.errors?.contact_2?.[0] ||
          apiError?.errors?.commune_id?.[0] ||
          apiError?.errors?.adresse?.[0] ||
          apiError?.errors?.status?.[0] ||
          apiError?.errors?.role?.[0] ||
          `Erreur ${status}: ${axiosError.response?.statusText}` ||
          "Erreur lors de la modification du profil";
        throw new Error(errorMessage);
      } else if (error && typeof error === "object" && "request" in error) {
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
      } else {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la modification du profil";
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Récupérer un administrateur par son identifiant
   * @param adminId - ID de l'administrateur (UUID)
   * @returns Promise<Admin> - Données de l'administrateur
   */
  async getAdminById(adminId: string): Promise<Admin> {
    if (!adminId) {
      throw new Error("Identifiant administrateur manquant");
    }

    try {
      const response = await apiClient.get<Admin | AdminResponseWithCommune | { data?: AdminResponseWithCommune }>(`/admins/${adminId}`);

      let resolvedAdmin: AdminResponseWithCommune | undefined;

      if (response.data) {
        if ("data" in response.data && response.data.data) {
          resolvedAdmin = response.data.data;
        } else if (typeof response.data === "object" && !Array.isArray(response.data)) {
          resolvedAdmin = response.data as AdminResponseWithCommune;
        }
      }

      if (!resolvedAdmin) {
        throw new Error("Réponse inattendue de l'API lors de la récupération de l'administrateur");
      }

      if (
        resolvedAdmin.commune &&
        typeof resolvedAdmin.commune === "string" &&
        (!resolvedAdmin.commune_id || typeof resolvedAdmin.commune_id === "number")
      ) {
        return {
          ...resolvedAdmin,
          commune_id: resolvedAdmin.commune,
        };
      }

      if (
        resolvedAdmin.commune_id !== undefined &&
        resolvedAdmin.commune_id !== null &&
        typeof resolvedAdmin.commune_id === "number"
      ) {
        try {
          const communes = await adminService.getCommunes();
          const match = communes.find((commune) => commune.id === resolvedAdmin.commune_id);
          if (match) {
            return {
              ...resolvedAdmin,
              commune_id: match.libelle,
            };
          }
        } catch (error) {
          // Ignorer et retourner la valeur brute si la récupération des communes échoue
        }
      }

      return resolvedAdmin;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
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

        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;

        const errorMessage =
          apiError?.message ||
          apiError?.error ||
          `Erreur ${status}: ${axiosError.response?.statusText}` ||
          "Erreur lors de la récupération de l'administrateur";
        throw new Error(errorMessage);
      } else if (error && typeof error === "object" && "request" in error) {
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
      } else {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la récupération de l'administrateur";
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Récupérer la liste des communes
   * Endpoint: GET /get-communes
   * @returns Promise<Commune[]> - Liste des communes
   * @throws Error si la requête échoue avec une erreur critique (401, 403, etc.)
   */
  async getCommunes(): Promise<Commune[]> {
    try {
      const response = await apiClient.get<Commune[] | { data: Commune[] } | { communes: Commune[] }>("/get-communes");
      
      // Vérifier que la réponse contient des données
      if (!response.data) {
        if (import.meta.env.DEV) {
          console.warn("getCommunes: Réponse vide de l'API");
        }
        return [];
      }
      
      // Cas 1 : L'API retourne directement un tableau d'objets avec id et libelle
      if (Array.isArray(response.data)) {
        // Valider la structure des communes
        const validCommunes = response.data.filter(
          (commune): commune is Commune =>
            commune &&
            typeof commune === "object" &&
            typeof commune.id === "number" &&
            typeof commune.libelle === "string"
        );
        
        if (import.meta.env.DEV && validCommunes.length !== response.data.length) {
          console.warn("getCommunes: Certaines communes ont une structure invalide");
        }
        
        return validCommunes;
      }
      
      // Cas 2 : L'API retourne les données dans un wrapper { data: [...] }
      if (typeof response.data === "object" && "data" in response.data && Array.isArray(response.data.data)) {
        const validCommunes = response.data.data.filter(
          (commune): commune is Commune =>
            commune &&
            typeof commune === "object" &&
            typeof commune.id === "number" &&
            typeof commune.libelle === "string"
        );
        
        if (import.meta.env.DEV && validCommunes.length !== response.data.data.length) {
          console.warn("getCommunes: Certaines communes ont une structure invalide");
        }
        
        return validCommunes;
      }
      
      // Cas 3 : L'API retourne les données dans un wrapper { communes: [...] }
      if (typeof response.data === "object" && "communes" in response.data && Array.isArray(response.data.communes)) {
        const validCommunes = response.data.communes.filter(
          (commune): commune is Commune =>
            commune &&
            typeof commune === "object" &&
            typeof commune.id === "number" &&
            typeof commune.libelle === "string"
        );
        
        if (import.meta.env.DEV && validCommunes.length !== response.data.communes.length) {
          console.warn("getCommunes: Certaines communes ont une structure invalide");
        }
        
        return validCommunes;
      }
      
      // Structure de réponse non reconnue
      if (import.meta.env.DEV) {
        console.warn("getCommunes: Structure de réponse non reconnue", response.data);
      }
      
      return [];
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
            "Erreur d'authentification lors de la récupération des communes";
          throw new Error(errorMessage);
        }
        
        // Autres erreurs HTTP : retourner un tableau vide mais logger en mode développement
        if (import.meta.env.DEV) {
          console.error("getCommunes: Erreur lors de la récupération des communes", {
            status,
            message: apiError?.message || apiError?.error,
          });
        }
        
        // Retourner un tableau vide pour ne pas bloquer le formulaire
        // L'utilisateur pourra toujours créer une boutique même si les communes ne sont pas chargées
        return [];
      } else if (error && typeof error === "object" && "request" in error) {
        // Erreur réseau : aucune réponse du serveur
        if (import.meta.env.DEV) {
          console.error("getCommunes: Erreur réseau - Aucune réponse du serveur");
        }
        
        // Retourner un tableau vide pour ne pas bloquer le formulaire
        return [];
      } else {
        // Autre type d'erreur : propager si c'est une Error, sinon retourner un tableau vide
        if (error instanceof Error) {
          // En mode développement, logger l'erreur
          if (import.meta.env.DEV) {
            console.error("getCommunes: Erreur inattendue", error);
          }
          // Ne pas propager l'erreur pour ne pas bloquer le formulaire
          return [];
        }
        
        return [];
      }
    }
  },

  /**
   * Récupérer la liste des administrateurs avec pagination
   * @param page - Numéro de page (par défaut: toutes les pages)
   * @returns Promise<Admin[]> - Liste complète des administrateurs
   */
  async getAdmins(page: number = 1): Promise<{
    data: Admin[];
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
      const url = `/admins?page=${page}`;
      const response = await apiClient.get<PaginatedResponse<Admin>>(url);
      
      // Vérifier si la réponse est une chaîne d'erreur (ex: "vous êtes pas connecté")
      if (typeof response.data === 'string') {
        // Si c'est un message d'erreur d'authentification, lever une erreur
        const responseString: string = response.data;
        const lowerResponse = responseString.toLowerCase();
        if (lowerResponse.includes('connecté') || 
            lowerResponse.includes('connecte') ||
            lowerResponse.includes('authentification') ||
            lowerResponse.includes('unauthorized')) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }
        // Retourner une structure vide avec pagination
        return {
          data: [],
          meta: { current_page: 1, from: 0, last_page: 1, per_page: 10, to: 0, total: 0 },
          links: { first: null, last: null, prev: null, next: null }
        };
      }
      
      // Vérifier si response.data existe
      if (!response.data) {
        return {
          data: [],
          meta: { current_page: 1, from: 0, last_page: 1, per_page: 10, to: 0, total: 0 },
          links: { first: null, last: null, prev: null, next: null }
        };
      }
      
      // La réponse est paginée avec structure { data: [...], links: {...}, meta: {...} }
      if (response.data.data && Array.isArray(response.data.data)) {
        return {
          data: response.data.data,
          meta: response.data.meta || { current_page: page, from: 1, last_page: 1, per_page: response.data.data.length, to: response.data.data.length, total: response.data.data.length },
          links: response.data.links || { first: null, last: null, prev: null, next: null }
        };
      }
      
      // Si la structure n'est pas celle attendue, essayer d'autres formats
      // Cas 1 : Tableau direct (pas de pagination)
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: { current_page: page, from: 1, last_page: 1, per_page: response.data.length, to: response.data.length, total: response.data.length },
          links: { first: null, last: null, prev: null, next: null }
        };
      }
      
      // Cas 2 : Objet avec propriété admins contenant un tableau
      if ((response.data as any).admins && Array.isArray((response.data as any).admins)) {
        const adminData = (response.data as any).admins;
        return {
          data: adminData,
          meta: { current_page: page, from: 1, last_page: 1, per_page: adminData.length, to: adminData.length, total: adminData.length },
          links: { first: null, last: null, prev: null, next: null }
        };
      }
      
      // Cas 3 : Objet avec propriété result contenant un tableau
      if ((response.data as any).result && Array.isArray((response.data as any).result)) {
        const resultData = (response.data as any).result;
        return {
          data: resultData,
          meta: { current_page: page, from: 1, last_page: 1, per_page: resultData.length, to: resultData.length, total: resultData.length },
          links: { first: null, last: null, prev: null, next: null }
        };
      }
      
      // Retourner une structure vide si la structure n'est pas reconnue
      return {
        data: [],
        meta: { current_page: 1, from: 0, last_page: 1, per_page: 10, to: 0, total: 0 },
        links: { first: null, last: null, prev: null, next: null }
      };
    } catch (error: unknown) {
      
      // Si c'est une erreur d'authentification, la propager pour que l'intercepteur la gère
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number }; message?: string };
        if (axiosError.response?.status === 401 || 
            (axiosError.message && typeof axiosError.message === 'string' && axiosError.message.includes('authentifié'))) {
          throw error;
        }
      }
      
      // En cas d'erreur, retourner une structure vide avec pagination
      return {
        data: [],
        meta: { current_page: 1, from: 0, last_page: 1, per_page: 10, to: 0, total: 0 },
        links: { first: null, last: null, prev: null, next: null }
      };
    }
  },

  /**
   * Supprimer un administrateur
   * @param adminId - ID de l'administrateur à supprimer (UUID string)
   * @returns Promise<void>
   */
  async deleteAdmin(adminId: string | number): Promise<void> {
    try {
      await apiClient.delete(`/admins/${adminId}`);
    } catch (error: unknown) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; statusText?: string; data?: { message?: string; error?: string } } };
        const apiError = axiosError.response?.data;
        const errorMessage = 
          apiError?.message || 
          apiError?.error || 
          `Erreur ${axiosError.response?.status}: ${axiosError.response?.statusText}` ||
          "Erreur lors de la suppression de l'administrateur";
        throw new Error(errorMessage);
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
      } else {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression de l'administrateur";
        throw new Error(errorMessage);
      }
    }
  },
};

export default adminService;

