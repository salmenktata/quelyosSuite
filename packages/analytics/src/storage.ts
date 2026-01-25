/**
 * Gestion du stockage local pour Analytics
 */

export const STORAGE_KEYS = {
  SESSION_ID: "quelyos_session_id",
  USER_ID: "quelyos_user_id",
  CONSENT: "quelyos_analytics_consent",
  AB_TESTS: "quelyos_ab_tests",
  FUNNEL_STATE: "quelyos_funnel_state",
} as const;

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.USER_ID);
}

export function setUserId(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
}

export function getConsent(): boolean | null {
  if (typeof window === "undefined") return null;
  const consent = localStorage.getItem(STORAGE_KEYS.CONSENT);
  if (consent === null) return null;
  return consent === "true";
}

export function setConsent(consent: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CONSENT, consent.toString());
}

export function getABTests(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(STORAGE_KEYS.AB_TESTS);
  return stored ? JSON.parse(stored) : {};
}

export function setABTests(tests: Record<string, string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.AB_TESTS, JSON.stringify(tests));
}
