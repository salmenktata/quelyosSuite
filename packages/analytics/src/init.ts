/**
 * Initialisation du système Analytics
 */

import { getConfig } from "./config";
import { hasAnalyticsConsent } from "./consent";
import { initGA4, initPostHog, initMixpanel } from "./providers";

let isInitialized = false;

export function initializeAnalytics(): void {
  if (typeof window === "undefined") return;
  if (isInitialized) return;
  if (!hasAnalyticsConsent()) return;

  const config = getConfig();

  // Google Analytics 4
  if (config.ga4MeasurementId) {
    initGA4();
  }

  // PostHog
  if (config.posthogKey) {
    initPostHog();
  }

  // Mixpanel
  if (config.mixpanelToken) {
    initMixpanel();
  }

  isInitialized = true;

  if (config.debug) {
    console.log("[Analytics] Initialized with consent");
  }
}

export function isAnalyticsInitialized(): boolean {
  return isInitialized;
}
