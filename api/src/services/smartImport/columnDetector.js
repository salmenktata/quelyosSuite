const logger = require('../../../logger');

// Patterns de colonnes avec synonymes français
const COLUMN_PATTERNS = {
  date: {
    headers: [
      'date',
      "date d'opération",
      "date d'operation",
      'date opération',
      'date operation',
      'date valeur',
      'date comptable',
      'date effet',
      'dateop',
      'dateval',
      'completed date',
    ],
    validators: [
      (value) => /^\d{2}\/\d{2}\/\d{4}$/.test(value?.toString()), // DD/MM/YYYY
      (value) => /^\d{4}-\d{2}-\d{2}$/.test(value?.toString()),   // YYYY-MM-DD
      (value) => /^\d{2}-\d{2}-\d{4}$/.test(value?.toString()),   // DD-MM-YYYY
      (value) => /^\d{2}\.\d{2}\.\d{4}$/.test(value?.toString()), // DD.MM.YYYY
      (value) => !isNaN(Date.parse(value?.toString())),            // ISO format
    ],
    weight: 0.6, // 60% poids pour pattern matching
  },

  amount: {
    headers: [
      'montant',
      'amount',
      'valeur',
      'somme',
      'total',
    ],
    validators: [
      (value) => /^-?\d+[,.]?\d*$/.test(value?.toString()),
      (value) => !isNaN(parseFloat(value?.toString().replace(',', '.'))),
    ],
    weight: 0.6,
  },

  debit: {
    headers: [
      'débit',
      'debit',
      'retrait',
      'sortie',
      'dépense',
      'depense',
    ],
    validators: [
      (value) => /^\d+[,.]?\d*$/.test(value?.toString()) || value === '' || !value,
      (value) => {
        const num = parseFloat(value?.toString().replace(',', '.'));
        return !isNaN(num) && num >= 0 || !value;
      },
    ],
    weight: 0.6,
  },

  credit: {
    headers: [
      'crédit',
      'credit',
      'dépôt',
      'depot',
      'entrée',
      'entree',
      'recette',
    ],
    validators: [
      (value) => /^\d+[,.]?\d*$/.test(value?.toString()) || value === '' || !value,
      (value) => {
        const num = parseFloat(value?.toString().replace(',', '.'));
        return !isNaN(num) && num >= 0 || !value;
      },
    ],
    weight: 0.6,
  },

  description: {
    headers: [
      'libellé',
      'libelle',
      'description',
      'motif',
      'détails',
      'details',
      'opération',
      'operation',
      'complément',
      'complement',
      'label',
      'payee',
    ],
    validators: [
      (value) => typeof value === 'string' && value.length > 0,
      (value) => value !== null && value !== undefined,
    ],
    weight: 0.5, // Moins important car très variable
  },

  balance: {
    headers: [
      'solde',
      'balance',
      'solde final',
      'nouveau solde',
    ],
    validators: [
      (value) => /^-?\d+[,.]?\d*$/.test(value?.toString()),
      (value) => !isNaN(parseFloat(value?.toString().replace(',', '.'))),
    ],
    weight: 0.5,
  },

  type: {
    headers: [
      'type',
      'sens',
      'débit/crédit',
      'debit/credit',
      'nature',
    ],
    validators: [
      (value) => ['debit', 'crédit', 'credit', 'débit', 'd', 'c', '+', '-'].includes(value?.toString().toLowerCase()),
    ],
    weight: 0.7,
  },

  category: {
    headers: [
      'catégorie',
      'categorie',
      'category',
      'type opération',
      'type operation',
    ],
    validators: [
      (value) => typeof value === 'string' && value.length > 0,
    ],
    weight: 0.4,
  },
};

/**
 * Calcule la similarité entre deux chaînes (Levenshtein simplifié)
 * @param {string} str1
 * @param {string} str2
 * @returns {number} Score de 0 à 1
 */
function stringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return 1.0;

  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Levenshtein distance simplifié
  const len1 = s1.length;
  const len2 = s2.length;

  // Matrice de distance
  const matrix = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);

  return 1 - (distance / maxLen);
}

/**
 * Détecte les mappings de colonnes avec heuristiques
 * @param {string[]} headers - En-têtes du fichier
 * @param {Object[]} rows - Lignes de données (sample)
 * @returns {Object} Mappings détectés avec scores de confiance
 */
function detectColumns(headers, rows) {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const mappings = {};
  const confidenceScores = {};

  // Nombre de lignes pour échantillon (max 20 pour performance)
  const sampleSize = Math.min(20, rows.length);
  const samples = rows.slice(0, sampleSize);

  // Stage 1: Header Pattern Matching (60% weight)
  for (const [fieldName, config] of Object.entries(COLUMN_PATTERNS)) {
    let bestMatch = null;
    let bestScore = 0;

    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];

      // Exact match
      if (config.headers.includes(header)) {
        bestMatch = i;
        bestScore = 1.0;
        break;
      }

      // Fuzzy match
      for (const pattern of config.headers) {
        const similarity = stringSimilarity(header, pattern);
        if (similarity > 0.7 && similarity > bestScore) {
          bestMatch = i;
          bestScore = similarity;
        }
      }
    }

    if (bestMatch !== null) {
      const headerConfidence = bestScore * config.weight;

      mappings[fieldName] = {
        columnIndex: bestMatch,
        headerName: headers[bestMatch],
        confidence: headerConfidence,
      };

      confidenceScores[fieldName] = headerConfidence;
    }
  }

  // Stage 2: Statistical Data Analysis (30% weight)
  for (const [fieldName, mapping] of Object.entries(mappings)) {
    const columnData = samples.map(row => Object.values(row)[mapping.columnIndex]);
    const validators = COLUMN_PATTERNS[fieldName]?.validators || [];

    // Calculer le taux de validation
    const validCount = columnData.filter(value =>
      validators.some(validator => {
        try {
          return validator(value);
        } catch {
          return false;
        }
      })
    ).length;

    const validationScore = validCount / sampleSize;

    // Combiner scores (60% header + 30% validation)
    mapping.confidence += validationScore * 0.3;

    // Pénalité pour cellules vides
    const emptyCount = columnData.filter(v => !v || v === '').length;
    const emptyRatio = emptyCount / sampleSize;
    mapping.confidence *= (1 - emptyRatio * 0.5); // Réduit confiance si beaucoup de vides

    confidenceScores[fieldName] = mapping.confidence;
  }

  // Calculer confiance globale
  const scores = Object.values(confidenceScores);
  const overallConfidence = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  // Retirer mappings avec confiance trop faible (<40%)
  const filteredMappings = {};
  for (const [fieldName, mapping] of Object.entries(mappings)) {
    if (mapping.confidence >= 0.4) {
      filteredMappings[fieldName] = mapping;
    } else {
      logger.debug(`[ColumnDetector] Rejected low confidence mapping: ${fieldName} (${(mapping.confidence * 100).toFixed(1)}%)`);
    }
  }

  logger.info(`[ColumnDetector] Detected ${Object.keys(filteredMappings).length} columns with ${(overallConfidence * 100).toFixed(1)}% overall confidence`);

  return {
    mappings: filteredMappings,
    confidenceScores,
    overallConfidence,
  };
}

/**
 * Vérifie que les champs requis sont mappés
 * @param {Object} mappings
 * @returns {{valid: boolean, missing: string[]}}
 */
function validateRequiredFields(mappings) {
  const required = ['date', 'description'];
  // amount OU (debit + credit) requis
  const hasAmount = mappings.amount || (mappings.debit && mappings.credit);

  const missing = [];
  for (const field of required) {
    if (!mappings[field]) {
      missing.push(field);
    }
  }

  if (!hasAmount) {
    missing.push('amount ou (debit + credit)');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

module.exports = {
  detectColumns,
  validateRequiredFields,
  COLUMN_PATTERNS,
};
