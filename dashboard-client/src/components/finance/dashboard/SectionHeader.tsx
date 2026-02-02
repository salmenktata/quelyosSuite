

import { memo, useState, useEffect, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  storageKey?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Section Header Component
 * Features:
 * - Optional collapsible functionality
 * - Saves collapsed state to localStorage
 * - Icon support
 * - Subtitle support
 * - Glassmorphic divider
 */
export const SectionHeader = memo(function SectionHeader({
  title,
  subtitle,
  icon,
  collapsible = false,
  defaultCollapsed = false,
  storageKey,
  children,
  className = "",
}: SectionHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isClient, setIsClient] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    }
  }, [storageKey]);

  // Save collapsed state to localStorage
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (storageKey) {
      localStorage.setItem(storageKey, String(newState));
    }
  };

  return (
    <div className={className}>
      <div
        className={`flex items-center justify-between ${collapsible ? "cursor-pointer" : ""}`}
        onClick={collapsible ? handleToggle : undefined}
        role={collapsible ? "button" : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 backdrop-blur-xl">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>

        {collapsible && isClient && (
          <button
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
            aria-label={isCollapsed ? "Développer" : "Réduire"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Glassmorphic divider */}
      <div className="mt-4 mb-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Content */}
      {(!collapsible || !isCollapsed) && children}
    </div>
  );
});
