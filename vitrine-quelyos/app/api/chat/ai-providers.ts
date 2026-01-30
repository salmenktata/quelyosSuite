/**
 * Providers IA pour l'Assistant Quelyos
 *
 * Ce fichier contient les intégrations avec différentes IA :
 * - Groq (Gratuit - Llama 3.1)
 * - Anthropic Claude
 * - OpenAI GPT-4
 *
 * Configuration dynamique depuis le backend Odoo.
 */

import { createApiLogger } from '@/lib/logger';
import { getAiConfig, reportAiUsage, type AiProviderConfig } from '@/lib/ai-config';

const log = createApiLogger('POST /api/chat/ai-providers');

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  response: string;
  suggestions: string[];
  confidence: number;
  provider: 'groq' | 'claude' | 'openai' | 'local';
}

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de Quelyos Suite, une plateforme ERP française pour TPE/PME.

🏢 CONTEXTE ENTREPRISE :
- 8 modules intégrés : Finance (IA prévisions 90j), Boutique, CRM, Stock, RH, POS, Marketing, Dashboard
- Toutes les données synchronisées automatiquement entre modules
- IA de prévision trésorerie : précision 85-90% sur 90 jours
- Hébergement 100% France, certifié ISO 27001
- 100% conforme RGPD, données chiffrées AES-256
- 2500+ entreprises clientes (TPE/PME françaises)

💰 TARIFS :
- Starter : 19€/mois (3 users, Finance + 2 modules au choix, IA 12 mois)
- Business : 49€/mois (10 users, tous les 8 modules, IA 24 mois, API complète) ⭐ Meilleur rapport
- Enterprise : Sur devis (users illimités, SLA 99.9%, account manager dédié)
- 🎁 30 jours d'essai gratuit SANS carte bancaire sur tous les plans

✨ POINTS FORTS :
- Tout-en-un vs 5-6 logiciels séparés chez la concurrence
- Prix fixe transparent vs modules additionnels cachés
- Support français réactif (24h standard, 4h premium)
- Installation en 5 minutes, données migrées en 2-5 jours

🎯 TON RÔLE :
- Répondre de manière CLAIRE, CONCISE et ACTIONABLE
- Être enthousiaste mais professionnel (jamais vendeur agressif)
- Utiliser des emojis avec parcimonie (1-2 max par réponse)
- Structurer tes réponses : titre → bullet points → call-to-action
- TOUJOURS proposer 2-3 actions concrètes en fin de réponse
- Si tu ne sais pas ou question trop spécifique → rediriger vers support@quelyos.com

