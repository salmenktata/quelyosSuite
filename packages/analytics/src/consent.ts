/**
 * Gestion du consentement RGPD
 */

import { getConfig } from "./config";
import { getConsent, setConsent as setStorageConsent } from "./storage";
import { initializeAnalytics } from "./init";
import type { ConsentStatus } from "./types";

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  if (!getConfig().requireConsent) return true;
  return getConsent() === true;
}

export function setAnalyticsConsent(consent: boolean): void {
  if (typeof window === "undefined") return;

  setStorageConsent(consent);

  if (consent) {
    initializeAnalytics();
  }
}

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return "pending";
  const consent = getConsent();
  if (consent === true) return "granted";
  if (consent === false) return "denied";
  return "pending";
}
