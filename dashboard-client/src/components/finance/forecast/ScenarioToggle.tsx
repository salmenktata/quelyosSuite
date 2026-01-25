"use client";

type ScenarioToggleProps = {
  scenarios: {
    optimistic: boolean;
    realistic: boolean;
    pessimistic: boolean;
  };
  onChange: (scenarios: {
    optimistic: boolean;
    realistic: boolean;
    pessimistic: boolean;
  }) => void;
};

export function ScenarioToggle({ scenarios, onChange }: ScenarioToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() =>
          onChange({ ...scenarios, optimistic: !scenarios.optimistic })
        }
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          scenarios.optimistic
            ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500 shadow-sm"
            : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
        }`}
      >
        <span className="flex items-center gap-1.5">
          {scenarios.optimistic && <span>✓</span>}
          <span>Optimiste (+15%)</span>
        </span>
      </button>

      <button
        disabled
        className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 border-2 border-indigo-500 cursor-not-allowed shadow-sm"
      >
        <span className="flex items-center gap-1.5">
          <span>✓</span>
          <span>Réaliste (baseline)</span>
        </span>
      </button>

      <button
        onClick={() =>
          onChange({ ...scenarios, pessimistic: !scenarios.pessimistic })
        }
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          scenarios.pessimistic
            ? "bg-rose-100 text-rose-700 border-2 border-rose-500 shadow-sm"
            : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
        }`}
      >
        <span className="flex items-center gap-1.5">
          {scenarios.pessimistic && <span>✓</span>}
          <span>Pessimiste (-15%)</span>
        </span>
      </button>
    </div>
  );
}
