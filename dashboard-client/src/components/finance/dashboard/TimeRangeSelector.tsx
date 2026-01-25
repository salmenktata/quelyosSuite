

import { memo, useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

export type TimeRange = 7 | 30 | 90 | 365;

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  storageKey?: string;
  className?: string;
}

/**
 * Time Range Selector Component
 * Features:
 * - Switch between 7, 30, 90, 365 days
 * - Stores preference in localStorage
 * - Glassmorphic button design
 * - Smooth transitions
 * - Keyboard navigation support
 */
export const TimeRangeSelector = memo(function TimeRangeSelector({
  value,
  onChange,
  storageKey = "dashboard-time-range",
  className = "",
}: TimeRangeSelectorProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(value);
  const [isClient, setIsClient] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if ([7, 30, 90, 365].includes(parsed)) {
          setSelectedRange(parsed as TimeRange);
          onChange(parsed as TimeRange);
        }
      }
    }
  }, [storageKey, onChange]);

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    onChange(range);
    if (storageKey) {
      localStorage.setItem(storageKey, String(range));
    }
  };

  const ranges: Array<{ value: TimeRange; label: string; shortLabel: string }> = [
    { value: 7, label: "7 jours", shortLabel: "7j" },
    { value: 30, label: "30 jours", shortLabel: "30j" },
    { value: 90, label: "90 jours", shortLabel: "90j" },
    { value: 365, label: "1 an", shortLabel: "1a" },
  ];

  if (!isClient) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Période:</span>
      </div>

      <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
        {ranges.map((range) => {
          const isActive = selectedRange === range.value;
          return (
            <button
              key={range.value}
              onClick={() => handleRangeChange(range.value)}
              className={`
                relative rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-gradient-to-br from-violet-500/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/20"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }
              `}
              aria-pressed={isActive}
              aria-label={`Afficher ${range.label}`}
            >
              {/* Show short label on mobile, full label on desktop */}
              <span className="hidden sm:inline">{range.label}</span>
              <span className="inline sm:hidden">{range.shortLabel}</span>

              {/* Active indicator glow */}
              {isActive && (
                <div className="absolute inset-0 -z-10 animate-pulse rounded-md bg-gradient-to-br from-violet-500/20 to-indigo-600/20 blur-md" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
