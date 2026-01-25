"use client";

import { useState, useEffect } from "react";
import type { AuthResponse, User, LoginCredentials, RegisterForm } from "./types";

// Storage keys
export const USER_KEY = "qyl_user";

// Storage utilities (user only, token httpOnly cookie géré côté serveur)
function setUser(user?: User) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Token retrieval (httpOnly cookies non accessibles via JS)
export function getToken(): string | null {
  return null;
}

// User retrieval (fallback local cache uniquement, pas de décodage JWT)
export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem(USER_KEY);
  if (u) return JSON.parse(u);
  return null;
}

// API wrapper with auth headers
export async function authFetch<T>(
  apiUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // toujours envoyer les cookies httpOnly
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response.json();
}

// Authentication methods factory
export function createAuthClient(apiUrl: string) {
  async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await authFetch<AuthResponse>(apiUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    
    if (data.requires2FA) return data;
    
    setUser(data.user as User ?? { email: credentials.email, role: data.role });
    
    return data;
  }

  async function register(form: RegisterForm): Promise<AuthResponse> {
    const data = await authFetch<AuthResponse>(apiUrl, "/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    });
    
    setUser({
      email: form.email,
      role: "ADMIN",
      id: data.userId,
      companyId: data.companyId,
    });
    
    return data;
  }

  async function logout(): Promise<void> {
    if (typeof window === "undefined") return;
    
    try {
      await authFetch(apiUrl, "/auth/logout", { method: "POST" });
    } catch (e) {
      // Ignore logout API errors
    }

    localStorage.removeItem(USER_KEY);
  }

  async function requestPasswordReset(email: string) {
    return authFetch<{ resetToken?: string; message?: string }>(apiUrl, "/auth/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async function resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    const data = await authFetch<AuthResponse>(apiUrl, "/auth/reset", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });

    setUser(data.user as User ?? { role: data.role });
    return data;
  }

  return {
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
  };
}

// React hook for protected routes
export function useRequireAuth() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    authFetch<{ valid: boolean; user?: User }>(apiUrl, "/auth/validate", {
      method: "GET",
    })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setIsReady(true);
        } else {
          window.location.replace("/login");
        }
      })
      .catch(() => {
        window.location.replace("/login");
      });
  }, []);

  return { loading: !isReady, user };
}
