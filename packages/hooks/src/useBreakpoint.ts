/**
 * Hook pour détecter si on est sur mobile/tablet/desktop
 */

"use client";

import { useState, useEffect } from "react";

type BreakpointType = "mobile" | "tablet" | "desktop";

interface Breakpoint {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  type: BreakpointType;
  width: number;
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    type: "desktop",
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleResize() {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      let type: BreakpointType = "desktop";
      if (isMobile) type = "mobile";
      else if (isTablet) type = "tablet";

      setBreakpoint({
        isMobile,
        isTablet,
        isDesktop,
        type,
        width,
      });
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
}
