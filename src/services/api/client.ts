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
  private _baseURL: string;
  private _timeout: number;

  constructor() {
    this._baseURL = API_CONFIG.baseURL;
    this._timeout = API_CONFIG.timeout;
  }

  /**
   * Méthode générique pour les requêtes GET
   */
  async get<T>(_endpoint: string, _options?: RequestInit): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Méthode générique pour les requêtes POST
   */
  async post<T>(
    _endpoint: string,
    _data?: unknown,
    _options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Méthode générique pour les requêtes PUT
   */
  async put<T>(
    _endpoint: string,
    _data?: unknown,
    _options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Méthode générique pour les requêtes DELETE
   */
  async delete<T>(_endpoint: string, _options?: RequestInit): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Gestion des erreurs API
   */
  private _handleError(_error: unknown): ApiError {
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
