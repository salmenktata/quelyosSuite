/**
 * Tracking des events Analytics
 */

import { getConfig } from "./config";
import { hasAnalyticsConsent } from "./consent";
import { getSessionId, getUserId } from "./storage";
import type { AnalyticsEvent } from "./types";

async function sendToBackend(event: AnalyticsEvent): Promise<void> {
  const config = getConfig();

  try {
    await fetch(config.customEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {
    if (config.debug) {
      console.warn("[Analytics] Failed to send event to backend");
    }
  }
}

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  const config = getConfig();

  const enrichedEvent: AnalyticsEvent = {
    ...event,
    timestamp: event.timestamp || Date.now(),
    sessionId: event.sessionId || getSessionId(),
    userId: event.userId || getUserId() || undefined,
  };

  // Debug log
  if (config.debug) {
    console.log("[Analytics] Event:", enrichedEvent);
  }

  // GA4
  if (window.gtag) {
    window.gtag("event", event.name, {
      event_category: event.category,
      ...event.properties,
    });
  }

  // Custom backend
  sendToBackend(enrichedEvent);
}

export function trackPageView(path: string, title?: string): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  // GA4
  if (window.gtag) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }

  trackEvent({
    name: "page_view",
    category: "navigation",
    properties: {
      path,
      title: title || document.title,
      referrer: document.referrer,
    },
  });
}
