/**
 * Utilitaire de conversion des index de couleur système
 * Le backend utilise des index de couleur (0-11) pour les types de congé, etc.
 */

// Palette de couleurs système (index 0-11)
const COLOR_PALETTE: Record<number, string> = {
  0: '#FFFFFF',   // White
  1: '#F06050',   // Red
  2: '#F4A460',   // Orange
  3: '#F7CD1F',   // Yellow
  4: '#6CC1ED',   // Light Blue
  5: '#814968',   // Purple
  6: '#EB7E7F',   // Pink
  7: '#2C8397',   // Teal
  8: '#475577',   // Dark Blue
  9: '#D6145F',   // Magenta
  10: '#30C381',  // Green
  11: '#9365B8',  // Violet
}

/**
 * Convertit un index de couleur en couleur hexadécimale
 */
export function colorIndexToHex(colorIndex: number | string | undefined | null, defaultColor = '#6b7280'): string {
  if (colorIndex === undefined || colorIndex === null) {
    return defaultColor
  }

  if (typeof colorIndex === 'string') {
    // Déjà une chaîne (probablement une couleur hex ou nommée)
    return colorIndex
  }

  return COLOR_PALETTE[colorIndex] ?? defaultColor
}
