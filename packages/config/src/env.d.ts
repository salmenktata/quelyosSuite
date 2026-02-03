/// <reference types="vite/client" />

/**
 * Extension du type ImportMeta pour Vite
 */
interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_ENABLE_MOCK?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
