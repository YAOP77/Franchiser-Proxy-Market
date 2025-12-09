/**
 * Service de gestion des commandes - Proxy Market Dashboard
 * 
 * Ce service gère toutes les opérations liées aux commandes :
 * - Récupération de la liste des commandes
 * - Récupération des détails d'une commande
 * - Mise à jour du statut d'une commande
 */

import apiClient from "./axiosConfig";
import { formatApiErrorMessage } from "../../utils/apiErrorUtils";

/**
 * Interface pour les données utilisateur dans une commande
 */
export interface OrderUser {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  image?: string;
  avatar?: string;
  [key: string]: any; // Pour permettre d'autres propriétés de l'API
}

/**
 * Interface pour les données produit dans une commande
 */
export interface OrderProduct {
  id: string | number;
  name: string;
  libelle?: string; // Nom alternatif du produit
  quantity: number;
  quantite?: number; // Format alternatif
  price?: number | string;
  prix?: string; // Prix formaté depuis l'API
  prix_or?: number; // Prix numérique depuis l'API
  total?: number | string;
  total_prix?: string; // Total formaté depuis l'API
  image?: string;
  photo?: string;
  valeur_poids?: string | number;
  unite_poids?: string;
  description?: string;
  categorie?: string | null;
  [key: string]: any; // Pour permettre d'autres propriétés de l'API
}

/**
 * Interface pour les informations du client dans une commande
 */
export interface OrderClient {
  id: string | number;
  nom?: string;
  prenoms?: string;
  email?: string | null;
  contact1?: string | null;
  contact2?: string | null;
  status?: number;
  [key: string]: any;
}

/**
 * Interface pour un livreur disponible dans une commande
 */
export interface AvailableDeliveryPerson {
  id: string;
  nom?: string | null;
  prenoms?: string | null;
  contact1?: string | null;
  contact2?: string | null;
}

/**
 * Interface pour un livreur assigné à une commande
 */
export interface AssignedDeliveryPerson {
  id: string;
  nom?: string | null;
  prenoms?: string | null;
  email?: string | null;
  contact1?: string | null;
  contact2?: string | null;
  status?: number;
  latitude?: string | null;
  longitude?: string | null;
  adresse?: string | null;
  location_name?: string | null;
}

/**
 * Interface pour l'adresse de livraison détaillée
 */
export interface DeliveryAddress {
  id?: string;
  latitude?: string | null;
  longitude?: string | null;
  adresse?: string | null;
  location_name?: string | null;
  adresse_detail?: string | null;
  commune_id?: string | null;
  commune?: string | null;
  contact1?: string | null;
  contact2?: string | null;
}

/**
 * Interface pour les détails d'une commande (réponse de /commande-detail)
 */
export interface OrderDetail {
  id: string | number;
  numero?: string;
  quantite?: number;
  status: OrderStatus | number;
  status_text?: string;
  status_bg?: string;
  frais_livraison?: string; // Formaté (ex: "1 000 FCFA")
  frais_livraison_or?: number; // Numérique
  soustotal?: string; // Formaté (ex: "5 300 FCFA")
  soustotal_or?: number; // Numérique
  total: string; // Formaté (ex: "5 300 FCFA")
  total_or?: number; // Numérique
  adresse_livraison?: string | DeliveryAddress | null; // Peut être une string ou un objet détaillé
  modepaiement?: string | null;
  datecommande?: string;
  client?: OrderClient; // Informations du client
  livreur?: AssignedDeliveryPerson; // Livreur assigné à la commande
  commande_details?: OrderProduct[]; // Tableau des produits de la commande
  livreurs_disponible?: AvailableDeliveryPerson[]; // Liste des livreurs disponibles
  [key: string]: any;
}

/**
 * Interface pour les données de livraison
 */
export interface OrderDelivery {
  location?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  delivery_fee?: number | string;
  [key: string]: any; // Pour permettre d'autres propriétés de l'API
}

