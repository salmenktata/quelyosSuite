/**
 * Identification des utilisateurs
 */

import { setUserId as setStorageUserId } from "./storage";
import { hasAnalyticsConsent } from "./consent";
import { getConfig } from "./config";
import type { UserProperties } from "./types";

export function identifyUser(properties: UserProperties): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  const config = getConfig();

  if (properties.userId) {
    setStorageUserId(properties.userId);
  }

  // GA4 user properties
  if (window.gtag) {
    window.gtag("set", "user_properties", {
      user_id: properties.userId,
      plan: properties.plan,
      sector: properties.sector,
    });
  }

  if (config.debug) {
    console.log("[Analytics] User identified:", properties);
  }
}
