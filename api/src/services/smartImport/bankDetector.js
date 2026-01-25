const bankMappings = require('../../config/bankMappings.json');
const logger = require('../../../logger');

/**
 * Calcule la similarité entre deux chaînes
 * Réutilise l'algo de columnDetector
 */
function stringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}

/**
 * Détecte la banque à partir des headers du fichier
 * @param {string[]} headers - En-têtes du fichier
 * @returns {{bank: Object|null, confidence: number}}
 */
function detectBank(headers) {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const scores = {};

  for (const bank of bankMappings.banks) {
    const bankHeaders = bank.patterns.headers.map(h => h.toLowerCase());

    let matchCount = 0;
    let totalSimilarity = 0;

    // Calculer le score de matching pour chaque header de la banque
    for (const bankHeader of bankHeaders) {
      const similarities = normalizedHeaders.map(h =>
        stringSimilarity(h, bankHeader)
      );
      const maxSimilarity = Math.max(...similarities);

      // Seuil de similarité: 0.75
      if (maxSimilarity > 0.75) {
        matchCount++;
        totalSimilarity += maxSimilarity;
      }
    }

    // Score = (headers matchés / total headers banque) × similarité moyenne
    const coverage = matchCount / bankHeaders.length;
    const avgSimilarity = matchCount > 0 ? totalSimilarity / matchCount : 0;
    scores[bank.id] = coverage * avgSimilarity;

    logger.debug(`[BankDetector] ${bank.name}: coverage=${(coverage * 100).toFixed(1)}%, avgSim=${(avgSimilarity * 100).toFixed(1)}%, score=${(scores[bank.id] * 100).toFixed(1)}%`);
  }

  // Trouver la meilleure correspondance
  const sortedBanks = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([id, score]) => ({
      bank: bankMappings.banks.find(b => b.id === id),
      confidence: score,
    }));

  const bestMatch = sortedBanks[0];

  // Seuil de confiance minimum: 0.5 (50%)
  if (bestMatch && bestMatch.confidence > 0.5) {
    logger.info(`[BankDetector] Banque détectée: ${bestMatch.bank.name} (confiance: ${(bestMatch.confidence * 100).toFixed(1)}%)`);
    return bestMatch;
  }

  logger.info('[BankDetector] Aucune banque détectée avec suffisamment de confiance');
  return { bank: null, confidence: 0 };
}

/**
 * Obtient la config d'une banque par ID
 * @param {string} bankId - ID de la banque
 * @returns {Object|null}
 */
function getBankConfig(bankId) {
  return bankMappings.banks.find(b => b.id === bankId) || null;
}

/**
 * Liste toutes les banques supportées
 * @returns {Array<{id: string, name: string}>}
 */
function getSupportedBanks() {
  return bankMappings.banks.map(b => ({
    id: b.id,
    name: b.name,
  }));
}

module.exports = {
  detectBank,
  getBankConfig,
  getSupportedBanks,
};
