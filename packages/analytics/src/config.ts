/**
 * Configuration Analytics
 */

import type { AnalyticsConfig } from "./types";

export const DEFAULT_CONFIG: Required<AnalyticsConfig> = {
  ga4MeasurementId: "",
  posthogKey: "",
  mixpanelToken: "",
  debug: false,
  requireConsent: true,
  customEndpoint: "/api/analytics",
};

let config: Required<AnalyticsConfig> = { ...DEFAULT_CONFIG };

export function getConfig(): Required<AnalyticsConfig> {
  return config;
}

export function setConfig(newConfig: Partial<AnalyticsConfig>): void {
  config = {
    ...config,
    ...newConfig,
  };
}

export function resetConfig(): void {
  config = { ...DEFAULT_CONFIG };
}
