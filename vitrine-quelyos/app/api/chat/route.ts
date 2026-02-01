import { NextRequest, NextResponse } from 'next/server';
import { logConversation, analyzeSentiment, shouldEscalateToHuman } from './analytics';
import { getAIResponse, formatHistoryForAI } from './ai-providers';
import { createApiLogger } from '@/lib/logger';

const log = createApiLogger('POST /api/chat');

/**
 * API Chat Assistant Quelyos
 *
 * Endpoint intelligent pour l'assistant virtuel avec :
 * - Détection d'intent avancée
 * - Gestion de contexte conversationnel
 * - Réponses personnalisées
 * - Analytics des conversations
 */

// Types
interface ChatMessage {
  type: 'bot' | 'user';
  text: string;
  timestamp: Date | string;
  suggestions?: string[];
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  sessionId?: string;
  metadata?: {
    page?: string;
    userAgent?: string;
  };
}

interface ChatResponse {
  response: string;
  suggestions?: string[];
  confidence: number;
  intent?: string;
  requiresHuman?: boolean;
  metadata?: {
    processingTime?: number;
    model?: string;
    version?: string;
  };
}

// Base de connaissances enrichie
const knowledgeBase = {
  pricing: {
    keywords: ['prix', 'tarif', 'coût', 'combien', 'abonnement', 'payer', 'gratuit', 'essai'],
    responses: [
      {
        text: "Quelyos Suite propose 3 formules :\n\n**Starter (19€/mois)** : 3 utilisateurs, Finance + 2 modules au choix, prévisions IA 12 mois\n\n**Business (49€/mois)** : 10 utilisateurs, tous les 9 modules, prévisions IA 24 mois, API complète\n\n**Enterprise (sur devis)** : Utilisateurs illimités, SLA 99.9%, support dédié\n\n✨ 30 jours d'essai gratuit sans carte bancaire sur tous les plans !",
        confidence: 0.95,
        suggestions: ['Voir le comparatif détaillé', 'Démarrer l\'essai gratuit', 'Contacter un commercial']
      }
    ]
  },

  modules: {
    keywords: ['module', 'fonctionnalité', 'fonction', 'finance', 'stock', 'crm', 'boutique', 'rh', 'pos', 'marketing', 'dashboard'],
    responses: [
      {
        text: "Quelyos Suite intègre 9 modules synchronisés automatiquement :\n\n💰 **Finance** : Trésorerie, prévisions IA 90j, budgets\n🛍️ **Store** : E-commerce, catalogue, commandes\n👥 **CRM** : Clients, pipeline, devis et factures\n📦 **Stock** : Multi-sites, alertes, valorisation\n👔 **RH** : Employés, congés, pointage\n💳 **POS** : Caisse tactile, Click & Collect\n📧 **Marketing** : Campagnes email/SMS, audiences\n🎧 **Support** : Tickets, helpdesk\n🏠 **Home** : Dashboard KPIs temps réel\n\nTous les modules partagent les mêmes données pour une gestion unifiée.",
        confidence: 0.92,
        suggestions: ['Voir les détails des modules', 'Demander une démo', 'Comparer avec la concurrence']
      }
    ]
  },

  signup: {
    keywords: ['inscription', 'inscri', 'créer', 'compte', 'commencer', 'démarrer', 'enregistrer', 'register'],
    responses: [
      {
        text: "Pour créer votre compte Quelyos Suite, c'est très simple :\n\n1️⃣ Cliquez sur **'Essai gratuit'** en haut de la page\n2️⃣ Renseignez vos informations (email, nom d'entreprise, mot de passe)\n3️⃣ Validez votre email\n4️⃣ Configurez vos premiers modules\n\n⏱️ Installation en **5 minutes** • 🎁 **30 jours gratuits** • 💳 **Sans CB**\n\nVous avez accès immédiat aux 9 modules !",
        confidence: 0.93,
        suggestions: ['Créer mon compte maintenant', 'Voir la vidéo démo', 'Questions fréquentes']
      }
    ]
  },

  support: {
    keywords: ['aide', 'support', 'problème', 'bug', 'erreur', 'marche pas', 'fonctionne pas', 'aide-moi', 'help'],
    responses: [
      {
        text: "Notre équipe support est là pour vous aider !\n\n📧 **Email** : support@quelyos.com\n⏱️ Réponse sous **24h** (4h pour clients Premium)\n\n💬 **Discord** : Communauté active d'utilisateurs\n📚 **Documentation** : Guides détaillés et tutoriels\n🎥 **Vidéos** : Formations gratuites\n\n🏆 Les clients **Pro & Expert** bénéficient d'un support prioritaire avec SLA garanti.",
        confidence: 0.88,
        suggestions: ['Envoyer un email au support', 'Rejoindre Discord', 'Consulter la documentation']
      }
    ]
  },

  security: {
    keywords: ['sécurit', 'sûr', 'rgpd', 'donné', 'données', 'confidentiel', 'privé', 'protection', 'pirate', 'hack'],
    responses: [
      {
        text: "La sécurité de vos données est notre priorité absolue :\n\n🔒 **Chiffrement AES-256** de bout en bout\n🇫🇷 **Infrastructure sécurisée** (certifié ISO 27001)\n✅ **100% conforme RGPD** avec droit d'accès, rectification, suppression\n🛡️ **Audits de sécurité** trimestriels par des experts indépendants\n🚫 **Zéro vente de données** à des tiers\n📊 **Sauvegarde quotidienne** avec rétention 30 jours\n\nVous gardez le contrôle total de vos données à tout moment.",
        confidence: 0.94,
        suggestions: ['Voir notre politique de sécurité', 'Certificats et conformité', 'Contacter le DPO']
      }
    ]
  },

  ai: {
    keywords: ['ia', 'intelligence', 'artificielle', 'prévision', 'prédiction', 'algorithme', 'machine learning', 'précision'],
    responses: [
      {
        text: "Notre IA de prévision trésorerie est l'une des plus avancées du marché :\n\n🎯 **Précision 85-90%** sur 90 jours\n📊 **Analyse** de vos transactions, saisonnalité, tendances\n🔮 **Prédiction** des entrées/sorties futures\n⚠️ **Alertes proactives** de tensions de trésorerie\n📈 **Auto-apprentissage** : plus vous utilisez Quelyos, plus les prévisions s'affinent\n\nL'IA prend en compte :\n• Historique des 12 derniers mois minimum\n• Récurrence des transactions\n• Saisonnalité de votre activité\n• Tendances du secteur",
        confidence: 0.91,
        suggestions: ['Voir une démo de l\'IA', 'Comment ça marche ?', 'Cas d\'usage']
      }
    ]
  },

  demo: {
    keywords: ['démo', 'demo', 'démonstration', 'essai', 'test', 'tester', 'essayer', 'voir'],
    responses: [
      {
        text: "Découvrez Quelyos Suite en action !\n\n🎬 **Démo en ligne** : Explorez l'interface avec des données fictives\n👨‍💼 **Démo personnalisée** : Un expert vous guide (30 min)\n✨ **Essai gratuit 30 jours** : Testez avec vos vraies données\n\nLa démo personnalisée vous permet de :\n• Voir l'interface adaptée à votre secteur\n• Poser toutes vos questions\n• Obtenir un devis sur mesure\n• Pas de vente forcée, juste du conseil !\n\n📅 Disponibilités : Lundi-Vendredi 9h-18h",
        confidence: 0.89,
        suggestions: ['Réserver une démo personnalisée', 'Démarrer l\'essai gratuit', 'Voir des vidéos']
      }
    ]
  },

  greeting: {
    keywords: ['bonjour', 'salut', 'hello', 'hey', 'hi', 'coucou', 'bonsoir'],
    responses: [
      {
        text: "Bonjour ! 👋\n\nJe suis l'assistant virtuel Quelyos, ravi de vous aider.\n\nJe peux répondre à vos questions sur :\n• 💰 Les tarifs et plans\n• 🎯 Les fonctionnalités et modules\n• 🚀 La création de compte\n• 🛡️ La sécurité et le RGPD\n• 🤖 L'IA de prévision\n• 🎬 Les démos et essais\n• 💬 Le support technique\n\nComment puis-je vous aider aujourd'hui ?",
        confidence: 0.96,
        suggestions: ['Voir les tarifs', 'Découvrir les modules', 'Créer mon compte']
      }
    ]
  },

  thanks: {
    keywords: ['merci', 'parfait', 'super', 'génial', 'top', 'excellent', 'ok', 'compris', 'bien'],
    responses: [
      {
        text: "Avec plaisir ! 😊\n\nN'hésitez pas si vous avez d'autres questions.\n\nVous pouvez aussi :\n📧 Contacter notre équipe : support@quelyos.com\n💬 Rejoindre notre communauté Discord\n📚 Consulter la documentation complète\n\nÀ bientôt sur Quelyos Suite !",
        confidence: 0.92,
        suggestions: ['Poser une autre question', 'Créer mon compte', 'Fermer']
      }
    ]
  }
};