/**
 * Statuts possibles d'une commande
 */
export type OrderStatus = 
  | "En attente" 
  | "En préparation" 
  | "En livraison" 
  | "Livré" 
  | "Annulé"
  | "pending"
  | "preparing"
  | "delivering"
  | "delivered"
  | "cancelled"
  | string; // Pour permettre d'autres statuts de l'API

/**
 * Interface pour une commande
 */
export interface Order {
  id: string | number;
  numero?: string; // Numéro de commande de l'API (ex: "301110400")
  order_number?: string; // Numéro de commande formaté (ex: CMD-001)
  quantite?: number; // Quantité totale de produits
  user?: OrderUser | {
    id?: string | number;
    name?: string;
    email?: string;
    phone?: string;
    image?: string;
    avatar?: string;
    [key: string]: any;
  };
  product?: OrderProduct | OrderProduct[]; // Peut être un produit unique ou un tableau
  products?: OrderProduct[]; // Tableau de produits (pour commandes multiples)
  primary_produit?: {
    id: string | number;
    libelle: string;
    photo_prymary?: string;
    [key: string]: any;
  }; // Produit principal de l'API
  status: OrderStatus | number;
  status_text?: string; // Texte du statut formaté
  status_bg?: string; // Couleur de fond du badge (ex: "primary")
  total: number | string;
  subtotal?: number | string;
  delivery_fee?: number | string;
  service_fee?: number | string;
  order_date?: string;
  orderDate?: string; // Format alternatif
  created_at?: string;
  updated_at?: string;
  delivery?: OrderDelivery;
  delivery_location?: string;
  deliveryLocation?: string; // Format alternatif
  delivery_address?: string;
  latitude?: number | string;
  longitude?: number | string;
  [key: string]: any; // Pour permettre d'autres propriétés de l'API
}

/**
 * Interface pour une réponse paginée de l'API
 */
