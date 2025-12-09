/**
 * Client API pour Proxy Market Dashboard
 * 
 * Ce fichier prépare la structure pour l'intégration des API REST.
 * Note: Ce client n'est pas utilisé actuellement - voir axiosConfig.ts pour le client actif.
 */

import { API_CONFIG } from "../../config/constants";
import type { ApiResponse, ApiError } from "../../types";

/**
 * Configuration du client API
 * @deprecated Utilisez axiosConfig.ts à la place
 */
class ApiClient {
  constructor() {
    // Configuration stockée dans API_CONFIG
    void API_CONFIG;
  }

  /**
   * Méthode générique pour les requêtes GET
   */
  async get<T>(_endpoint: string, _options?: RequestInit): Promise<ApiResponse<T>> {
    throw new Error("API client not implemented - use axiosConfig instead");
  }

  /**
   * Méthode générique pour les requêtes POST
   */
  async post<T>(
    _endpoint: string,
    _data?: unknown,
    _options?: RequestInit
  ): Promise<ApiResponse<T>> {
    throw new Error("API client not implemented - use axiosConfig instead");
  }

  /**
   * Méthode générique pour les requêtes PUT
   */
  async put<T>(
    _endpoint: string,
    _data?: unknown,
    _options?: RequestInit
  ): Promise<ApiResponse<T>> {
    throw new Error("API client not implemented - use axiosConfig instead");
  }

  /**
   * Méthode générique pour les requêtes DELETE
   */
  async delete<T>(_endpoint: string, _options?: RequestInit): Promise<ApiResponse<T>> {
    throw new Error("API client not implemented - use axiosConfig instead");
  }
  }

  /**
 * Utility function for error handling (placeholder)
   */
export function handleApiError(_error: unknown): ApiError {
    return {
      message: "Une erreur est survenue",
      status: 500,
    };
}

/**
 * Instance singleton du client API
 * @deprecated Utilisez axiosConfig.ts à la place
 */
export const apiClient = new ApiClient();
