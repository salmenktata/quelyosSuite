import { Calendar } from "lucide-react";
import { GlassPanel } from '@quelyos/ui/glass';
import { HORIZONS, type Horizon } from "@/types/forecast";

interface HorizonSelectorProps {
  selectedDays: Horizon;
  onSelect: (days: Horizon) => void;
}

export function HorizonSelector({ selectedDays, onSelect }: HorizonSelectorProps) {
  return (
    <GlassPanel gradient="indigo" className="flex flex-wrap gap-2 p-4" data-guide="forecast-horizon">
      <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-200">
        <Calendar size={16} />
        Horizon :
      </div>
      {HORIZONS.map((d) => (
        <button
          key={d}
          onClick={() => onSelect(d)}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            selectedDays === d
              ? "border-indigo-400 bg-indigo-100 dark:bg-white/20 text-indigo-700 dark:text-white shadow-lg"
              : "border-indigo-200 dark:border-white/10 bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-100 hover:border-indigo-300 dark:hover:border-white/20 hover:bg-indigo-100 dark:hover:bg-white/10"
          }`}
        >
          {d} jours
        </button>
      ))}
    </GlassPanel>
  );
}
