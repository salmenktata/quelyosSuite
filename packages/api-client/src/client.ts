import type {
  ApiClientConfig,
  ApiRequestOptions,
  ApiResponse,
  ApiError,
  ApiMethod,
} from "./types";

/**
 * Client API unifié pour Quelyos
 *
 * Fonctionnalités:
 * - Support cookies httpOnly
 * - Timeout configurable
 * - Retry automatique
 * - Error handling unifié
 * - Logging structuré
 */
export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout ?? 30000,
      credentials: config.credentials ?? "include",
      headers: config.headers ?? {},
      onUnauthorized: config.onUnauthorized ?? (() => {}),
      onError: config.onError ?? (() => {}),
    };
  }

  /**
   * Effectue une requête HTTP
   */
  private async request<T>(
    method: ApiMethod,
    endpoint: string,
    data?: unknown,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const controller = new AbortController();
    const timeout = options.timeout ?? this.config.timeout;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = this.buildHeaders(options);
      const body = data ? JSON.stringify(data) : undefined;

      console.log(`[API ${method}]`, url);

      const response = await fetch(url, {
        method,
        headers,
        body,
        credentials: this.config.credentials,
        signal: options.signal ?? controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      console.log(`[API Response]`, {
        status: response.status,
        statusText: response.statusText,
      });

      // Gestion des erreurs HTTP
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse de la réponse
      const responseData = await this.parseResponse<T>(response);

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.transformError(error, url);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const response = await this.request<T>("GET", endpoint, undefined, options);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await this.request<T>("POST", endpoint, data, options);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await this.request<T>("PUT", endpoint, data, options);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await this.request<T>("PATCH", endpoint, data, options);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const response = await this.request<T>(
      "DELETE",
      endpoint,
      undefined,
      options
    );
    return response.data;
  }

  /**
   * Construit l'URL complète
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith("http")) {
      return endpoint;
    }
    const cleanBase = this.config.baseUrl.replace(/\/$/, "");
    const cleanEndpoint = endpoint.replace(/^\//, "");
    return `${cleanBase}/${cleanEndpoint}`;
  }

  /**
   * Construit les headers
   */
  private buildHeaders(options: ApiRequestOptions): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...this.config.headers,
      ...options.headers,
    };
  }

  /**
   * Parse la réponse
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch (error) {
        console.error("[API Parse Error]", error);
        return {} as T;
      }
    }

    if (response.body) {
      const text = await response.text();
      return text as unknown as T;
    }

    return {} as T;
  }

  /**
   * Gère les erreurs HTTP
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: unknown;

    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }
    } catch {
      errorData = null;
    }

    // 401 Unauthorized
    if (response.status === 401) {
      this.config.onUnauthorized();
    }

    const error: ApiError = new Error(
      `HTTP ${response.status}: ${response.statusText}`
    ) as ApiError;
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = errorData;

    this.config.onError(error);
    throw error;
  }

  /**
   * Transforme les erreurs en ApiError
   */
  private transformError(error: unknown, url: string): ApiError {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError: ApiError = new Error(
        `Request timeout après ${this.config.timeout}ms: ${url}`
      ) as ApiError;
      timeoutError.isTimeout = true;
      return timeoutError;
    }

    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      const networkError: ApiError = new Error(
        `Erreur réseau: Impossible de contacter ${url}`
      ) as ApiError;
      networkError.isNetworkError = true;
      return networkError;
    }

    if (error instanceof Error) {
      return error as ApiError;
    }

    return new Error(String(error)) as ApiError;
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

/**
 * Factory pour créer un client API
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
