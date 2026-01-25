/**
 * Types pour le système Analytics Quelyos
 */

export type EventCategory =
  | "funnel"
  | "engagement"
  | "conversion"
  | "navigation"
  | "feature"
  | "error";

export type FunnelStep =
  | "visit_landing"
  | "view_pricing"
  | "click_signup"
  | "start_registration"
  | "complete_registration"
  | "verify_email"
  | "start_onboarding"
  | "complete_onboarding"
  | "first_transaction"
  | "first_budget"
  | "activation"
  | "view_upgrade"
  | "start_trial"
  | "convert_pro"
  | "convert_expert";

export interface AnalyticsEvent {
  name: string;
  category: EventCategory;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  plan?: "free" | "pro" | "expert";
  signupDate?: string;
  company?: string;
  sector?: string;
  source?: string;
  campaign?: string;
}

export interface ABTestVariant {
  testId: string;
  variant: string;
  metadata?: Record<string, unknown>;
}

export interface ABTest {
  id: string;
  name: string;
  variants: string[];
  weights?: number[];
}

export interface FunnelState {
  currentStep: FunnelStep | null;
  maxStepIndex: number;
  steps: Array<{ step: FunnelStep; timestamp: number }>;
}

export interface AnalyticsConfig {
  ga4MeasurementId?: string;
  posthogKey?: string;
  mixpanelToken?: string;
  debug?: boolean;
  requireConsent?: boolean;
  customEndpoint?: string;
}

export type ConsentStatus = "granted" | "denied" | "pending";

// Déclarations globales
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
