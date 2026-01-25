"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

/**
 * Hook pour protéger une page - redirige vers /login si non authentifié
 * Usage: appelez ce hook dans votre composant page ou layout
 *
 * @example
 * function DashboardPage() {
 *   useRequireAuth();
 *   // ... rest of component
 * }
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, isLoading]);

  return { user, isLoading };
}
