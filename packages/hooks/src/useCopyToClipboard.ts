/**
 * Hook pour copier dans le presse-papier
 */

"use client";

import { useState, useCallback } from "react";

interface CopyStatus {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  reset: () => void;
}

export function useCopyToClipboard(timeout: number = 2000): CopyStatus {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      if (!navigator?.clipboard) {
        console.warn("Clipboard not supported");
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      } catch (error) {
        console.warn("Copy failed", error);
        setCopied(false);
      }
    },
    [timeout]
  );

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  return { copied, copy, reset };
}
