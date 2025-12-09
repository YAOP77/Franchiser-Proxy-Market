/**
 * Client API pour Proxy Market Dashboard
 * 
 * Ce fichier prépare la structure pour l'intégration des API REST.
 * Le client sera implémenté lors de l'intégration des APIs.
 */

import { API_CONFIG } from "../../config/constants";
import type { ApiResponse, ApiError } from "../../types";

/**
 * Configuration du client API
 */
class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
  }

  /**
   * Méthode générique pour les requêtes GET
   * @param endpoint - Chemin de l'endpoint API
   * @param options - Options supplémentaires pour la requête
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Méthode générique pour les requêtes POST
   * @param endpoint - Chemin de l'endpoint API
   * @param data - Données à envoyer
   * @param options - Options supplémentaires pour la requête
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Méthode générique pour les requêtes PUT
   * @param endpoint - Chemin de l'endpoint API
   * @param data - Données à envoyer
   * @param options - Options supplémentaires pour la requête
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Méthode générique pour les requêtes DELETE
   * @param endpoint - Chemin de l'endpoint API
   * @param options - Options supplémentaires pour la requête
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Gestion des erreurs API
   * @param error - Erreur à traiter
   */
  private handleError(error: unknown): ApiError {
    // TODO: Implémenter la gestion d'erreurs lors de l'intégration
    return {
      message: "Une erreur est survenue",
      status: 500,
    };
  }
}

/**
 * Instance singleton du client API
 */
export const apiClient = new ApiClient();

/**
 * Services API spécialisés (à créer selon les besoins)
 * Exemple:
 * export const userService = {
 *   getUsers: () => apiClient.get<User[]>('/users'),
 *   getUserById: (id: string) => apiClient.get<User>(`/users/${id}`),
 *   createUser: (user: Partial<User>) => apiClient.post<User>('/users', user),
 * };
 */
