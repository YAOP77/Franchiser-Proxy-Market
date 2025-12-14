/**
 * Service de gestion des rapports et statistiques - Proxy Market Dashboard
 * 
 * Ce service gère toutes les opérations liées aux rapports et statistiques :
 * - Récupération des statistiques générales
 */

import apiClient from "./axiosConfig";

/**
 * Interface pour les statistiques de commandes
 */
export interface OrderStats {
  commande_to_day: number;
  commande_to_day_soustotal: number;
  commandehier: number;
  commandehier_soustotal: number;
  commandesemaine: number;
  commandesemaine_soustotal: number;
  commandeSemainePasse: number;
  commandeSemainePasse_soustotal: number;
  commandemois: number;
  commandemois_soustotal: number;
  commandeMoisPasse: number;
  commandeMoisPasse_soustotal: number;
  commandeannee: number;
  commandeannee_soustotal: number;
  commandeAnneePasse: number;
  commandeAnneePasse_soustotal: number;
}

/**
 * Interface pour les statistiques de produits
 */
export interface ProductStats {
  all_produit: number;
  produit_with_stock: number;
}

/**
 * Interface pour les statistiques de livreurs
 */
export interface DeliveryStats {
  all_livreur: number;
}

/**
 * Interface complète pour les rapports
 */
export interface ReportsResponse extends OrderStats, ProductStats, DeliveryStats {}

/**
 * Service de gestion des rapports
 */
const reportService = {
  /**
   * Récupérer les statistiques et rapports
   * @returns Promise<ReportsResponse> - Statistiques complètes
   */
  async getReports(): Promise<ReportsResponse> {
    try {
      const response = await apiClient.get<ReportsResponse>("/get-reports");
      
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
      
      // Vérifier si response.data existe
      if (!response.data) {
        throw new Error("Aucune donnée reçue de l'API");
      }

      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Une erreur est survenue lors de la récupération des statistiques");
    }
  },
};

export default reportService;

