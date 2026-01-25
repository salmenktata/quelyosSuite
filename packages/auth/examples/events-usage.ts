/**
 * Exemple d'utilisation du système d'événements d'authentification
 * Ce fichier montre comment réagir aux événements auth dans vos composants
 */

import { useEffect } from "react";
import { authEvents, useAuthEvent } from "@quelyos/auth";

// Exemple 1 : Analytics tracking
export function setupAuthAnalytics() {
  // Logger les logins pour analytics
  authEvents.on("login", ({ userId, email }) => {
    // @ts-ignore - Exemple avec Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "login", {
        user_id: userId,
        method: "email",
      });
    }

    console.log("📊 Analytics: User logged in", email);
  });

  // Logger les logouts
  authEvents.on("logout", ({ userId }) => {
    // @ts-ignore
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "logout", {
        user_id: userId,
      });
    }

    console.log("📊 Analytics: User logged out", userId);
  });

  // Suivre les problèmes de tokens
  authEvents.on("token_refresh", ({ success }) => {
    if (!success) {
      console.warn("⚠️ Token refresh failed - possible session issue");
    }
  });
}

// Exemple 2 : Hook React pour réagir aux événements
export function useAuthAnalytics() {
  useAuthEvent("login", ({ userId, email }) => {
    // Envoyer à votre service d'analytics
    console.log("User logged in:", userId, email);
  });

  useAuthEvent("logout", ({ userId }) => {
    console.log("User logged out:", userId);
    // Nettoyer les données locales, etc.
  });

  useAuthEvent("session_expired", ({ userId }) => {
    console.log("Session expired for:", userId);
    // Afficher une notification à l'utilisateur
  });
}

// Exemple 3 : Nettoyage au logout
export function setupLogoutCleanup() {
  authEvents.on("logout", () => {
    // Nettoyer le localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("draft_posts");
      localStorage.removeItem("preferences");
      // etc.
    }

    // Réinitialiser les caches
    console.log("🧹 Cleaned up user data");
  });
}

// Exemple 4 : Notifications de session
export function setupSessionNotifications() {
  authEvents.on("session_expired", ({ userId }) => {
    // Afficher une notification toast
    console.log("⏰ Session expired, redirecting to login...");

    // Vous pouvez utiliser votre système de notifications
    // showToast("Votre session a expiré", { type: "warning" });
  });
}
