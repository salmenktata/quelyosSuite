/**
 * Theme System - Quelyos Suite
 * Système de thèmes light/dark avec support responsive
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type DeviceType = "desktop" | "mobile";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  deviceType: DeviceType;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "quelyos-theme";
const STORAGE_DEVICE_KEY = "quelyos-device-preference";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  enableDeviceDetection?: boolean;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  enableDeviceDetection = true,
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (
      stored &&
      (stored === "light" || stored === "dark" || stored === "system")
    ) {
      setThemeState(stored as Theme);
    }
    setMounted(true);
  }, [storageKey]);

  // Resolve system theme
  useEffect(() => {
    if (!enableSystem || theme !== "system" || !mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setResolvedTheme(mediaQuery.matches ? "dark" : "light");
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, enableSystem, mounted]);

  // Apply theme to DOM
  useEffect(() => {
    if (!mounted) return;

    const effectiveTheme = theme === "system" ? resolvedTheme : theme;
    setResolvedTheme(effectiveTheme);

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);
    root.style.colorScheme = effectiveTheme;
  }, [theme, resolvedTheme, mounted]);

  // Device detection
  useEffect(() => {
    if (!enableDeviceDetection || !mounted) return;

    const checkDevice = () => {
      const isMobile = window.innerWidth < 768;
      const newDeviceType: DeviceType = isMobile ? "mobile" : "desktop";
      setDeviceType(newDeviceType);

      // Save preference
      localStorage.setItem(STORAGE_DEVICE_KEY, newDeviceType);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, [enableDeviceDetection, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  const toggleTheme = () => {
    const current = theme === "system" ? resolvedTheme : theme;
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
  };

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    deviceType,
    setTheme,
    toggleTheme,
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Helper components
export function ThemeToggle() {
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

export function DeviceIndicator() {
  const { deviceType } = useTheme();

  return (
    <div className="text-sm text-gray-500">
      {deviceType === "mobile" ? "📱 Mobile" : "🖥️ Desktop"}
    </div>
  );
}
