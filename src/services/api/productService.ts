/**
 * Service de gestion des produits vivriers - Proxy Market Dashboard
 * 
 * Ce service gère toutes les opérations liées aux produits vivriers :
 * - Création d'un produit vivrier
 * - Récupération de la liste des produits
 */

import apiClient from "./axiosConfig";
import { formatApiErrorMessage } from "../../utils/apiErrorUtils";

/**
 * Interface pour les données de création de produit vivrier
 */
export interface CreateProductData {
  libelle: string;
  unite_poids: string;
  valeur_poids: number;
  categorie: string;
  prix_achat: number;
  prix_vente_normale: number;
  prix_vente_reduit: number;
  description: string;
  status: string;
  photos: File[]; // Tableau de fichiers images
}

/**
 * Interface pour les données de modification de produit vivrier
 */
export interface UpdateProductData {
  libelle: string;
  unite_poids: string;
  valeur_poids: number;
  categorie: string;
  prix_achat: number;
  prix_vente_normale: number;
  prix_vente_reduit: number;
  description: string;
  status: string;
  photos?: File[]; // Tableau de fichiers images (optionnel pour la modification)
}

/**
 * Interface pour la réponse de création de produit
 */
export interface CreateProductResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Interface pour une catégorie de produit
 */
export interface Category {
  id: string | number;
  libelle: string;
  [key: string]: any; // Pour permettre d'autres propriétés de l'API
}

/**
 * Interface pour un produit vivrier
 */
export interface Product {
  id: string | number;
  libelle: string;
  unite_poids: string;
  valeur_poids: number | string;
  categorie_id?: string | number;
  categorie?: string | Category;
  categorie_name?: string; // Nom de la catégorie retourné par l'API
  prix_achat: number | string;
  prix_vente_normale: number | string;
  prix_vente_reduit: number | string;
  description?: string;
  status: number | string;
  status_text?: string;
  photo_prymary?: string; // Photo principale (ancienne structure)
  all_photos?: Array<{
    id?: string | number;
    photo?: string;
    url?: string;
    is_primary?: number | string;
    [key: string]: any;
  }>; // Tableau de toutes les photos retourné par l'API
  photos?: Array<{
    id?: string | number;
    photo?: string;
    url?: string;
    path?: string;
    image?: string;
    is_primary?: number | string;
    [key: string]: any; // Pour permettre d'autres propriétés de l'API
  }>;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Pour permettre d'autres propriétés de l'API
}

/**
 * Interface pour une réponse paginée de l'API
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
 * Service de gestion des produits vivriers
 */
