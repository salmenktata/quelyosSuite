"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log en développement
    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vitals] ${metric.name}:`, metric.value);
    }

    // En production, envoyer à analytics
    if (process.env.NODE_ENV === "production") {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
      });
      const url = "/api/analytics";

      // Utiliser sendBeacon si disponible (plus fiable lors du unload)
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          body,
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
        }).catch(() => {
          // Silently fail - analytics ne doit pas bloquer l'app
        });
      }
    }

    // Logging structuré pour monitoring
    const vitalsData = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
    };

    // Stockage local pour debug (dev uniquement)
    if (process.env.NODE_ENV === "development") {
      const vitals = JSON.parse(localStorage.getItem("webVitals") || "[]");
      vitals.push(vitalsData);
      // Garder max 50 entrées
      if (vitals.length > 50) vitals.shift();
      localStorage.setItem("webVitals", JSON.stringify(vitals));
    }
  });

  return null;
}
