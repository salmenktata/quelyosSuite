

import { memo } from "react";
import { GitCompareArrows } from "lucide-react";

interface ComparisonToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

/**
 * Comparison Mode Toggle
 * Features:
 * - Toggle comparison with previous period
 * - Glassmorphic button design
 * - Visual indicator when active
 */
export const ComparisonToggle = memo(function ComparisonToggle({
  enabled,
  onChange,
  className = "",
}: ComparisonToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 backdrop-blur-xl
        ${
          enabled
            ? "border-violet-500/50 bg-violet-500/10 text-violet-400 shadow-lg shadow-violet-500/20"
            : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
        }
        ${className}
      `}
      aria-pressed={enabled}
      aria-label="Activer/désactiver le mode comparaison"
    >
      <GitCompareArrows className="h-4 w-4" />
      <span className="hidden sm:inline">Comparer</span>

      {/* Active indicator glow */}
      {enabled && (
        <div className="absolute inset-0 -z-10 animate-pulse rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-600/20 blur-md" />
      )}
    </button>
  );
});
