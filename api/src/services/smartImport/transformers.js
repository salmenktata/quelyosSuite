const { parse, format } = require('date-fns');
const { fr } = require('date-fns/locale');
const logger = require('../../../logger');

/**
 * Parse une date depuis différents formats
 * @param {string} value - Valeur de la date
 * @param {string} formatHint - Format suggéré (optionnel)
 * @returns {string|null} Date au format ISO (YYYY-MM-DD) ou null
 */
function parseDate(value, formatHint) {
  if (!value || value === '') return null;

  const valueStr = value.toString().trim();

  // Formats à essayer (ordre de priorité)
  const formats = formatHint ? [formatHint] : [];
  formats.push(
    'dd/MM/yyyy',
    'dd-MM-yyyy',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd.MM.yyyy',
    'd/M/yyyy',
    'yyyy/MM/dd',
    'dd/MM/yy',
    'yyyy-MM-dd HH:mm:ss',
  );

  // Essayer chaque format
  for (const fmt of formats) {
    try {
      const parsed = parse(valueStr, fmt, new Date(), { locale: fr });
      if (!isNaN(parsed.getTime())) {
        // Validation: date raisonnable (1900-2100)
        const year = parsed.getFullYear();
        if (year >= 1900 && year <= 2100) {
          return format(parsed, 'yyyy-MM-dd');
        }
      }
    } catch {
      continue;
    }
  }

  // Fallback: parsing natif JavaScript
  try {
    const nativeDate = new Date(valueStr);
    if (!isNaN(nativeDate.getTime())) {
      const year = nativeDate.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return format(nativeDate, 'yyyy-MM-dd');
      }
    }
  } catch {
    // Ignore
  }

  logger.debug(`[Transformers] Unable to parse date: "${valueStr}"`);
  return null;
}

/**
 * Parse un montant depuis différents formats
 * @param {string|number} value - Valeur du montant
 * @param {string} separator - Séparateur décimal (',' ou '.')
 * @returns {number|null} Montant numérique ou null
 */
function parseAmount(value, separator = ',') {
  if (value === null || value === undefined || value === '') return null;

  const str = value.toString().trim();

  // Gestion parenthèses pour montants négatifs (format comptable)
  const isNegative = str.startsWith('(') && str.endsWith(')');
  let cleaned = isNegative ? str.slice(1, -1) : str;

  // Retirer symboles monétaires et espaces
  cleaned = cleaned.replace(/[€$£\s]/g, '');

  // Gestion séparateurs selon format banque
  if (separator === ',') {
    // Format français: 1.234,56 → 1234.56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Format anglais: 1,234.56 → 1234.56
    cleaned = cleaned.replace(/,/g, '');
  }

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    logger.debug(`[Transformers] Unable to parse amount: "${str}"`);
    return null;
  }

  return isNegative ? -parsed : parsed;
}

/**
 * Transforme une ligne selon les mappings et la config banque
 * @param {Object} row - Ligne brute du fichier
 * @param {Object} mappings - Mappings colonnes détectées
 * @param {Object} bankConfig - Configuration banque (optionnel)
 * @returns {Object} Ligne transformée
 */
function transformRow(row, mappings, bankConfig) {
  const transformed = {};

  try {
    // Transform date
    if (mappings.date && mappings.date.headerName) {
      const rawDate = row[mappings.date.headerName];
      transformed.date = parseDate(
        rawDate,
        bankConfig?.patterns?.dateFormat
      );
    }

    // Transform amount (gestion colonnes séparées débit/crédit)
    if (mappings.debit && mappings.credit) {
      // Certaines banques ont 2 colonnes: Débit et Crédit
      const debitValue = row[mappings.debit.headerName];
      const creditValue = row[mappings.credit.headerName];

      const debit = parseAmount(debitValue, bankConfig?.patterns?.amountSeparator);
      const credit = parseAmount(creditValue, bankConfig?.patterns?.amountSeparator);

      if (debit && debit > 0) {
        transformed.amount = debit;
        transformed.type = 'debit';
      } else if (credit && credit > 0) {
        transformed.amount = credit;
        transformed.type = 'credit';
      } else {
        // Aucun montant valide
        transformed.amount = null;
        transformed.type = null;
      }

    } else if (mappings.amount && mappings.amount.headerName) {
      // Colonne montant unique
      const rawAmount = row[mappings.amount.headerName];
      const amount = parseAmount(rawAmount, bankConfig?.patterns?.amountSeparator);

      if (amount !== null) {
        transformed.amount = Math.abs(amount);
        transformed.type = amount < 0 ? 'debit' : 'credit';
      } else {
        transformed.amount = null;
        transformed.type = null;
      }
    }

    // Transform description
    if (mappings.description) {
      if (Array.isArray(bankConfig?.columnMapping?.description)) {
        // Concaténer plusieurs colonnes de description
        transformed.description = bankConfig.columnMapping.description
          .map(col => row[col])
          .filter(Boolean)
          .join(' - ')
          .trim();
      } else if (mappings.description.headerName) {
        transformed.description = row[mappings.description.headerName]
          ?.toString()
          .trim() || '';
      }

      // Nettoyer description
      if (transformed.description) {
        // Limiter longueur
        if (transformed.description.length > 255) {
          transformed.description = transformed.description.substring(0, 252) + '...';
        }
      }
    }

    // Transform account (optionnel)
    if (mappings.account && mappings.account.headerName) {
      transformed.accountName = row[mappings.account.headerName]
        ?.toString()
        .trim();
    }

    // Transform category (optionnel)
    if (mappings.category && mappings.category.headerName) {
      transformed.categoryName = row[mappings.category.headerName]
        ?.toString()
        .trim();
    }

    // Transform balance (optionnel, pour information)
    if (mappings.balance && mappings.balance.headerName) {
      const rawBalance = row[mappings.balance.headerName];
      transformed.balance = parseAmount(rawBalance, bankConfig?.patterns?.amountSeparator);
    }

  } catch (err) {
    logger.error('[Transformers] Error transforming row:', err, { row });
    throw new Error(`Erreur transformation ligne: ${err.message}`);
  }

  return transformed;
}

/**
 * Détecte le type de transaction depuis une colonne dédiée
 * @param {string} value - Valeur de la colonne type
 * @returns {'debit'|'credit'|null}
 */
function normalizeType(value) {
  if (!value) return null;

  const normalized = value.toString().toLowerCase().trim();

  // Variations débit
  if (['debit', 'débit', 'd', '-', 'retrait', 'sortie'].includes(normalized)) {
    return 'debit';
  }

  // Variations crédit
  if (['credit', 'crédit', 'c', '+', 'dépôt', 'depot', 'entrée', 'entree'].includes(normalized)) {
    return 'credit';
  }

  return null;
}

module.exports = {
  parseDate,
  parseAmount,
  transformRow,
  normalizeType,
};
