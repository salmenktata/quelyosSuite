/**
 * Responsive utilities pour adapter les composants au device
 */

"use client";

import { useEffect, useState } from "react";

export type DeviceBreakpoint = "mobile" | "tablet" | "desktop";

interface UseResponsiveResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: DeviceBreakpoint;
  width: number;
}

export function useResponsive(): UseResponsiveResult {
  const [state, setState] = useState<UseResponsiveResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: "desktop",
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      let breakpoint: DeviceBreakpoint = "desktop";
      if (isMobile) breakpoint = "mobile";
      else if (isTablet) breakpoint = "tablet";

      setState({
        isMobile,
        isTablet,
        isDesktop,
        breakpoint,
        width,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}

// Helper pour des composants conditionnels
export function MobileOnly({ children }: { children: React.ReactNode }) {
  const { isMobile } = useResponsive();
  return isMobile ? <>{children}</> : null;
}

export function TabletOnly({ children }: { children: React.ReactNode }) {
  const { isTablet } = useResponsive();
  return isTablet ? <>{children}</> : null;
}

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useResponsive();
  return isDesktop ? <>{children}</> : null;
}

export function MobileAndTablet({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useResponsive();
  return !isDesktop ? <>{children}</> : null;
}

export function TabletAndDesktop({ children }: { children: React.ReactNode }) {
  const { isMobile } = useResponsive();
  return !isMobile ? <>{children}</> : null;
}
