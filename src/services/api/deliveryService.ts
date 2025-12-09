/**
 * Service de gestion des livreurs - Proxy Market Dashboard
 * 
 * Ce service gère toutes les opérations liées aux livreurs :
 * - Création d'un livreur
 * - Récupération de la liste des livreurs
 * - Modification d'un livreur
 * - Suppression d'un livreur
 */

import apiClient from "./axiosConfig";
import { formatApiErrorMessage } from "../../utils/apiErrorUtils";

/**
 * Interface pour les données de création de livreur
 */
export interface CreateDeliveryPersonData {
  nom: string;
  prenoms: string;
  email: string;
  password: string;
  contact1: string;
  status: string; // "0" ou "1" (chaîne) - le backend le convertit en nombre
}

/**
 * Interface pour les données de modification de livreur
 * Le mot de passe est optionnel (non modifié si non fourni)
 */
export interface UpdateDeliveryPersonData {
  nom: string;
  prenoms: string;
  email: string;
  password?: string;
  contact1: string;
  status: string;
}

/**
 * Interface pour la réponse de création de livreur
 */
export interface CreateDeliveryPersonResponse {
  success: boolean;
  message?: string;
  data?: DeliveryPerson | unknown;
  error?: string;
}

/**
 * Interface pour la réponse de modification de livreur
 */
export interface UpdateDeliveryPersonResponse {
  success: boolean;
  message?: string;
  data?: DeliveryPerson | unknown;
  error?: string;
}

/**
 * Interface pour un livreur
 */
export interface DeliveryPerson {
  id: string | number;
  nom: string;
  prenoms: string;
  email: string;
  contact1?: string | null;
  status: number | string; // 1 pour actif, 0 pour inactif
  status_text?: string; // "Actif" ou "Inactif"
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Pour permettre d'autres propriétés de l'API
}

/**
 * Interface pour la réponse paginée de l'API
 */
