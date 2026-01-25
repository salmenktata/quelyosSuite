/**
 * Hook React pour Analytics
 */

"use client";

import { useEffect } from "react";
import { trackPageView } from "./tracking";
import { usePathname } from "next/navigation";

/**
 * Hook pour tracker automatiquement les changements de page
 */
export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);
}
