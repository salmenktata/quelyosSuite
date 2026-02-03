/**
 * Déclarations TypeScript pour @quelyos/config
 * Fichier temporaire en attendant la génération automatique des .d.ts
 */

declare module '@quelyos/config' {
  // Types environnement
  export type RuntimeEnvironment = 'development' | 'staging' | 'production' | 'test';
  export type RuntimePlatform = 'nextjs' | 'vite' | 'nodejs';
  export type ServiceName = 'vitrine' | 'ecommerce' | 'dashboard' | 'superadmin' | 'backend' | 'postgres' | 'redis';
  export type PortNumber = number;
  export type AppName = 'vitrine' | 'ecommerce' | 'dashboard' | 'superadmin';

  // Ports
  export const PORTS: {
    readonly vitrine: 3000;
    readonly ecommerce: 3001;
    readonly dashboard: 5175;
    readonly superadmin: 9000;
    readonly backend: 8069;
    readonly postgres: 5432;
    readonly redis: 6379;
  };

  export function isQuelyosPort(port: number): port is PortNumber;
  export function getServiceByPort(port: number): ServiceName | null;

  // Environnement
  export function detectPlatform(): RuntimePlatform;
  export function detectEnvironment(): RuntimeEnvironment;
  export function isDevelopment(): boolean;
  export function isStaging(): boolean;
  export function isProduction(): boolean;
  export function isTest(): boolean;
  export function isServer(): boolean;
  export function isClient(): boolean;
  export function getEnvVar(key: string, defaultValue?: string, publicOnly?: boolean): string | undefined;
  export function getPublicEnvVar(key: string, defaultValue?: string): string | undefined;

  // Apps
  export interface AppConfig {
    dev: string;
    staging?: string;
    prod: string;
  }

  export const APPS: {
    readonly vitrine: AppConfig;
    readonly ecommerce: AppConfig;
    readonly dashboard: AppConfig;
    readonly superadmin: AppConfig;
  };

  export function getAppUrl(app: AppName, env?: RuntimeEnvironment): string;
  export function getCurrentAppUrl(): string | null;
  export function isCurrentApp(app: AppName): boolean;
  export function buildCrossAppUrl(app: AppName, path?: string, env?: RuntimeEnvironment): string;

  // API Backend
  export interface BackendApiConfig {
    dev: string;
    staging?: string;
    prod: string;
  }

  export const API: {
    readonly backend: BackendApiConfig;
  };

  export function getBackendUrl(env?: RuntimeEnvironment): string;
  export function getViteProxyConfig(): Record<string, any>;
  export function getNextRewriteConfig(): Array<{ source: string; destination: string }>;
  export function getProxiedImageUrl(imageUrl: string, baseUrl?: string): string;
  export function buildApiUrl(endpoint: string, env?: RuntimeEnvironment): string;

  // Constantes
  export const TIMEOUTS: {
    readonly API_REQUEST: 30000;
    readonly API_REQUEST_LONG: 120000;
    readonly SEARCH_DEBOUNCE: 300;
    readonly INPUT_DEBOUNCE: 500;
    readonly TOAST_DURATION: 5000;
    readonly TOAST_ERROR_DURATION: 10000;
    readonly AUTO_SAVE: 2000;
    readonly TOKEN_REFRESH: 300000;
  };

  export const STORAGE_KEYS: {
    readonly AUTH_TOKEN: 'quelyos_auth_token';
    readonly REFRESH_TOKEN: 'quelyos_refresh_token';
    readonly USER_DATA: 'quelyos_user_data';
    readonly THEME: 'quelyos_theme';
    readonly LANGUAGE: 'quelyos_language';
    readonly CURRENT_TENANT: 'quelyos_current_tenant';
    readonly SIDEBAR_COLLAPSED: 'quelyos_sidebar_collapsed';
    readonly RECENT_SEARCHES: 'quelyos_recent_searches';
    readonly DRAFT_PREFIX: 'quelyos_draft_';
    readonly ONBOARDING_COMPLETED: 'quelyos_onboarding_completed';
  };

  export const SESSION_KEYS: Record<string, string>;
  export const LIMITS: Record<string, number>;
  export const DATE_FORMATS: Record<string, string>;
  export const ERROR_CODES: Record<string, string>;
  export const ERROR_MESSAGES: Record<string, string>;
  export const PATTERNS: Record<string, RegExp>;
  export const DEFAULTS: Record<string, any>;

  // Services externes
  export const STRIPE: Record<string, string>;
  export const IMAGES: Record<string, any>;
  export const GOOGLE: Record<string, any>;
  export const CDN: Record<string, string>;
  export const COMMUNICATION: Record<string, string>;
  export const SOCIAL: Record<string, any>;

  export function isExternalService(url: string): boolean;
  export function getExternalServiceName(url: string): string | null;

  // Validation
  export function validateViteEnv<T>(env: Record<string, any>, schema?: any): T;
  export function validateNextEnv<T>(env: Record<string, any>, schema?: any): T;
  export function safeValidateEnv<T>(env: Record<string, any>, schema: any): { success: boolean; data?: T; error?: any };
  export function formatZodError(error: any): string;
}