export interface PaginatedDeliveryPersonResponse {
  data: DeliveryPerson[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}

/**
 * Interface pour le payload envoyé à l'API lors de la création
 */
interface DeliveryPersonPayload {
  nom: string;
  prenoms: string;
  email: string;
  password: string;
  contact1: string;
  status: string;
}

/**
 * Service de gestion des livreurs
 */
const deliveryService = {
  /**
   * Créer un nouveau livreur
   * @param deliveryPersonData - Données du livreur à créer
   * @returns Promise<CreateDeliveryPersonResponse> - Réponse de l'API
   */
  async createDeliveryPerson(
    deliveryPersonData: CreateDeliveryPersonData
  ): Promise<CreateDeliveryPersonResponse> {
    try {
      // Validation des données avant l'envoi
      if (!deliveryPersonData.nom?.trim()) {
        throw new Error("Le nom est requis");
      }
      if (!deliveryPersonData.prenoms?.trim()) {
        throw new Error("Le prénom est requis");
      }
      if (!deliveryPersonData.email?.trim()) {
        throw new Error("L'email est requis");
      }
      if (!deliveryPersonData.password?.trim()) {
        throw new Error("Le mot de passe est requis");
      }
      if (!deliveryPersonData.contact1?.trim()) {
        throw new Error("Le contact est requis");
      }
      if (!deliveryPersonData.status) {
        throw new Error("Le statut est requis");
      }

      // S'assurer que les données sont formatées exactement comme l'API les attend
      const payload: DeliveryPersonPayload = {
        nom: deliveryPersonData.nom.trim(),
        prenoms: deliveryPersonData.prenoms.trim(),
        email: deliveryPersonData.email.trim().toLowerCase(),
        password: deliveryPersonData.password,
        contact1: deliveryPersonData.contact1.trim(),
        status: deliveryPersonData.status,
      };

      // Appeler l'API pour créer le livreur
      // Endpoint: POST /livreur/store
      const response = await apiClient.post<unknown>("/livreur/store", payload);

      // Vérifier le statut HTTP pour confirmer la création réussie
      // Statut attendu : 201 (Created) ou 200 (OK)
      const isSuccessStatus = response.status >= 200 && response.status < 300;

      if (!isSuccessStatus) {
        throw new Error(
          `La création a échoué avec le statut HTTP ${response.status}`
        );
      }

      // Vérifier que la réponse contient bien des données
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // L'API peut retourner différentes structures de réponse
      // Vérifier d'abord si c'est une erreur explicite
      if (response.data && typeof response.data === "object") {
        const responseData = response.data as Record<string, unknown>;

        // Cas 1 : Réponse avec un champ d'erreur explicite
        if (responseData.error || responseData.erreur) {
          const errorMsg =
            typeof responseData.error === "string"
              ? responseData.error
              : typeof responseData.erreur === "string"
              ? responseData.erreur
              : typeof responseData.message === "string"
              ? responseData.message
              : "La création a échoué";
          throw new Error(errorMsg);
        }

        // Cas 2 : Réponse avec success explicite
        if (responseData.success !== undefined) {
          if (responseData.success === false) {
            const errorMsg =
              typeof responseData.message === "string"
                ? responseData.message
                : typeof responseData.msg === "string"
                ? responseData.msg
                : "La création du livreur a échoué";
            throw new Error(errorMsg);
          }
          // Si success est true, retourner la réponse formatée
          const deliveryPersonData =
            responseData.livreur ||
            responseData.data ||
            responseData.delivery_person ||
            responseData;
          return {
            success: true,
            message:
              typeof responseData.message === "string"
                ? responseData.message
                : "Livreur créé avec succès",
            data: deliveryPersonData,
          };
        }

        // Cas 3 : Réponse avec un message et retour (structure Laravel/PHP typique)
        // L'API retourne { msg, cls, retour, livreur }
        if (responseData.retour !== undefined) {
          const retour = responseData.retour;
          if (retour === 0 || retour === false) {
            const errorMsg =
              typeof responseData.msg === "string"
                ? responseData.msg
                : typeof responseData.message === "string"
                ? responseData.message
                : "La création a échoué";
            throw new Error(errorMsg);
          }
          // retour === 1 signifie succès
          // L'API retourne les données du livreur dans responseData.livreur
          const deliveryPersonData =
            responseData.livreur ||
            responseData.data ||
            responseData.delivery_person ||
            responseData;
          return {
            success: true,
            message:
              typeof responseData.msg === "string"
                ? responseData.msg
                : typeof responseData.message === "string"
                ? responseData.message
                : "Livreur créé avec succès",
            data: deliveryPersonData,
          };
        }

        // Cas 4 : Réponse avec message de succès et livreur
        if (responseData.msg || responseData.message) {
          const message =
            typeof responseData.msg === "string"
              ? responseData.msg
              : typeof responseData.message === "string"
              ? responseData.message
              : "";
          // Si le message contient des mots-clés de succès
          const successKeywords = [
            "succès",
            "créé",
            "success",
            "created",
            "ajouté",
          ];
          const isSuccess = successKeywords.some((keyword) =>
            message.toLowerCase().includes(keyword)
          );

          if (isSuccess) {
            const deliveryPersonData =
              responseData.livreur ||
              responseData.data ||
              responseData.delivery_person ||
              responseData;
            return {
              success: true,
              message: message,
              data: deliveryPersonData,
            };
          }
        }
      }

      // Si le statut HTTP est 201 ou 200, considérer comme succès même si la structure est inattendue
      if (response.status === 201 || response.status === 200) {
        const responseData = response.data as Record<string, unknown>;
        const deliveryPersonData =
          responseData?.livreur ||
          responseData?.data ||
          responseData?.delivery_person ||
          response.data;
        return {
          success: true,
          message: "Livreur créé avec succès",
          data: deliveryPersonData,
        };
      }

      // Si aucune condition n'est remplie, considérer comme une erreur
      throw new Error("Réponse inattendue de l'API lors de la création");
    } catch (error: unknown) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: any;
          };
        };
        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;

        // Erreur 422 : Validation échouée - extraire tous les messages d'erreur
        if (status === 422 && apiError) {
          // L'API Laravel retourne généralement les erreurs dans error.error ou error.errors
          const errorData = apiError.error || apiError.errors || apiError;

          const errorMessage = formatApiErrorMessage(errorData);

          return {
            success: false,
            error: errorMessage,
          };
        }

        // Autres erreurs HTTP
        const errorMessage =
          apiError?.message ||
          apiError?.error ||
          `Erreur ${status || "inconnue"}: ${
            axiosError.response?.statusText || "Une erreur est survenue"
          }`;