📝 STYLE D'ÉCRITURE :
- Tutoiement naturel et friendly
- Phrases courtes (15-20 mots max)
- Paragraphes aérés (2-3 lignes max)
- Bullet points pour les listes
- Éviter le jargon technique (sauf si l'user demande)
- Reformuler les acronymes la 1ère fois (ex: "CRM (gestion clients)")

🚫 INTERDICTIONS :
- JAMAIS inventer des features qui n'existent pas
- JAMAIS donner de faux chiffres ou stats
- JAMAIS promettre des délais sans être sûr
- JAMAIS dénigrer la concurrence (parler de nos avantages positivement)

💡 EXEMPLES DE BONNES RÉPONSES :

User: "C'est quoi la différence avec Excel ?"
Assistant: "Excel est excellent pour les calculs ponctuels, mais Quelyos va beaucoup plus loin :

📊 **Excel** : Saisie manuelle, risques d'erreur, pas de collaboration
💎 **Quelyos** : Import auto banques, IA prévisions 90j, sync temps réel équipe

Les avantages concrets :
• Gain de temps : 10h/mois économisées en moyenne
• Prévisions fiables : l'IA apprend de tes données
• Travail d'équipe : modifications visibles instantanément

→ [Voir une démo] [Comparer en détail] [Essai gratuit]"

User: "Vous faites la compta ?"
Assistant: "Quelyos n'est pas un logiciel comptable pur, mais ton meilleur allié pour la gestion financière :

✅ **Ce qu'on fait** :
• Trésorerie et prévisions
• Catégorisation intelligente des dépenses
• Budgets et alertes
• Export FEC pour ton expert-comptable

🤝 **Intégration comptable** :
On se connecte avec ton logiciel compta (Sage, Cegid, etc.) pour synchroniser automatiquement.

Pense à Quelyos comme le pilotage au quotidien, ton comptable fait la déclaration fiscale.

→ [Voir module Finance] [Intégrations comptables] [Parler à un expert]"

🎯 FORMAT DE RÉPONSE ATTENDU :
1. Phrase d'accroche (reformuler la question)
2. Réponse structurée (bullet points)
3. Exemple concret si pertinent
4. 2-3 suggestions d'actions entre crochets

Prêt à assister les utilisateurs de manière professionnelle et efficace !`;

/**
 * Groq (Gratuit) - Llama 3.1 70B Versatile
 * Ultra-rapide (~300 tokens/s), gratuit (14400 req/jour)
 */
async function getGroqResponse(
  message: string,
  history: AIMessage[],
  config: AiProviderConfig
): Promise<AIResponse> {
  if (!config.api_key) {
    throw new Error('Groq API key not configured');
  }

  try {
    const Groq = (await import('groq-sdk')).default;

    const groq = new Groq({
      apiKey: config.api_key,
    });

    const completion = await groq.chat.completions.create({
      model: config.model || 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 800,
      top_p: 1,
    });

    const responseText = completion.choices[0].message.content || '';
    const suggestions = extractSuggestionsFromText(responseText);

    return {
      response: responseText,
      suggestions,
      confidence: 0.90,
      provider: 'groq'
    };

  } catch (error) {
    log.error('[Groq] Erreur API:', error);
    throw error;
  }
}

/**
 * Anthropic Claude
 * Meilleur rapport qualité/prix et compréhension contextuelle
 */
async function getClaudeResponse(
  message: string,
  history: AIMessage[],
  config: AiProviderConfig
): Promise<AIResponse> {
  if (!config.api_key) {
    throw new Error('Claude API key not configured');
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;

    const anthropic = new Anthropic({
      apiKey: config.api_key,
    });

    const response = await anthropic.messages.create({
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: config.max_tokens || 800,
      temperature: config.temperature || 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        ...history,
        { role: 'user', content: message }
      ]
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    const suggestions = extractSuggestionsFromText(responseText);

    return {
      response: responseText,
      suggestions,
      confidence: 0.92,
      provider: 'claude'
    };

  } catch (error) {
    log.error('Erreur Claude API:', error);
    throw error;
  }
}

/**
 * OpenAI GPT-4
 * Alternative si Claude indisponible
 */
export async function getOpenAIResponse(
  message: string,
  history: AIMessage[]
): Promise<AIResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY manquante');
  }

  try {
    const OpenAI = (await import('openai')).default;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 700,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const responseText = completion.choices[0].message.content || '';
    const suggestions = extractSuggestionsFromText(responseText);

    return {
      response: responseText,
      suggestions,
      confidence: 0.90,
      provider: 'openai'
    };

  } catch (error) {
    log.error('Erreur OpenAI API:', error);
    throw error;
  }
}

/**
 * Extraire les suggestions du texte
 * Cherche les actions entre crochets : [Action]
 */
function extractSuggestionsFromText(text: string): string[] {
  // Chercher les suggestions entre crochets
  const bracketMatches = text.match(/\[([^\]]+)\]/g);
  if (bracketMatches && bracketMatches.length > 0) {
    return bracketMatches
      .map(match => match.replace(/[\[\]]/g, ''))
      .slice(0, 4); // Max 4 suggestions
  }

  // Fallback : suggestions par défaut contextuelles
  const suggestions: string[] = [];

  if (text.toLowerCase().includes('tarif') || text.toLowerCase().includes('prix')) {
    suggestions.push('Voir les tarifs détaillés', 'Comparer les plans');
  }

  if (text.toLowerCase().includes('module') || text.toLowerCase().includes('fonctionnalité')) {
    suggestions.push('Découvrir les 8 modules', 'Voir des démos');
  }

  if (text.toLowerCase().includes('essai') || text.toLowerCase().includes('gratuit')) {
    suggestions.push('Démarrer l\'essai gratuit');
  }

  // Toujours proposer ces actions
  if (suggestions.length < 3) {
    suggestions.push('Créer mon compte', 'Contacter le support');
  }

  return suggestions.slice(0, 3);
}

/**
 * Router intelligent avec configuration dynamique depuis le backend.
 * Utilise le provider configuré dans le panel Super Admin.
 */
export async function getAIResponse(
  message: string,
  history: AIMessage[]
): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    // Récupérer la config dynamique depuis le backend
    const config = await getAiConfig();

    if (!config) {
      throw new Error('No active AI provider configured in backend');
    }

    log.info(`[AI] Using provider: ${config.provider} (${config.model})`);

    let response: AIResponse;

    // Router selon le provider configuré
    if (config.provider === 'groq') {
      response = await getGroqResponse(message, history, config);
    } else if (config.provider === 'claude') {
      response = await getClaudeResponse(message, history, config);
    } else if (config.provider === 'openai') {
      response = await getOpenAIResponse(message, history);
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }

    const latency = Date.now() - startTime;
    log.info(`[AI] ✅ Success with ${config.provider} (${latency}ms)`);

    // Reporter les métriques au backend (async, non-bloquant)
    reportAiUsage(
      config.id,
      0, // tokens_used (TODO: extraire des réponses API)
      0, // cost
      latency,
      true
    ).catch(err => log.warn('[AI] Failed to report usage:', err));

    return response;

  } catch (error) {
    const latency = Date.now() - startTime;
    log.error('[AI] Provider failed:', error);

    // Reporter l'échec si on a la config
    const config = await getAiConfig().catch(() => null);
    if (config) {
      reportAiUsage(config.id, 0, 0, latency, false)
        .catch(() => {/* ignore */});
    }

    throw error;
  }
}

/**
 * Formater l'historique pour les APIs IA
 */
export function formatHistoryForAI(
  history: Array<{ type: 'user' | 'bot'; text: string }>
): AIMessage[] {
  return history
    .slice(-8) // Garder seulement les 8 derniers messages
    .map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
}
