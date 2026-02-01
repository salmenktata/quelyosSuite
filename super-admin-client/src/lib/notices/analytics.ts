/**
 * Analytics & Feedback pour Notices
 * Système léger de tracking utilisation notices (localStorage + API optionnelle)
 */

import { logger } from '@/lib/logger';

export interface NoticeAnalytics {
  pageId: string;
  views: number;
  expansions: number;
  collapses: number;
  feedbackPositive: number;
  feedbackNegative: number;
  lastViewed: string;
  avgTimeExpanded?: number; // Secondes moyennes en mode expanded
}

export interface NoticeFeedback {
  pageId: string;
  isHelpful: boolean;
  timestamp: string;
  comment?: string; // Optionnel pour version future
}

const STORAGE_KEY_PREFIX = 'quelyos_notice_analytics_';
const STORAGE_KEY_FEEDBACK = 'quelyos_notice_feedback_';

/**
 * Enregistre une vue de notice
 */
export function trackNoticeView(pageId: string): void {
  try {
    const analytics = getNoticeAnalytics(pageId);
    analytics.views++;
    analytics.lastViewed = new Date().toISOString();
    saveNoticeAnalytics(pageId, analytics);
  } catch (error) {
    logger.error('Failed to track notice view:', error);
  }
}

/**
 * Enregistre une expansion (dépliage) de notice
 */
export function trackNoticeExpansion(pageId: string): void {
  try {
    const analytics = getNoticeAnalytics(pageId);
    analytics.expansions++;
    saveNoticeAnalytics(pageId, analytics);
  } catch (error) {
    logger.error('Failed to track notice expansion:', error);
  }
}

/**
 * Enregistre une fermeture (pliage) de notice
 */
export function trackNoticeCollapse(pageId: string): void {
  try {
    const analytics = getNoticeAnalytics(pageId);
    analytics.collapses++;
    saveNoticeAnalytics(pageId, analytics);
  } catch (error) {
    logger.error('Failed to track notice collapse:', error);
  }
}

/**
 * Enregistre un feedback utilisateur (👍/👎)
 */
export function trackNoticeFeedback(pageId: string, isHelpful: boolean, comment?: string): void {
  try {
    // Enregistrer feedback
    const feedback: NoticeFeedback = {
      pageId,
      isHelpful,
      timestamp: new Date().toISOString(),
      comment,
    };

    localStorage.setItem(
      `${STORAGE_KEY_FEEDBACK}${pageId}`,
      JSON.stringify(feedback)
    );

    // Mettre à jour analytics
    const analytics = getNoticeAnalytics(pageId);
    if (isHelpful) {
      analytics.feedbackPositive++;
    } else {
      analytics.feedbackNegative++;
    }
    saveNoticeAnalytics(pageId, analytics);

    logger.info(`Notice feedback recorded: ${pageId} - ${isHelpful ? 'helpful' : 'not helpful'}`);
  } catch (error) {
    logger.error('Failed to track notice feedback:', error);
  }
}

/**
 * Récupère les analytics d'une notice
 */
export function getNoticeAnalytics(pageId: string): NoticeAnalytics {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${pageId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logger.error('Failed to get notice analytics:', error);
  }

  // Valeurs par défaut
  return {
    pageId,
    views: 0,
    expansions: 0,
    collapses: 0,
    feedbackPositive: 0,
    feedbackNegative: 0,
    lastViewed: new Date().toISOString(),
  };
}

/**
 * Sauvegarde les analytics d'une notice
 */
function saveNoticeAnalytics(pageId: string, analytics: NoticeAnalytics): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${pageId}`,
      JSON.stringify(analytics)
    );
  } catch (error) {
    logger.error('Failed to save notice analytics:', error);
  }
}

/**
 * Récupère le feedback d'une notice (si existe)
 */
export function getNoticeFeedback(pageId: string): NoticeFeedback | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_FEEDBACK}${pageId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logger.error('Failed to get notice feedback:', error);
  }
  return null;
}

/**
 * Vérifie si l'utilisateur a déjà donné un feedback pour cette notice
 */
export function hasFeedback(pageId: string): boolean {
  return getNoticeFeedback(pageId) !== null;
}

/**
 * Récupère tous les analytics de toutes les notices (pour dashboard admin)
 */
export function getAllNoticeAnalytics(): Record<string, NoticeAnalytics> {
  const allAnalytics: Record<string, NoticeAnalytics> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const pageId = key.replace(STORAGE_KEY_PREFIX, '');
        const analytics = getNoticeAnalytics(pageId);
        allAnalytics[pageId] = analytics;
      }
    }
  } catch (error) {
    logger.error('Failed to get all notice analytics:', error);
  }

  return allAnalytics;
}

/**
 * Calcule le taux d'utilité d'une notice (% feedback positif)
 */
export function getNoticeHelpfulnessRate(pageId: string): number {
  const analytics = getNoticeAnalytics(pageId);
  const totalFeedback = analytics.feedbackPositive + analytics.feedbackNegative;

  if (totalFeedback === 0) return 0;

  return (analytics.feedbackPositive / totalFeedback) * 100;
}

/**
 * Export CSV des analytics (pour analyse)
 */
export function exportNoticeAnalyticsCSV(): string {
  const allAnalytics = getAllNoticeAnalytics();
  const headers = ['Page ID', 'Vues', 'Expansions', 'Collapses', 'Feedback +', 'Feedback -', '% Utilité', 'Dernière vue'];

  const rows = Object.values(allAnalytics).map(analytics => {
    const helpfulnessRate = getNoticeHelpfulnessRate(analytics.pageId);
    return [
      analytics.pageId,
      analytics.views.toString(),
      analytics.expansions.toString(),
      analytics.collapses.toString(),
      analytics.feedbackPositive.toString(),
      analytics.feedbackNegative.toString(),
      helpfulnessRate.toFixed(1) + '%',
      new Date(analytics.lastViewed).toLocaleDateString('fr-FR'),
    ];
  });

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  return '\uFEFF' + csvContent; // UTF-8 BOM pour Excel
}
