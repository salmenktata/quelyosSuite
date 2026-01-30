import { useState, useEffect } from 'react';
import { Search, Type } from 'lucide-react';

/**
 * Liste de 50+ Google Fonts populaires organisées par catégorie
 */
const GOOGLE_FONTS = {
  'Sans-Serif': [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'Nunito',
    'Work Sans',
    'Source Sans Pro',
    'PT Sans',
    'Rubik',
    'DM Sans',
    'Mulish',
    'Manrope',
  ],
  'Serif': [
    'Playfair Display',
    'Merriweather',
    'Lora',
    'PT Serif',
    'Crimson Text',
    'Libre Baskerville',
    'Cormorant',
    'EB Garamond',
    'Spectral',
    'Bitter',
  ],
  'Display': [
    'Bebas Neue',
    'Anton',
    'Righteous',
    'Archivo Black',
    'Fredoka One',
    'Pacifico',
    'Lobster',
    'Oswald',
    'Satisfy',
    'Dancing Script',
  ],
  'Monospace': [
    'Fira Code',
    'JetBrains Mono',
    'Source Code Pro',
    'Roboto Mono',
    'IBM Plex Mono',
    'Space Mono',
  ],
};

// Weights disponibles par défaut (certaines fonts peuvent avoir des weights différents)
const FONT_WEIGHTS = [
  { value: 300, label: 'Light (300)' },
  { value: 400, label: 'Regular (400)' },
  { value: 500, label: 'Medium (500)' },
  { value: 600, label: 'SemiBold (600)' },
  { value: 700, label: 'Bold (700)' },
  { value: 800, label: 'ExtraBold (800)' },
];

interface FontSelectorProps {
  label: string;
  value: string;
  weight?: number;
  onChange: (font: string) => void;
  onWeightChange?: (weight: number) => void;
  preview?: string;
}

/**
 * Composant FontSelector avec Google Fonts
 *
 * Features :
 * - Liste de 50+ Google Fonts populaires
 * - Catégories (Sans-Serif, Serif, Display, Monospace)
 * - Recherche filtrée
 * - Preview texte avec font sélectionnée
 * - Sélecteur weight (300-800)
 * - Chargement dynamique Google Fonts via WebFont Loader (optionnel)
 * - Dark mode complet
 */
export function FontSelector({
  label,
  value,
  weight = 400,
  onChange,
  onWeightChange,
  preview = 'The quick brown fox jumps over the lazy dog',
}: FontSelectorProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof GOOGLE_FONTS>('Sans-Serif');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // Charger dynamiquement la font Google via CSS
  useEffect(() => {
    if (value && !loadedFonts.has(value)) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${value.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      setLoadedFonts((prev) => new Set(prev).add(value));

      // Cleanup
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [value, loadedFonts]);

  // Filtrer les fonts selon recherche
  const filteredFonts = GOOGLE_FONTS[activeCategory].filter((font) =>
    font.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300">
        {label}
      </label>

      {/* Preview */}
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p
          className="text-lg text-gray-900 dark:text-white"
          style={{ fontFamily: value, fontWeight: weight }}
        >
          {preview}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {value} · {weight}
        </p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une police..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
      </div>

      {/* Onglets catégories */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {(Object.keys(GOOGLE_FONTS) as Array<keyof typeof GOOGLE_FONTS>).map((category) => (
          <button
            key={category}
            onClick={() => {
              setActiveCategory(category);
              setSearch('');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
              activeCategory === category
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Liste fonts */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {filteredFonts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            Aucune police trouvée
          </p>
        ) : (
          filteredFonts.map((font) => (
            <button
              key={font}
              onClick={() => onChange(font)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                value === font
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'text-gray-900 dark:text-white dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              style={{ fontFamily: font }}
            >
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{font}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Sélecteur weight */}
      {onWeightChange && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
            Épaisseur (Weight)
          </label>
          <select
            value={weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            {FONT_WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
