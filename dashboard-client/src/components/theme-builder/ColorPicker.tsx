import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette } from 'lucide-react';

/**
 * Presets de couleurs par catégorie
 */
const COLOR_PRESETS = {
  Material: [
    '#f44336', // Red
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#673ab7', // Deep Purple
    '#3f51b5', // Indigo
    '#2196f3', // Blue
    '#03a9f4', // Light Blue
    '#00bcd4', // Cyan
    '#009688', // Teal
    '#4caf50', // Green
    '#8bc34a', // Light Green
    '#cddc39', // Lime
    '#ffeb3b', // Yellow
    '#ffc107', // Amber
    '#ff9800', // Orange
    '#ff5722', // Deep Orange
  ],
  Tailwind: [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#f59e0b', // amber-500
    '#eab308', // yellow-500
    '#84cc16', // lime-500
    '#22c55e', // green-500
    '#10b981', // emerald-500
    '#14b8a6', // teal-500
    '#06b6d4', // cyan-500
    '#0ea5e9', // sky-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#a855f7', // purple-500
    '#d946ef', // fuchsia-500
    '#ec4899', // pink-500
  ],
  Neutral: [
    '#ffffff', // white
    '#f8fafc', // slate-50
    '#e2e8f0', // slate-200
    '#cbd5e1', // slate-300
    '#94a3b8', // slate-400
    '#64748b', // slate-500
    '#475569', // slate-600
    '#334155', // slate-700
    '#1e293b', // slate-800
    '#0f172a', // slate-900
    '#000000', // black
  ],
};

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
}

/**
 * Composant ColorPicker avec react-colorful
 *
 * Features :
 * - Color picker visuel HexColorPicker
 * - Input texte hex avec validation
 * - Preview couleur sélectionnée
 * - Presets de couleurs (Material, Tailwind, Neutral)
 * - Dark mode complet
 */
export function ColorPicker({ label, value, onChange, presets }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [activePresetCategory, setActivePresetCategory] = useState<keyof typeof COLOR_PRESETS>('Material');

  const handleColorChange = (color: string) => {
    onChange(color.toUpperCase());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Validation hex basique
    if (/^#[0-9A-Fa-f]{0,6}$/.test(newValue)) {
      onChange(newValue.toUpperCase());
    }
  };

  const activePresets = presets || COLOR_PRESETS[activePresetCategory];

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Couleur actuelle + Input */}
      <div className="flex items-center gap-3">
        {/* Preview couleur */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="relative w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
          style={{ backgroundColor: value }}
          aria-label={`Changer ${label}`}
        >
          {showPicker && (
            <div className="absolute top-14 left-0 z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
              <HexColorPicker color={value} onChange={handleColorChange} />
            </div>
          )}
        </button>

        {/* Input hex */}
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="#3B82F6"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm uppercase"
          maxLength={7}
        />

        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Ouvrir color picker"
        >
          <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        {/* Onglets catégories presets */}
        {!presets && (
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {(Object.keys(COLOR_PRESETS) as Array<keyof typeof COLOR_PRESETS>).map((category) => (
              <button
                key={category}
                onClick={() => setActivePresetCategory(category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activePresetCategory === category
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Grille presets */}
        <div className="grid grid-cols-8 gap-2">
          {activePresets.map((preset) => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                value.toLowerCase() === preset.toLowerCase()
                  ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              style={{ backgroundColor: preset }}
              title={preset}
              aria-label={`Preset ${preset}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
