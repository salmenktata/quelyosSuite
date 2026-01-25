/**
 * Types pour le client API
 */

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
  onUnauthorized?: () => void;
  onError?: (error: ApiError) => void;
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: unknown;
  isTimeout?: boolean;
  isNetworkError?: boolean;
}

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestConfig {
  method: ApiMethod;
  endpoint: string;
  data?: unknown;
  options?: ApiRequestOptions;
}