const productService = {

  /**
   * Récupérer la liste des catégories
   * @returns Promise<Category[]> - Liste des catégories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<any>("/get-categories");
      
      // L'API retourne directement un tableau d'objets avec id et libelle
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Si l'API retourne les données dans un wrapper
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Retourner un tableau vide si la structure n'est pas reconnue
      return [];
    } catch (error: any) {
      // En cas d'erreur, retourner un tableau vide pour ne pas bloquer le formulaire
      // Les catégories pourront être ajoutées manuellement si nécessaire
      return [];
    }
  },
  /**
   * Créer un nouveau produit vivrier
   * 
   * @param productData - Données du produit à créer
   * @returns Promise avec la réponse de l'API
   */
  async createProduct(productData: CreateProductData): Promise<CreateProductResponse> {
    try {
      // Validation des données avant l'envoi
      if (!productData.photos || productData.photos.length === 0) {
        throw new Error("Au moins une image est requise pour créer un produit");
      }

      // Valider que chaque photo est bien un File valide
      const validPhotos = productData.photos.filter((photo) => photo instanceof File);
      if (validPhotos.length !== productData.photos.length) {
        throw new Error("Une ou plusieurs images ne sont pas valides");
      }

      if (validPhotos.length === 0) {
        throw new Error("Aucune image valide n'a été fournie");
      }

      // Créer un FormData pour envoyer les fichiers
      const formData = new FormData();
      
      // Ajouter les champs texte
      formData.append("libelle", productData.libelle);
      formData.append("unite_poids", productData.unite_poids);
      formData.append("valeur_poids", productData.valeur_poids.toString());
      formData.append("categorie", productData.categorie);
      formData.append("prix_achat", productData.prix_achat.toString());
      formData.append("prix_vente_normale", productData.prix_vente_normale.toString());
      formData.append("prix_vente_reduit", productData.prix_vente_reduit.toString());
      formData.append("description", productData.description);
      formData.append("status", productData.status);
      
      // Ajouter les photos avec la structure attendue par l'API
      // photos[0][photo] = fichier, photos[0][is_primary] = 1 ou 0
      // La première image (index 0) est la principale (is_primary = 1)
      validPhotos.forEach((photo, index) => {
        // Vérifier que le fichier est valide avant de l'ajouter
        if (!(photo instanceof File)) {
          throw new Error(`L'image ${index + 1} n'est pas un fichier valide`);
        }

        // Vérifier que le fichier n'est pas vide
        if (photo.size === 0) {
          throw new Error(`L'image ${index + 1} est vide`);
        }

        // Ajouter le fichier avec la structure attendue par l'API
        formData.append(`photos[${index}][photo]`, photo);
        // La première image est principale (1), les autres sont secondaires (0)
        formData.append(`photos[${index}][is_primary]`, index === 0 ? "1" : "0");
      });

      
      // Envoyer la requête POST avec FormData
      const response = await apiClient.post("/produits", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Vérifier le statut HTTP pour confirmer la création réussie
      // Statut attendu : 201 (Created) ou 200 (OK)
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La création a échoué avec le statut HTTP ${response.status}`);
      }

      // Vérifier que la réponse contient bien des données
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
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
                            "La création du produit a échoué";
            throw new Error(errorMsg);
          }
          // Si success est true, retourner la réponse formatée
          const productData = responseData.produit || responseData.data || responseData;
          return {
            success: true,
            message: typeof responseData.message === 'string' ? responseData.message : "Produit créé avec succès",
            data: productData,
          };
        }
        
        // Cas 3 : Réponse avec un message et retour (structure Laravel/PHP typique)
        // L'API retourne { msg, cls, retour, produit }
        if (responseData.retour !== undefined) {
          const retour = responseData.retour;
          if (retour === 0 || retour === false) {
            const errorMsg = typeof responseData.msg === 'string' ? responseData.msg :
                            typeof responseData.message === 'string' ? responseData.message :
                            "La création a échoué";
            throw new Error(errorMsg);
          }
          // retour === 1 signifie succès
          // L'API retourne les données du produit dans responseData.produit
          const productData = responseData.produit || responseData.data || responseData;
          return {
            success: true,
            message: typeof responseData.msg === 'string' ? responseData.msg :
                    typeof responseData.message === 'string' ? responseData.message :
                    "Produit créé avec succès",
            data: productData,
          };
        }
        
        // Cas 4 : Réponse avec message de succès et produit
        if (responseData.msg || responseData.message) {
          const message = typeof responseData.msg === 'string' ? responseData.msg :
                         typeof responseData.message === 'string' ? responseData.message : '';
          // Si le message contient des mots-clés de succès
          const successKeywords = ['succès', 'créé', 'success', 'created', 'ajouté'];
          const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
          
          if (isSuccess) {
            const productData = responseData.produit || responseData.data || responseData;
            return {
              success: true,
              message: message,
              data: productData,
            };
          }
        }
      }
      
      // Si le statut HTTP est 201 ou 200, considérer comme succès même si la structure est inattendue
      if (response.status === 201 || response.status === 200) {
        const responseData = response.data as Record<string, unknown>;
        const productData = responseData?.produit || responseData?.data || response.data;
        return {
          success: true,
          message: "Produit créé avec succès",
          data: productData,
        };
      }
      
      // Si aucune condition n'est remplie, considérer comme une erreur
      throw new Error("Réponse inattendue de l'API lors de la création");
    } catch (error: any) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === 'object' && 'response' in error) {
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
          `Erreur ${status || 'inconnue'}: ${axiosError.response?.statusText || 'Une erreur est survenue'}`;
        
        return {
          success: false,
          error: errorMessage,
        };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la création du produit";
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Récupérer la liste des produits vivriers avec pagination (GET)
   * 
   * Note: L'API de la boutique utilise GET standard pour récupérer les produits
   * 
   * @param page - Numéro de page (par défaut: 1)
   * @returns Promise avec les données paginées
   */
  async getProducts(page: number = 1): Promise<{
    data: Product[];
    meta: {
      current_page: number;
      from: number | null;
      last_page: number;
      per_page: number;
      to: number | null;
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
      // L'API de la boutique utilise GET standard avec pagination en query string
      const url = `/produits?page=${page}`;
      const response = await apiClient.get<PaginatedResponse<Product>>(url);
      
      // Vérifier si la réponse est une chaîne d'erreur (ex: "vous êtes pas connecté")
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
      
      // Vérifier si response.data existe
      if (!response.data) {
        throw new Error("Aucune donnée reçue de l'API");
      }
      
      // La réponse est paginée avec structure { data: [...], links: {...}, meta: {...} }
      if (response.data.data && Array.isArray(response.data.data) && response.data.meta) {
        return {
          data: response.data.data,
          meta: response.data.meta,
          links: response.data.links,
        };
      }
      
      // Si la structure n'est pas celle attendue, lever une erreur
      throw new Error("Structure de réponse inattendue de l'API");
    } catch (error: unknown) {
      // Propager l'erreur pour que le composant puisse la gérer
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Une erreur est survenue lors de la récupération des produits");
    }
  },

  /**
   * Récupérer un produit par son identifiant
   * @param productId - ID du produit
   * @returns Promise<Product> - Données du produit
   */
  async getProductById(productId: string | number): Promise<Product> {
    if (!productId) {
      throw new Error("Identifiant produit manquant");
    }

    try {
      const response = await apiClient.get<any>(`/produits/${productId}`);

      // Vérifier si la réponse est une chaîne d'erreur (ex: "vous êtes pas connecté")
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

      // Vérifier si response.data existe
      if (!response.data) {
        throw new Error("Aucune donnée reçue de l'API");
      }

      let resolvedProduct: Product | undefined;

      // Cas 1 : Réponse avec wrapper data (structure Laravel typique)
      if (typeof response.data === "object" && "data" in response.data && response.data.data) {
        resolvedProduct = response.data.data as Product;
      }
      // Cas 2 : Réponse directe (objet produit)
      else if (typeof response.data === "object" && !Array.isArray(response.data)) {
        // Vérifier si c'est un objet produit valide (a au moins un id et libelle)
        if ("id" in response.data && "libelle" in response.data) {
          resolvedProduct = response.data as Product;
        }
      }


      if (!resolvedProduct) {
        throw new Error("Réponse inattendue de l'API lors de la récupération du produit");
      }

      // L'API retourne all_photos avec les URLs complètes
      // Le status est un nombre (0 = Inactif, 1 = Actif)
      // categorie_name contient le nom de la catégorie

      return resolvedProduct;
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

        // Erreur 404 : Produit non trouvé
        if (status === 404) {
          throw new Error("Produit non trouvé");
        }

        // Erreur 401 : Non autorisé
        if (status === 401) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }

        // Gérer les différents formats de messages d'erreur
        let errorMessage = "Erreur lors de la récupération du produit";
        
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
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la récupération du produit";
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Modifier un produit vivrier
   * @param productId - ID du produit à modifier
   * @param productData - Données du produit à modifier
   * @returns Promise avec la réponse de l'API
   */
  async updateProduct(productId: string | number, productData: UpdateProductData): Promise<CreateProductResponse> {
    if (!productId) {
      throw new Error("Identifiant produit manquant");
    }

    try {
      // Créer un FormData pour envoyer les fichiers
      const formData = new FormData();
      
      // Ajouter les champs texte
      formData.append("libelle", productData.libelle);
      formData.append("unite_poids", productData.unite_poids);
      formData.append("valeur_poids", productData.valeur_poids.toString());
      formData.append("categorie", productData.categorie);
      formData.append("prix_achat", productData.prix_achat.toString());
      formData.append("prix_vente_normale", productData.prix_vente_normale.toString());
      formData.append("prix_vente_reduit", productData.prix_vente_reduit.toString());
      formData.append("description", productData.description);
      formData.append("status", productData.status);
      
      // Ajouter les photos seulement si elles sont fournies
      if (productData.photos && productData.photos.length > 0) {
        // Valider que chaque photo est bien un File valide
        const validPhotos = productData.photos.filter((photo) => photo instanceof File);
        
        validPhotos.forEach((photo, index) => {
          // Vérifier que le fichier est valide avant de l'ajouter
          if (!(photo instanceof File)) {
            throw new Error(`L'image ${index + 1} n'est pas un fichier valide`);
          }

          // Vérifier que le fichier n'est pas vide
          if (photo.size === 0) {
            throw new Error(`L'image ${index + 1} est vide`);
          }

          // Ajouter le fichier avec la structure attendue par l'API
          formData.append(`photos[${index}][photo]`, photo);
          // La première image est principale (1), les autres sont secondaires (0)
          formData.append(`photos[${index}][is_primary]`, index === 0 ? "1" : "0");
        });
      }

      // Envoyer la requête PUT avec FormData
      const response = await apiClient.put(`/produits/${productId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Vérifier le statut HTTP pour confirmer la modification réussie
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La modification a échoué avec le statut HTTP ${response.status}`);
      }

      // Vérifier que la réponse contient bien des données
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // L'API peut retourner différentes structures de réponse
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
                            "La modification du produit a échoué";
            throw new Error(errorMsg);
          }
          const productData = responseData.produit || responseData.data || responseData;
          return {
            success: true,
            message: typeof responseData.message === 'string' ? responseData.message : "Produit modifié avec succès",
            data: productData,
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
          const productData = responseData.produit || responseData.data || responseData;
          return {
            success: true,
            message: typeof responseData.msg === 'string' ? responseData.msg :
                    typeof responseData.message === 'string' ? responseData.message :
                    "Produit modifié avec succès",
            data: productData,
          };
        }
        
        // Cas 4 : Réponse avec message de succès et produit
        if (responseData.msg || responseData.message) {
          const message = typeof responseData.msg === 'string' ? responseData.msg :
                         typeof responseData.message === 'string' ? responseData.message : '';
          const successKeywords = ['succès', 'modifié', 'success', 'updated', 'modifiée'];
          const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
          
          if (isSuccess) {
            const productData = responseData.produit || responseData.data || responseData;
            return {
              success: true,
              message: message,
              data: productData,
            };
          }
        }
      }
      
      // Si le statut HTTP est 200 ou 201, considérer comme succès
      if (response.status === 200 || response.status === 201) {
        const responseData = response.data as Record<string, unknown>;
        const productData = responseData?.produit || responseData?.data || response.data;
        return {
          success: true,
          message: "Produit modifié avec succès",
          data: productData,
        };
      }
      
      throw new Error("Réponse inattendue de l'API lors de la modification");
    } catch (error: any) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === 'object' && 'response' in error) {
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
          `Erreur ${status || 'inconnue'}: ${axiosError.response?.statusText || 'Une erreur est survenue'}`;
        
        return {
          success: false,
          error: errorMessage,
        };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la modification du produit";
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Récupérer les produits du store de la boutique
   * 
   * Cette fonction permet de récupérer tous les produits ajoutés au store
   * avec leurs informations de stock
   * 
   * @returns Promise avec la liste des produits du store
   */
  async getStoreProducts(): Promise<Array<{
    produit_id: string | number;
    stock: string | number;
    [key: string]: any;
  }>> {
    try {
      // Endpoint pour récupérer les produits du store
      // Si l'endpoint n'existe pas, on essaiera une autre approche
      const endpoint = `/produits/store-stock`;
      const response = await apiClient.get(endpoint);

      // Vérifier si la réponse est valide
      if (!response.data) {
        return [];
      }

      // L'API peut retourner différentes structures
      // Cas 1 : Tableau direct
      if (Array.isArray(response.data)) {
        return response.data;
      }

      // Cas 2 : Dans un wrapper data
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      // Si l'endpoint n'existe pas (404), retourner un tableau vide
      // Cela signifie que l'API ne supporte pas encore cette fonctionnalité
      if (error?.response?.status === 404) {
        return [];
      }
      
      // Pour les autres erreurs, retourner un tableau vide pour ne pas bloquer l'application
      return [];
    }
  },

  /**
   * Ajouter un produit au store de la boutique
   * 
   * Cette fonction permet au gérant d'ajouter un produit vivrier à son stock
   * en spécifiant la quantité disponible
   * 
   * @param productId - ID du produit à ajouter au store
   * @param quantity - Quantité de stock disponible
   * @returns Promise avec la réponse de l'API
   */
  async addProductToStore(
    productId: string | number, 
    quantity: number
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    if (!productId) {
      throw new Error("Identifiant produit manquant");
    }

    if (!quantity || quantity <= 0) {
      throw new Error("La quantite doit etre superieure a zero");
    }

    try {
      // Construire l'URL de l'API
      const endpoint = `/produits/store-stock/${productId}`;
      
      // Préparer les données à envoyer
      // L'API attend le champ "stock" pour la quantité de stock
      const payload = {
        stock: quantity,
      };
      
      // Appeler l'API pour ajouter le produit au store
      const response = await apiClient.post(endpoint, payload);

      // Vérifier le statut HTTP pour confirmer l'ajout réussi
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`L'ajout au store a echoue avec le statut HTTP ${response.status}`);
      }

      // Vérifier que la réponse contient bien des données
      if (!response.data) {
        throw new Error("La reponse de l'API ne contient pas de donnees");
      }

      // Gérer différents formats de réponse
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as Record<string, unknown>;
        
        // Cas 1 : Réponse avec un champ d'erreur explicite
        if (responseData.error || responseData.erreur) {
          const errorMsg = typeof responseData.error === 'string' ? responseData.error :
                          typeof responseData.erreur === 'string' ? responseData.erreur :
                          typeof responseData.message === 'string' ? responseData.message :
                          "L'ajout au store a echoue";
          throw new Error(errorMsg);
        }
        
        // Cas 2 : Réponse avec success explicite
        if (responseData.success !== undefined) {
          if (responseData.success === false) {
            const errorMsg = typeof responseData.message === 'string' ? responseData.message :
                            typeof responseData.msg === 'string' ? responseData.msg :
                            "L'ajout du produit au store a echoue";
            throw new Error(errorMsg);
          }
          return {
            success: true,
            message: typeof responseData.message === 'string' ? responseData.message : "Produit ajoute a votre boutique avec succes",
            data: responseData.data,
          };
        }
        
        // Cas 3 : Réponse avec retour (structure Laravel/PHP typique)
        if (responseData.retour !== undefined) {
          const retour = responseData.retour;
          if (retour === 0 || retour === false) {
            const errorMsg = typeof responseData.msg === 'string' ? responseData.msg :
                            typeof responseData.message === 'string' ? responseData.message :
                            "L'ajout au store a echoue";
            throw new Error(errorMsg);
          }
          // L'API retourne "produit" dans la réponse, pas "data"
          return {
            success: true,
            message: typeof responseData.msg === 'string' ? responseData.msg :
                    typeof responseData.message === 'string' ? responseData.message :
                    "Produit ajoute a votre boutique avec succes",
            data: responseData.produit || responseData.data,
          };
        }
        
        // Cas 4 : Réponse avec message de succès
        if (responseData.msg || responseData.message) {
          const message = typeof responseData.msg === 'string' ? responseData.msg :
                         typeof responseData.message === 'string' ? responseData.message : '';
          const successKeywords = ['succes', 'ajoute', 'success', 'added', 'cree'];
          const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
          
          if (isSuccess || response.status === 200 || response.status === 201) {
            return {
              success: true,
              message: message || "Produit ajoute a votre boutique avec succes",
              data: responseData.data,
            };
          }
        }
      }
      
      // Si le statut HTTP est 200 ou 201, considérer comme succès
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          message: "Produit ajoute a votre boutique avec succes",
          data: response.data,
        };
      }
      
      throw new Error("Reponse inattendue de l'API lors de l'ajout au store");
    } catch (error: any) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === 'object' && 'response' in error) {
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
            message: errorMessage,
          };
        }
        
        // Erreur 409 : Produit déjà dans le store
        if (status === 409) {
          return {
            success: false,
            message: apiError?.message || "Ce produit est deja dans votre store",
          };
        }
        
        // Autres erreurs HTTP
        const errorMessage = 
          apiError?.message || 
          apiError?.error || 
          `Erreur ${status || 'inconnue'}: ${axiosError.response?.statusText || 'Une erreur est survenue'}`;
        
        return {
          success: false,
          message: errorMessage,
        };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de l'ajout du produit au store";
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Supprimer un produit vivrier
   * @param productId - ID du produit à supprimer
   * @returns Promise<void>
   */
  async deleteProduct(productId: string | number): Promise<void> {
    if (!productId) {
      throw new Error("Identifiant produit manquant");
    }

    try {
      const response = await apiClient.delete(`/produits/${productId}`);
      
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

        // Erreur 404 : Produit non trouvé
        if (status === 404) {
          throw new Error("Produit non trouvé");
        }

        // Erreur 401 : Non autorisé
        if (status === 401) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }

        // Gérer les différents formats de messages d'erreur
        let errorMessage = "Erreur lors de la suppression du produit";
        
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
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression du produit";
        throw new Error(errorMessage);
      }
    }
  },
};

export default productService;

