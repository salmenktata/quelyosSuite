/**
 * Hook pour détecter le scroll
 */

"use client";

import { useState, useEffect } from "react";

interface ScrollPosition {
  x: number;
  y: number;
}

export function useScroll(): ScrollPosition {
  const [scroll, setScroll] = useState<ScrollPosition>({
    x: typeof window !== "undefined" ? window.scrollX : 0,
    y: typeof window !== "undefined" ? window.scrollY : 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setScroll({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scroll;
}