        return {
          success: false,
          error: errorMessage,
        };
      }

      // Erreur réseau ou autre
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la création du livreur";

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Récupérer la liste des livreurs avec pagination
   * @param page - Numéro de page (par défaut: 1)
   * @param search - Terme de recherche (optionnel)
   * @returns Promise avec les données paginées
   */
  async getDeliveryPersons(
    page: number = 1,
    search?: string
  ): Promise<PaginatedDeliveryPersonResponse> {
    try {
      // Endpoint: GET /livreur/index?page={page}&search={search}
      let url = `/livreur/index?page=${page}`;
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      const response = await apiClient.get<any>(url);

      // Vérifier si la réponse est une chaîne d'erreur (ex: "vous êtes pas connecté")
      if (typeof response.data === "string") {
        const responseString: string = response.data;
        const lowerResponse = responseString.toLowerCase();
        if (
          lowerResponse.includes("connecté") ||
          lowerResponse.includes("connecte") ||
          lowerResponse.includes("authentification") ||
          lowerResponse.includes("unauthorized")
        ) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }
        throw new Error("Réponse inattendue de l'API");
      }

      // Vérifier si response.data existe
      if (!response.data) {
        throw new Error("Aucune donnée reçue de l'API");
      }

      // Cas 1: La réponse est directement un tableau (sans pagination)
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: {
            current_page: 1,
            from: response.data.length > 0 ? 1 : null,
            last_page: 1,
            per_page: response.data.length,
            to: response.data.length,
            total: response.data.length,
          },
          links: {
            first: null,
            last: null,
            prev: null,
            next: null,
          },
        };
      }

      // Cas 2: La réponse est paginée avec structure { data: [...], links: {...}, meta: {...} }
      if (
        response.data.data &&
        Array.isArray(response.data.data) &&
        response.data.meta
      ) {
        return {
          data: response.data.data,
          meta: response.data.meta,
          links: response.data.links || {
            first: null,
            last: null,
            prev: null,
            next: null,
          },
        };
      }

      // Cas 3: La réponse pourrait avoir une structure différente (ex: { livreurs: [...], pagination: {...} })
      // Chercher un tableau dans la réponse
      const possibleDataKeys = ['livreurs', 'delivery_persons', 'deliveryPersons', 'results', 'items', 'data'];
      for (const key of possibleDataKeys) {
        if (response.data[key] && Array.isArray(response.data[key])) {
          const data = response.data[key];
          
          // Extraire les métadonnées de pagination si disponibles
          const meta = response.data.meta || response.data.pagination || response.data.paginate;
          const total = meta?.total || data.length;
          
          return {
            data: data,
            meta: meta || {
              current_page: page,
              from: data.length > 0 ? 1 : null,
              last_page: 1,
              per_page: data.length,
              to: data.length,
              total: total,
            },
            links: response.data.links || {
              first: null,
              last: null,
              prev: null,
              next: null,
            },
          };
        }
      }

      // Cas 4: Vérifier si la réponse est un objet avec des propriétés qui pourraient être des tableaux
      // Parfois l'API peut retourner { success: true, livreurs: [...] } ou similaire
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        const allKeys = Object.keys(response.data);
        
        // Chercher dans toutes les clés pour trouver un tableau
        for (const key of allKeys) {
          const value = response.data[key];
          if (Array.isArray(value) && value.length > 0) {
            return {
              data: value,
              meta: response.data.meta || response.data.pagination || {
                current_page: page,
                from: value.length > 0 ? 1 : null,
                last_page: 1,
                per_page: value.length,
                to: value.length,
                total: value.length,
              },
              links: response.data.links || {
                first: null,
                last: null,
                prev: null,
                next: null,
              },
            };
          }
        }
      }

      // Cas 5: Vérifier si la réponse contient un tableau vide mais avec une structure valide
      if (response.data.data && Array.isArray(response.data.data)) {
        return {
          data: response.data.data,
          meta: response.data.meta || {
            current_page: page,
            from: isEmpty ? null : 1,
            last_page: 1,
            per_page: response.data.data.length,
            to: isEmpty ? null : response.data.data.length,
            total: response.data.meta?.total || 0,
          },
          links: response.data.links || {
            first: null,
            last: null,
            prev: null,
            next: null,
          },
        };
      }

      // Si aucune structure connue n'est trouvée, lever une erreur
      throw new Error("Structure de réponse inattendue de l'API");
    } catch (error: unknown) {
      // Propager l'erreur pour que le composant puisse la gérer
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        "Une erreur est survenue lors de la récupération des livreurs"
      );
    }
  },

  /**
   * Récupérer un livreur par son identifiant
   * @param deliveryPersonId - ID du livreur
   * @returns Promise<DeliveryPerson> - Données du livreur
   */
  async getDeliveryPersonById(
    deliveryPersonId: string | number
  ): Promise<DeliveryPerson> {
    if (!deliveryPersonId) {
      throw new Error("Identifiant livreur manquant");
    }

    try {
      // Endpoint: GET /livreur/show/{id}
      const response = await apiClient.get<any>(`/livreur/show/${deliveryPersonId}`);

      // Vérifier si la réponse est une chaîne d'erreur
      if (typeof response.data === "string") {
        const responseString: string = response.data;
        const lowerResponse = responseString.toLowerCase();
        if (
          lowerResponse.includes("connecté") ||
          lowerResponse.includes("connecte") ||
          lowerResponse.includes("authentification") ||
          lowerResponse.includes("unauthorized")
        ) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }
        throw new Error("Réponse inattendue de l'API");
      }

      // Vérifier si response.data existe
      if (!response.data) {
        throw new Error("Aucune donnée reçue de l'API");
      }

      let resolvedDeliveryPerson: DeliveryPerson | undefined;

      // Cas 1 : Réponse avec wrapper data (structure Laravel typique)
      if (
        typeof response.data === "object" &&
        "data" in response.data &&
        response.data.data
      ) {
        resolvedDeliveryPerson = response.data.data as DeliveryPerson;
      }
      // Cas 2 : Réponse directe (objet livreur)
      else if (
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        // Vérifier si c'est un objet livreur valide
        if ("id" in response.data && "nom" in response.data) {
          resolvedDeliveryPerson = response.data as DeliveryPerson;
        }
      }

      if (!resolvedDeliveryPerson) {
        throw new Error(
          "Réponse inattendue de l'API lors de la récupération du livreur"
        );
      }

      return resolvedDeliveryPerson;
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

        // Erreur 404 : Livreur non trouvé
        if (status === 404) {
          throw new Error("Livreur non trouvé");
        }

        // Erreur 401 : Non autorisé
        if (status === 401) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }

        // Gérer les différents formats de messages d'erreur
        let errorMessage = "Erreur lors de la récupération du livreur";

        if (typeof apiError === "string") {
          errorMessage = apiError;
        } else if (apiError && typeof apiError === "object") {
          errorMessage =
            apiError.message || apiError.error || apiError.msg || errorMessage;
        }

        if (status) {
          errorMessage = `${errorMessage} (${status})`;
        }

        throw new Error(errorMessage);
      } else if (error && typeof error === "object" && "request" in error) {
        // Erreur réseau (pas de réponse du serveur)
        throw new Error(
          "Impossible de contacter le serveur. Vérifiez votre connexion internet."
        );
      } else {
        // Autres erreurs (déjà formatées)
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la récupération du livreur";
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Modifier un livreur
   * @param deliveryPersonId - ID du livreur à modifier
   * @param deliveryPersonData - Données du livreur à modifier
   * @returns Promise avec la réponse de l'API
   */
  async updateDeliveryPerson(
    deliveryPersonId: string | number,
    deliveryPersonData: UpdateDeliveryPersonData
  ): Promise<UpdateDeliveryPersonResponse> {
    if (!deliveryPersonId) {
      throw new Error("Identifiant livreur manquant");
    }

    try {
      // Préparer le payload (sans le mot de passe s'il n'est pas fourni)
      const payload: Partial<DeliveryPersonPayload> & {
        password?: string;
      } = {
        nom: deliveryPersonData.nom.trim(),
        prenoms: deliveryPersonData.prenoms.trim(),
        email: deliveryPersonData.email.trim().toLowerCase(),
        contact1: deliveryPersonData.contact1.trim(),
        status: deliveryPersonData.status,
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (deliveryPersonData.password?.trim()) {
        payload.password = deliveryPersonData.password.trim();
      }

      // Endpoint: POST /livreur/update/{livreur_id}
      const response = await apiClient.post(
        `/livreur/update/${deliveryPersonId}`,
        payload
      );

      // Vérifier le statut HTTP pour confirmer la modification réussie
      const isSuccessStatus = response.status >= 200 && response.status < 300;

      if (!isSuccessStatus) {
        throw new Error(
          `La modification a échoué avec le statut HTTP ${response.status}`
        );
      }

      // Vérifier que la réponse contient bien des données
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // Gérer différents formats de réponse (similaire à createDeliveryPerson)
      if (response.data && typeof response.data === "object") {
        const responseData = response.data as Record<string, unknown>;

        if (responseData.error || responseData.erreur) {
          const errorMsg =
            typeof responseData.error === "string"
              ? responseData.error
              : typeof responseData.erreur === "string"
              ? responseData.erreur
              : typeof responseData.message === "string"
              ? responseData.message
              : "La modification a échoué";
          throw new Error(errorMsg);
        }

        if (responseData.success !== undefined) {
          if (responseData.success === false) {
            const errorMsg =
              typeof responseData.message === "string"
                ? responseData.message
                : typeof responseData.msg === "string"
                ? responseData.msg
                : "La modification du livreur a échoué";
            throw new Error(errorMsg);
          }
          const deliveryPersonData =
            responseData.livreur ||
            responseData.data ||
            responseData.delivery_person ||
            responseData;
          return {
            success: true,
            message:
              typeof responseData.message === "string"
                ? responseData.message
                : "Livreur modifié avec succès",
            data: deliveryPersonData,
          };
        }

        if (responseData.retour !== undefined) {
          const retour = responseData.retour;
          if (retour === 0 || retour === false) {
            const errorMsg =
              typeof responseData.msg === "string"
                ? responseData.msg
                : typeof responseData.message === "string"
                ? responseData.message
                : "La modification a échoué";
            throw new Error(errorMsg);
          }
          const deliveryPersonData =
            responseData.livreur ||
            responseData.data ||
            responseData.delivery_person ||
            responseData;
          return {
            success: true,
            message:
              typeof responseData.msg === "string"
                ? responseData.msg
                : typeof responseData.message === "string"
                ? responseData.message
                : "Livreur modifié avec succès",
            data: deliveryPersonData,
          };
        }
      }

      // Si le statut HTTP est 200 ou 201, considérer comme succès
      if (response.status === 200 || response.status === 201) {
        const responseData = response.data as Record<string, unknown>;
        const deliveryPersonData =
          responseData?.livreur ||
          responseData?.data ||
          responseData?.delivery_person ||
          response.data;
        return {
          success: true,
          message: "Livreur modifié avec succès",
          data: deliveryPersonData,
        };
      }

      throw new Error("Réponse inattendue de l'API lors de la modification");
    } catch (error: any) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: any;
          };
        };
        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;

        // Erreur 422 : Validation échouée
        if (status === 422 && apiError) {
          const errorData = apiError.error || apiError.errors || apiError;
          const errorMessage = formatApiErrorMessage(errorData);

          return {
            success: false,
            error: errorMessage,
          };
        }

        // Autres erreurs HTTP
        const errorMessage =
          apiError?.message ||
          apiError?.error ||
          `Erreur ${status || "inconnue"}: ${
            axiosError.response?.statusText || "Une erreur est survenue"
          }`;

        return {
          success: false,
          error: errorMessage,
        };
      }

      // Erreur réseau ou autre
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la modification du livreur";

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Supprimer un livreur
   * @param deliveryPersonId - ID du livreur à supprimer
   * @returns Promise<void>
   */
  async deleteDeliveryPerson(
    deliveryPersonId: string | number
  ): Promise<void> {
    if (!deliveryPersonId) {
      throw new Error("Identifiant livreur manquant");
    }

    try {
      // Endpoint: DELETE /livreur/delete/{livreur_id} ou /livreur/{livreur_id}
      // TODO: Vérifier l'endpoint exact de l'API pour la suppression
      const response = await apiClient.delete(`/livreur/delete/${deliveryPersonId}`);

      // Vérifier le statut HTTP pour confirmer la suppression réussie
      const isSuccessStatus = response.status >= 200 && response.status < 300;

      if (!isSuccessStatus) {
        throw new Error(
          `La suppression a échoué avec le statut HTTP ${response.status}`
        );
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

        // Erreur 404 : Livreur non trouvé
        if (status === 404) {
          throw new Error("Livreur non trouvé");
        }

        // Erreur 401 : Non autorisé
        if (status === 401) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }

        // Gérer les différents formats de messages d'erreur
        let errorMessage = "Erreur lors de la suppression du livreur";

        if (typeof apiError === "string") {
          errorMessage = apiError;
        } else if (apiError && typeof apiError === "object") {
          errorMessage =
            apiError.message || apiError.error || apiError.msg || errorMessage;
        }

        if (status) {
          errorMessage = `${errorMessage} (${status})`;
        }

        throw new Error(errorMessage);
      } else if (error && typeof error === "object" && "request" in error) {
        // Erreur réseau (pas de réponse du serveur)
        throw new Error(
          "Impossible de contacter le serveur. Vérifiez votre connexion internet."
        );
      } else {
        // Autres erreurs (déjà formatées)
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la suppression du livreur";
        throw new Error(errorMessage);
      }
    }
  },
};

export default deliveryService;