export interface PaginatedOrderResponse {
  data: Order[];
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
 * Interface pour la réponse de récupération des commandes
 */
export interface GetOrdersResponse {
  data: Order[];
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
}

/**
 * Service de gestion des commandes
 */
const orderService = {
  /**
   * Parse le montant formaté en nombre
   * Ex: "5 300 FCFA" -> 5300
   */
  parseFormattedAmount(amount: string | number): number {
    if (typeof amount === 'number') {
      return amount;
    }
    if (typeof amount !== 'string') {
      return 0;
    }
    // Retirer "FCFA" et les espaces, puis parser
    const cleaned = amount.replace(/FCFA/gi, '').replace(/\s/g, '').trim();
    return parseFloat(cleaned) || 0;
  },

  /**
   * Normalise les données d'une commande pour un affichage cohérent
   * @param order - Commande brute de l'API
   * @returns Commande normalisée
   */
  normalizeOrder(order: any): Order {
    // Utiliser status_text de l'API si disponible, sinon normaliser le statut
    let statusText = order.status_text || order.status;
    
    if (!order.status_text) {
      // Normaliser le statut si status_text n'est pas fourni
      if (typeof order.status === 'number') {
        // Si le statut est un nombre, mapper vers un texte
        const statusMap: Record<number, string> = {
          0: "En attente de paiement",
          1: "En préparation",
          2: "En livraison",
          3: "Livré",
          4: "Annulé",
        };
        statusText = statusMap[order.status] || "En attente";
      } else if (typeof order.status === 'string') {
        // Normaliser les statuts en anglais vers français
        const statusMap: Record<string, string> = {
          "pending": "En attente",
          "preparing": "En préparation",
          "delivering": "En livraison",
          "delivered": "Livré",
          "cancelled": "Annulé",
        };
        statusText = statusMap[order.status.toLowerCase()] || order.status;
      }
    }

    // Normaliser les données utilisateur (peut ne pas être présent dans l'API)
    const normalizedUser = {
      id: order.user?.id || order.user_id || order.client_id || "",
      name: order.user?.name || order.user?.nom || order.client_name || order.user_name || "Client",
      email: order.user?.email || order.client_email || "",
      phone: order.user?.phone || order.user?.telephone || order.client_phone || "",
      image: order.user?.image || order.user?.avatar || order.user?.photo || "/images/user/user-01.jpg",
      ...order.user,
    };

    // Normaliser les données produit depuis primary_produit
    let normalizedProduct: OrderProduct | undefined;
    if (order.primary_produit) {
      normalizedProduct = {
        id: order.primary_produit.id || "",
        name: order.primary_produit.libelle || order.primary_produit.name || "Produit inconnu",
        libelle: order.primary_produit.libelle || order.primary_produit.name,
        quantity: order.quantite || order.quantity || 1,
        price: 0, // Non fourni dans l'API
        total: this.parseFormattedAmount(order.total),
        image: order.primary_produit.photo_prymary || order.primary_produit.photo || order.primary_produit.image || "",
        ...order.primary_produit,
      };
    } else if (order.products && Array.isArray(order.products)) {
      // Plusieurs produits (fallback)
      normalizedProduct = order.products.map((p: any) => ({
        id: p.id || p.product_id || "",
        name: p.name || p.libelle || p.product_name || "Produit inconnu",
        libelle: p.libelle || p.name,
        quantity: p.quantity || p.qty || 1,
        price: p.price || p.prix || 0,
        total: p.total || (Number(p.price || 0) * Number(p.quantity || 1)),
        image: p.image || p.photo || p.photo_url || "",
        ...p,
      }))[0]; // Prendre le premier produit
    } else if (order.product) {
      // Un seul produit (fallback)
      normalizedProduct = {
        id: order.product.id || order.product_id || "",
        name: order.product.name || order.product.libelle || order.product_name || "Produit inconnu",
        libelle: order.product.libelle || order.product.name,
        quantity: order.product.quantity || order.product.qty || order.quantite || order.quantity || 1,
        price: order.product.price || order.product.prix || 0,
        total: order.product.total || this.parseFormattedAmount(order.total),
        image: order.product.image || order.product.photo || order.product.photo_url || "",
        ...order.product,
      };
    }

    // Normaliser la localisation de livraison (peut ne pas être présent)
    const deliveryLocation = 
      order.delivery_location || 
      order.deliveryLocation || 
      order.delivery?.location || 
      order.delivery?.address ||
      order.address ||
      "Non spécifiée";

    // Normaliser la date
    const orderDate = 
      order.order_date || 
      order.orderDate || 
      order.created_at || 
      new Date().toISOString();

    // Normaliser le total (parser depuis le format "5 300 FCFA")
    const total = this.parseFormattedAmount(order.total);

    // Utiliser numero de l'API comme numéro de commande
    const orderNumber = 
      order.numero || 
      order.order_number || 
      order.orderNumber || 
      (typeof order.id === 'string' && order.id.startsWith('CMD-') 
        ? order.id 
        : `CMD-${String(order.id).padStart(3, '0')}`);

    return {
      id: order.id,
      order_number: orderNumber,
      numero: order.numero, // Conserver le numéro original
      user: normalizedUser,
      product: normalizedProduct,
      products: normalizedProduct ? [normalizedProduct] : [],
      status: statusText as OrderStatus,
      status_text: statusText,
      status_bg: order.status_bg || "primary", // Conserver la couleur de fond du badge
      total,
      quantite: order.quantite || (normalizedProduct?.quantity || 1), // Conserver la quantité totale
      subtotal: total,
      delivery_fee: typeof order.delivery_fee === 'string' ? parseFloat(order.delivery_fee) || 0 : Number(order.delivery_fee) || 0,
      service_fee: typeof order.service_fee === 'string' ? parseFloat(order.service_fee) || 0 : Number(order.service_fee) || 0,
      order_date: orderDate,
      orderDate: orderDate,
      delivery_location: deliveryLocation,
      deliveryLocation: deliveryLocation,
      delivery_address: order.delivery?.address || order.address || deliveryLocation,
      latitude: order.latitude || order.delivery?.latitude || "",
      longitude: order.longitude || order.delivery?.longitude || "",
      created_at: order.created_at,
      updated_at: order.updated_at,
      primary_produit: order.primary_produit, // Conserver les données du produit principal
      ...order, // Conserver les autres propriétés de l'API
    };
  },

  /**
   * Récupérer la liste des commandes avec pagination
   * 
   * @param page - Numéro de page (par défaut: 1)
   * @param status - Filtrer par statut (optionnel)
   * @returns Promise avec les données paginées
   */
  async getOrders(page: number = 1, status?: OrderStatus): Promise<GetOrdersResponse> {
    try {
      // Construire l'URL avec les paramètres de pagination et de filtre
      // L'API utilise /commandes-index comme endpoint
      let url = `/commandes-index?page=${page}`;
      if (status) {
        url += `&status=${encodeURIComponent(status)}`;
      }

      const response = await apiClient.get<PaginatedOrderResponse | Order[]>(url);
      
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

      // Si la réponse est directement un tableau (sans pagination)
      if (Array.isArray(response.data)) {
        const normalizedOrders = response.data.map((order: any) => this.normalizeOrder(order));
        return {
          data: normalizedOrders,
          meta: {
            current_page: 1,
            from: normalizedOrders.length > 0 ? 1 : null,
            last_page: 1,
            per_page: normalizedOrders.length,
            to: normalizedOrders.length,
            total: normalizedOrders.length,
          },
          links: {
            first: null,
            last: null,
            prev: null,
            next: null,
          },
        };
      }

      // Si la réponse est paginée avec structure { data: [...], links: {...}, meta: {...} }
      if (response.data.data && Array.isArray(response.data.data) && response.data.meta) {
        const normalizedOrders = response.data.data.map((order: any) => this.normalizeOrder(order));
        return {
          data: normalizedOrders,
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
      throw new Error("Une erreur est survenue lors de la récupération des commandes");
    }
  },

  /**
   * Récupérer les détails d'une commande par son identifiant
   * 
   * @param orderId - ID de la commande
   * @returns Promise<OrderDetail> - Détails de la commande
   */
  async getOrderDetailById(orderId: string | number): Promise<OrderDetail> {
    if (!orderId) {
      throw new Error("Identifiant commande manquant");
    }

    try {
      // L'API utilise /commande-detail/{orderId}
      const response = await apiClient.get<{ data: OrderDetail }>(`/commande-detail/${orderId}`);
      
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
        if (lowerResponse.includes('not found') || lowerResponse.includes('introuvable')) {
          throw new Error("Commande introuvable");
        }
        throw new Error("Réponse inattendue de l'API");
      }
      
      // Vérifier si response.data existe
      if (!response.data) {
        throw new Error("Aucune donnée reçue de l'API");
      }

      // La réponse est dans { data: {...} }
      const orderDetail = response.data.data || response.data;
      
      // Normaliser les produits dans commande_details
      if (orderDetail.commande_details && Array.isArray(orderDetail.commande_details)) {
        orderDetail.commande_details = orderDetail.commande_details.map((detail: any) => ({
          id: detail.id,
          name: detail.libelle || detail.name || "Produit inconnu",
          libelle: detail.libelle,
          quantity: detail.quantite || detail.quantity || 1,
          quantite: detail.quantite || detail.quantity || 1,
          price: detail.prix || detail.price || "",
          prix: detail.prix,
          prix_or: detail.prix_or || 0,
          total: detail.total_prix || detail.total || "0 FCFA",
          total_prix: detail.total_prix,
          image: detail.photo || detail.image || "",
          photo: detail.photo,
          valeur_poids: detail.valeur_poids,
          unite_poids: detail.unite_poids,
          description: detail.description || "",
          categorie: detail.categorie,
          ...detail,
        }));
      }

      return orderDetail;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Une erreur est survenue lors de la récupération de la commande");
    }
  },

  /**
   * Récupérer une commande par son identifiant (méthode legacy - utilise getOrderDetailById)
   * 
   * @param orderId - ID de la commande
   * @returns Promise<Order> - Données de la commande
   * @deprecated Utiliser getOrderDetailById pour les détails complets
   */
  async getOrderById(orderId: string | number): Promise<Order> {
    const detail = await this.getOrderDetailById(orderId);
    // Convertir OrderDetail en Order pour compatibilité
    return this.normalizeOrder(detail);
  },

  /**
   * Mettre à jour le statut d'une commande
   * 
   * @param orderId - ID de la commande
   * @param status - Nouveau statut
   * @returns Promise avec la réponse de l'API
   */
  async updateOrderStatus(
    orderId: string | number,
    status: OrderStatus
  ): Promise<{ success: boolean; message?: string; data?: Order; error?: string }> {
    if (!orderId) {
      throw new Error("Identifiant commande manquant");
    }

    if (!status) {
      throw new Error("Statut manquant");
    }

    try {
      const response = await apiClient.put<any>(`/commandes/${orderId}/status`, { status });
      
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
        throw new Error(responseString);
      }

      // Vérifier si la réponse indique un succès
      if (response.data.success || response.data.message) {
        const updatedOrder = response.data.data || response.data;
        return {
          success: true,
          message: response.data.message || "Statut mis à jour avec succès",
          data: this.normalizeOrder(updatedOrder),
        };
      }

      return {
        success: false,
        error: formatApiErrorMessage(response.data, "Erreur lors de la mise à jour du statut"),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Une erreur est survenue lors de la mise à jour du statut";
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Attribuer une commande à un livreur
   * 
   * @param commandeId - ID de la commande
   * @param livreurId - ID du livreur
   * @returns Promise avec la réponse de l'API
   */
  async assignOrderToDeliveryPerson(
    commandeId: string,
    livreurId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!commandeId) {
      throw new Error("Identifiant commande manquant");
    }

    if (!livreurId) {
      throw new Error("Identifiant livreur manquant");
    }

    try {
      const response = await apiClient.post<any>("/attribution-au-livreur", {
        commande_id: commandeId,
        livreur_id: livreurId,
      });
      
      // Vérifier si la réponse indique que la commande est déjà en cours de préparation
      if (response.data && typeof response.data === 'object') {
        // Cas spécifique : Commande déjà attribuée
        if (response.data.msg && response.data.msg.includes('En cours de préparation')) {
          // Normaliser le message pour remplacer "Commande En cours de préparation" par "En cours de préparation"
          const errorMessage = response.data.msg.replace(/Commande\s+En\s+cours\s+de\s+préparation/gi, 'En cours de préparation');
          return {
            success: false,
            error: errorMessage || "Cette commande est déjà en cours de préparation et ne peut plus être réattribuée.",
          };
        }
        
        // Vérifier si la réponse indique un succès
        if (response.data.success || response.data.message) {
          return {
            success: true,
            message: response.data.message || "Commande attribuée au livreur avec succès",
          };
        }
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
        // Si la réponse semble être un message de succès
        if (lowerResponse.includes('succès') || lowerResponse.includes('success')) {
          return {
            success: true,
            message: responseString,
          };
        }
        throw new Error(responseString);
      }

      // Vérifier si la réponse indique un succès
      if (response.data?.success || response.data?.message) {
        return {
          success: true,
          message: response.data.message || "Commande attribuée au livreur avec succès",
        };
      }

      return {
        success: true,
        message: "Commande attribuée au livreur avec succès",
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Une erreur est survenue lors de l'attribution de la commande";
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

export default orderService;

