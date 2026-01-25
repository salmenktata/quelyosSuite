// @quelyos/auth - Unified Authentication Package
// Système d'authentification centralisé pour toutes les apps Quelyos

// Next.js Provider (with cookies, middleware support)
export { AuthProvider, useAuth } from "./src/AuthProvider";
export { useRequireAuth } from "./src/hooks";

// Vite/React Provider (with localStorage)
export {
  AuthProviderVite,
  useAuth as useAuthVite,
  useRequireAuth as useRequireAuthVite,
} from "./src/AuthProviderVite";

// Shared utilities
export { AuthErrorBoundary } from "./src/AuthErrorBoundary";
export { authLogger } from "./src/logger";
export { authEvents, useAuthEvent } from "./src/events";
export { authConfig } from "./src/config";
export type { User, AuthContextType, AuthProviderProps } from "./src/types";
