"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type { User, AuthContextType } from "./types";
import { authLogger } from "./logger";
import { authEvents } from "./events";
import { authConfig } from "./config";

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  apiBaseUrl?: string;
}

// Routes publiques qui ne nécessitent pas de vérification auth automatique
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export function AuthProvider({ children, apiBaseUrl }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Resolve API base URL
  const getApiBase = useCallback(() => {
    if (apiBaseUrl) return apiBaseUrl;
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (envUrl) return envUrl.replace(/\/$/, "");
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api`;
    }
    return "/api";
  }, [apiBaseUrl]);

  // Refresh token automatically when accessToken expires
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshing) return false;

    setIsRefreshing(true);
    authLogger.tokenRefreshAttempt();

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}${authConfig.endpoints.refresh}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        authLogger.tokenRefreshFailure("HTTP " + res.status);
        authEvents.emit("token_refresh", { success: false });
        return false;
      }

      authLogger.tokenRefreshSuccess();
      authEvents.emit("token_refresh", { success: true });
      return true;
    } catch (error) {
      const err = error as Error;
      authLogger.tokenRefreshFailure(err.message);
      authEvents.emit("token_refresh", { success: false });
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [getApiBase, isRefreshing]);

  // Check auth status
  const checkAuth = useCallback(async () => {
    if (typeof window === "undefined") return;

    const apiBase = getApiBase();

    try {
      const res = await fetch(`${apiBase}/auth/validate`, {
        credentials: "include",
      });

      if (!res.ok) {
        // Try to refresh token before giving up
        if (res.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            // Retry validation after refresh
            const retryRes = await fetch(`${apiBase}/auth/validate`, {
              credentials: "include",
            });

            if (retryRes.ok) {
              const retryData = await retryRes.json();
              setUser(retryData.user);
              setIsLoading(false);
              return;
            }
          }
        }

        // ✅ NE PAS rediriger automatiquement - laisser les layouts gérer ça
        setUser(null);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setIsLoading(false);
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setIsLoading(false);
      // ✅ NE PAS rediriger automatiquement - laisser les layouts gérer ça
    }
  }, [getApiBase, refreshToken]);

  // Check auth on mount (skip on public routes to avoid console errors)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Skip auth check on public routes
      const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));

      if (isPublicRoute) {
        // Sur les pages publiques, ne pas vérifier l'auth automatiquement
        setIsLoading(false);
        return;
      }

      checkAuth();
    }
  }, [checkAuth, pathname]);

  // Setup periodic token refresh when authenticated
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const refreshInterval = setInterval(
        async () => {
          await refreshToken();
        },
        10 * 60 * 1000
      ); // 10 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [user, refreshToken]);

  // Login
  const login = useCallback(
    async (email: string, password: string) => {
      authLogger.loginAttempt(email);

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}${authConfig.endpoints.login}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        authLogger.loginFailure(email, error.error || "Unknown error");
        throw new Error(error.error || "Login failed");
      }

      const data = await res.json();
      setUser(data.user);

      authLogger.loginSuccess(data.user.id, email);
      authEvents.emit("login", { userId: data.user.id, email });

      router.push(authConfig.ui.redirectAfterLogin);
    },
    [getApiBase, router]
  );

  // Logout
  const logout = useCallback(async () => {
    const userId = user?.id;
    if (userId) {
      authLogger.logoutInitiated(userId);
    }

    const apiBase = getApiBase();
    try {
      await fetch(`${apiBase}${authConfig.endpoints.logout}`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      authLogger.error("Logout API call failed", error as Error);
    }

    setUser(null);

    if (userId) {
      authLogger.logoutSuccess(userId);
      authEvents.emit("logout", { userId });
    }

    router.push(authConfig.ui.redirectAfterLogout);
  }, [getApiBase, router, user]);

  // Fetch with automatic token refresh on 401
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const response = await fetch(url, {
        ...options,
        credentials: "include",
      });

      // If 401, try to refresh token and retry once
      if (response.status === 401 && !isRefreshing) {
        console.log("🔄 401 detected, attempting token refresh...");
        const refreshed = await refreshToken();

        if (refreshed) {
          console.log("✅ Token refreshed, retrying request...");
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        } else {
          console.warn("❌ Token refresh failed");
          setUser(null);
        }
      }

      return response;
    },
    [refreshToken, isRefreshing]
  );

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuth,
    fetchWithAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
