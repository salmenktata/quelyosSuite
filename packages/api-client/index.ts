/**
 * @quelyos/api-client
 * Client API unifié pour toutes les applications Quelyos
 */

export { ApiClient, createApiClient } from "./src/client";
export type {
  ApiClientConfig,
  ApiRequestOptions,
  ApiResponse,
  ApiError,
  ApiMethod,
  RequestConfig,
} from "./src/types";

// ApiFetch - HTTP Wrapper with auth & tenant headers
export { apiFetch, apiFetchJson, apiGet, apiPost, apiPut, apiDelete } from "./src/apiFetch";
export type { ApiFetchOptions } from "./src/apiFetch";