// Fonction de détection d'intent améliorée avec NLP basique
function detectIntent(message: string, history?: ChatMessage[]): ChatResponse {
  const msg = message.toLowerCase().trim();

  // Analyse du contexte (dernier message bot si disponible)
  let contextIntent: string | undefined;
  if (history && history.length > 0) {
    const lastBotMessage = [...history].reverse().find(m => m.type === 'bot');
    // Extraire l'intent du contexte (basique)
    if (lastBotMessage?.text.includes('tarif') || lastBotMessage?.text.includes('prix')) {
      contextIntent = 'pricing';
    } else if (lastBotMessage?.text.includes('module')) {
      contextIntent = 'modules';
    }
  }

  // Score pour chaque catégorie avec poids contextuels
  const scores: Record<string, number> = {};

  for (const [category, data] of Object.entries(knowledgeBase)) {
    scores[category] = 0;

    // Calcul du score basé sur les mots-clés
    for (const keyword of data.keywords) {
      // Recherche exacte (mot complet)
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(msg)) {
        scores[category] += 2; // Plus de poids pour match exact
      } else if (msg.includes(keyword)) {
        scores[category] += 1; // Match partiel
      }
    }

    // Bonus pour correspondance exacte
    if (data.keywords.some(keyword => msg === keyword)) {
      scores[category] += 3;
    }

    // Bonus contextuel si en rapport avec le dernier sujet
    if (contextIntent === category) {
      scores[category] += 1.5;
    }
  }

  // Détection de questions composées (ex: "prix ET modules")
  const hasMultipleIntents = Object.values(scores).filter(s => s > 0).length > 1;

  // Trouver la catégorie avec le meilleur score
  const bestCategory = Object.entries(scores)
    .filter(([_category, score]) => score > 0)
    .sort(([_keyA, a], [_keyB, b]) => b - a)[0];

  if (bestCategory) {
    const [category, score] = bestCategory;
    const response = knowledgeBase[category as keyof typeof knowledgeBase].responses[0];

    // Calculer la confiance basée sur le score
    const confidence = Math.min(0.95, score / 5);

    // Ajouter une note si question composée détectée
    let responseText = response.text;
    if (hasMultipleIntents && scores[category] < 4) {
      responseText += "\n\n💡 Vous semblez avoir plusieurs questions. N'hésitez pas à me poser d'autres questions ensuite !";
    }

    return {
      response: responseText,
      suggestions: response.suggestions,
      confidence,
      intent: category
    };
  }

  // Réponse par défaut si aucune correspondance
  return {
    response: "Je n'ai pas bien compris votre question. 🤔\n\nPouvez-vous reformuler ou choisir parmi ces sujets populaires ?\n\nVous pouvez aussi contacter directement notre support à support@quelyos.com pour une réponse personnalisée.",
    suggestions: ['Tarifs et plans', 'Les 9 modules', 'Créer un compte', 'Support technique', 'Sécurité RGPD'],
    confidence: 0.3,
    intent: 'unknown',
    requiresHuman: true
  };
}

