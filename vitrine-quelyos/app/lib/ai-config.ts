/**
 * Service de configuration dynamique des providers IA.
 * Récupère la config active depuis le backend avec cache 5 minutes.
 */
import { createApiLogger } from '@/lib/logger';
import { getBackendUrl } from '@quelyos/config';

const log = createApiLogger('AI Config');

/**
 * Interface de configuration provider IA
 */
export interface AiProviderConfig {
  id: number;
  provider: 'groq' | 'claude' | 'openai';
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
}

// Cache en mémoire avec TTL
let configCache: AiProviderConfig | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère la configuration IA active depuis le backend.
 * Utilise un cache de 5 minutes pour limiter les appels.
 *
 * @returns Config du provider actif ou null si aucun actif
 */
export async function getAiConfig(): Promise<AiProviderConfig | null> {
  // Vérifier cache
  if (configCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    log.info('[AI Config] Using cached config');
    return configCache;
  }

  try {
    const backendUrl = getBackendUrl(process.env.NODE_ENV as 'development' | 'production');

    log.info('[AI Config] Fetching config from backend...');

    const response = await fetch(`${backendUrl}/api/ai/active-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      log.error(`[AI Config] Backend error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.config) {
      log.warn('[AI Config] No active provider configured in backend');
      return null;
    }

    // Mettre en cache
    configCache = data.config as AiProviderConfig;
    cacheTimestamp = Date.now();

    log.info(`[AI Config] ✅ Loaded provider: ${data.config.provider} (${data.config.model})`);
    return configCache;

  } catch (error) {
    log.error('[AI Config] Failed to fetch config:', error);
    return null;
  }
}

/**
 * Invalide le cache de configuration.
 * Force un reload lors du prochain appel à getAiConfig().
 */
export function invalidateAiConfigCache(): void {
  configCache = null;
  cacheTimestamp = null;
  log.info('[AI Config] Cache invalidated');
}

/**
 * Reporte les métriques d'usage au backend.
 *
 * @param providerId - ID du provider utilisé
 * @param tokensUsed - Nombre de tokens utilisés
 * @param cost - Coût en USD
 * @param latencyMs - Latence en millisecondes
 * @param success - Si la requête a réussi
 */
export async function reportAiUsage(
  providerId: number,
  tokensUsed: number,
  cost: number,
  latencyMs: number,
  success: boolean
): Promise<void> {
  try {
    const backendUrl = getBackendUrl(process.env.NODE_ENV as 'development' | 'production');

    await fetch(`${backendUrl}/api/ai/report-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_id: providerId,
        tokens_used: tokensUsed,
        cost,
        latency_ms: latencyMs,
        success,
      }),
    });

    log.debug(`[AI Config] Usage reported: ${tokensUsed} tokens, ${latencyMs.toFixed(0)}ms`);
  } catch (error) {
    log.error('[AI Config] Failed to report usage:', error);
    // Non-blocking : on continue même si le rapport échoue
  }
}
