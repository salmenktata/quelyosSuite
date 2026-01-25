/**
 * AuthProvider pour applications Vite/React (non-Next.js)
 * Compatible avec backoffice et autres apps React standards
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { User, AuthContextType } from "./types";
import { authLogger } from "./logger";
import { authEvents } from "./events";

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderViteProps {
  children: ReactNode;
  apiBaseUrl?: string;
  tokenKey?: string;
  onAuthError?: (error: Error) => void;
}

const DEFAULT_TOKEN_KEY = "quelyos_token";

/**
 * AuthProvider pour Vite/React
 * Utilise localStorage au lieu de cookies
 */
export function AuthProviderVite({
  children,
  apiBaseUrl,
  tokenKey = DEFAULT_TOKEN_KEY,
  onAuthError,
}: AuthProviderViteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getApiBase = useCallback(() => {
    if (apiBaseUrl) return apiBaseUrl;

    // Vite env variables
    const envUrl = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL;
    if (envUrl) return envUrl.replace(/\/$/, "");

    // Fallback
    return window.location.origin;
  }, [apiBaseUrl]);

  /**
   * Vérifie le token JWT stocké
   */
  const verifyToken = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch(`${getApiBase()}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success && data.valid && data.user) {
        setUser(data.user);
        authLogger.tokenRefreshSuccess();
        authEvents.emit("tokenRefreshed", data.user);
        return true;
      } else {
        // Token invalide
        localStorage.removeItem(tokenKey);
        setUser(null);
        authLogger.tokenRefreshFailed();
        return false;
      }
    } catch (error) {
      authLogger.error("Token verification failed", error);
      localStorage.removeItem(tokenKey);
      setUser(null);
      if (onAuthError) onAuthError(error as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getApiBase, tokenKey, onAuthError]);

  /**
   * Login avec email/password
   */
  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      setIsLoading(true);
      authLogger.loginAttempt(email);

      try {
        const response = await fetch(`${getApiBase()}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, rememberMe }),
        });

        const data = await response.json();

        if (!data.success || !data.token) {
          throw new Error(data.error || "Login failed");
        }

        // Stocker token
        localStorage.setItem(tokenKey, data.token);
        setUser(data.user);

        authLogger.loginSuccess(data.user);
        authEvents.emit("login", data.user);

        return { success: true, user: data.user };
      } catch (error) {
        authLogger.loginFailed(email, error);
        authEvents.emit("loginError", error);
        if (onAuthError) onAuthError(error as Error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Login failed",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [getApiBase, tokenKey, onAuthError]
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    authLogger.logout();

    try {
      const token = localStorage.getItem(tokenKey);
      if (token) {
        await fetch(`${getApiBase()}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      authLogger.error("Logout API call failed", error);
    } finally {
      localStorage.removeItem(tokenKey);
      setUser(null);
      authEvents.emit("logout");
    }
  }, [getApiBase, tokenKey]);

  /**
   * Refresh token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshing) return false;

    setIsRefreshing(true);
    authLogger.tokenRefreshAttempt();

    try {
      const token = localStorage.getItem(tokenKey);
      if (!token) return false;

      const response = await fetch(`${getApiBase()}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem(tokenKey, data.token);
        if (data.user) setUser(data.user);
        authLogger.tokenRefreshSuccess();
        authEvents.emit("tokenRefreshed", data.user);
        return true;
      } else {
        await logout();
        return false;
      }
    } catch (error) {
      authLogger.tokenRefreshFailed();
      await logout();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, getApiBase, tokenKey, logout]);

  /**
   * Get current token
   */
  const getToken = useCallback((): string | null => {
    return localStorage.getItem(tokenKey);
  }, [tokenKey]);

  // Vérifier token au montage
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // Auto-refresh token toutes les 30 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(
      () => {
        refreshToken();
      },
      30 * 60 * 1000
    ); // 30 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook pour utiliser le contexte auth (Vite)
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProviderVite");
  }
  return context;
}

/**
 * Hook pour protéger une route (Vite/React Router)
 */
export function useRequireAuth(redirectTo = "/login") {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = redirectTo;
    }
  }, [user, isLoading, redirectTo]);

  return { user, isLoading };
}