// Route POST
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history, sessionId, metadata } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      );
    }

    // Génération de réponse : tenter IA puis fallback keywords
    const startTime = Date.now();
    let response: ChatResponse;

    try {
      // Tenter avec IA configurée dynamiquement
      const aiHistory = formatHistoryForAI(history || []);
      const aiResponse = await getAIResponse(message, aiHistory);

      response = {
        response: aiResponse.response,
        suggestions: aiResponse.suggestions,
        confidence: aiResponse.confidence,
        intent: 'ai',
      };
    } catch (aiError) {
      // Fallback sur détection par keywords si IA échoue
      log.warn('[Chat] AI failed, fallback to keywords:', aiError);
      response = detectIntent(message, history);
    }

    const processingTime = Date.now() - startTime;

    // Analyse de sentiment
    const sentiment = analyzeSentiment(message);

    // Vérifier si escalade nécessaire
    const needsEscalation = shouldEscalateToHuman(message, response.confidence, sentiment);
    if (needsEscalation && !response.requiresHuman) {
      response.requiresHuman = true;
      response.response += "\n\n⚠️ Pour une assistance plus personnalisée, notre équipe est disponible à support@quelyos.com";
    }

    // Ajouter metadata
    response.metadata = {
      processingTime,
      model: 'quelyos-assistant-v1',
      version: '1.0.0'
    };

    // Logger pour analytics
    await logConversation({
      sessionId: sessionId || 'anonymous',
      userMessage: message,
      botResponse: response.response,
      intent: response.intent || 'unknown',
      confidence: response.confidence,
      requiresHuman: response.requiresHuman || false,
      metadata: {
        sentiment,
        processingTime,
        page: metadata?.page,
        userAgent: metadata?.userAgent
      }
    });

    return NextResponse.json(response);

  } catch (error) {
    log.error('Erreur API Chat:', error);

    return NextResponse.json(
      {
        response: "Désolé, une erreur s'est produite. Notre équipe technique a été notifiée. Vous pouvez nous contacter directement à support@quelyos.com.",
        suggestions: ['Réessayer', 'Contacter le support'],
        confidence: 0,
        intent: 'error'
      },
      { status: 500 }
    );
  }
}

// Route GET pour healthcheck
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'quelyos-chat-assistant',
    version: '1.0.0',
    endpoints: {
      POST: '/api/chat - Envoyer un message à l\'assistant'
    }
  });
}
