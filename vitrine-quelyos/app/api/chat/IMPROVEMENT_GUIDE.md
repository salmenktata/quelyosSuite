# 🚀 Guide d'Amélioration de l'Assistant Quelyos

Ce guide explique comment développer et améliorer les capacités de réponse de l'assistant, du plus simple au plus avancé.

## 📊 Niveau 1 : Enrichir la Base de Connaissances (Fait ✅)

### Améliorations Appliquées

1. **Détection contextuelle** : L'assistant analyse l'historique pour comprendre le contexte
2. **Scoring amélioré** :
   - Match exact de mot (+2 points)
   - Match partiel (+1 point)
   - Bonus contextuel (+1.5 points)
3. **Questions composées** : Détection de questions multiples et suggestion de poser d'autres questions

### Pour Aller Plus Loin

#### A. Ajouter Plus de Catégories

```typescript
// Dans knowledgeBase, ajouter :
integration: {
  keywords: ['api', 'intégration', 'connecter', 'zapier', 'webhook', 'export', 'import'],
  responses: [{
    text: "Quelyos Suite propose plusieurs moyens d'intégration :\n\n🔌 **API REST complète** : Accès programmatique à toutes vos données\n⚡ **Webhooks** : Notifications temps réel des événements\n🔗 **Zapier** : Connexion avec 5000+ applications\n📥 **Import/Export** : CSV, Excel, FEC comptable\n🔄 **Synchronisation** : Comptabilité, e-commerce, CRM\n\n📚 Documentation API : docs.quelyos.com/api",
    confidence: 0.89,
    suggestions: ['Voir la doc API', 'Intégrations disponibles', 'Demander une intégration custom']
  }]
},

migration: {
  keywords: ['migrer', 'migration', 'changer', 'switch', 'importer', 'transférer'],
  responses: [{
    text: "Migration vers Quelyos : simple et accompagnée !\n\n📦 **Import automatique** depuis :\n• Excel, CSV (format libre)\n• Exports bancaires OFX, QIF\n• FEC comptable\n• Autres logiciels (Sage, Cegid, etc.)\n\n👨‍💻 **Accompagnement migration** :\n• Audit de vos données actuelles\n• Plan de migration personnalisé\n• Import assisté par notre équipe\n• Formation de vos équipes\n• 0 perte de données garantie\n\n⏱️ Migration complète en 2-5 jours selon la volumétrie.",
    confidence: 0.91,
    suggestions: ['Planifier ma migration', 'Formats supportés', 'Contacter l\'équipe migration']
  }]
},

compare: {
  keywords: ['comparer', 'comparaison', 'vs', 'différence', 'concurrent', 'alternative', 'mieux'],
  responses: [{
    text: "Quelyos Suite vs les alternatives :\n\n✅ **Notre différence** :\n• 8 modules vs 1-2 chez la concurrence\n• IA prévision 90j (85-90% précision) vs prévisions basiques\n• Hébergement France 🇫🇷 vs US/UE\n• Prix tout inclus vs modules additionnels payants\n• Support français réactif vs tickets en anglais\n\n💡 **Tableau comparatif détaillé** :\nVoir notre page : quelyos.com/compare\n\n🎯 **Clients qui ont switché** témoignent d'un gain de temps de 40% en moyenne.",
    confidence: 0.87,
    suggestions: ['Voir le tableau comparatif', 'Lire les témoignages', 'Essai gratuit']
  }]
}
```

#### B. Ajouter des Réponses Alternatives

```typescript
// Pour varier les réponses
pricing: {
  keywords: ['prix', 'tarif', 'coût'],
  responses: [
    { text: "Réponse variante 1...", confidence: 0.95 },
    { text: "Réponse variante 2...", confidence: 0.95 },
    { text: "Réponse variante 3...", confidence: 0.95 }
  ]
}

// Puis dans detectIntent :
const responses = knowledgeBase[category].responses;
const randomResponse = responses[Math.floor(Math.random() * responses.length)];
```

## 🤖 Niveau 2 : Intégration IA Avancée (OpenAI / Claude)

### Option A : OpenAI GPT-4

**Installation** :
```bash
npm install openai
```

**Configuration** :
```typescript
// app/api/chat/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `Tu es l'assistant virtuel de Quelyos Suite, une plateforme ERP française pour TPE/PME.

CONTEXTE ENTREPRISE :
- 8 modules intégrés : Finance, Boutique, CRM, Stock, RH, POS, Marketing, Dashboard
- IA de prévision trésorerie 90 jours (précision 85-90%)
- Hébergement en France, 100% RGPD
- Tarifs : Starter 19€/mois, Business 49€/mois, Enterprise sur devis
- 30 jours d'essai gratuit sans CB

TON RÔLE :
- Répondre aux questions sur Quelyos de manière claire et concise
- Être enthousiaste mais professionnel
- Utiliser des emojis avec parcimonie (1-2 max par réponse)
- Toujours proposer 2-3 actions concrètes en fin de réponse
- Si tu ne sais pas, rediriger vers support@quelyos.com

STYLE :
- Phrases courtes et paragraphes aérés
- Bullet points pour les listes
- Tutoiement naturel
- Éviter le jargon technique sauf si demandé`;

export async function getAIResponse(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ response: string; suggestions: string[] }> {

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: message }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    temperature: 0.7,
    max_tokens: 500,
    presence_penalty: 0.6,
    frequency_penalty: 0.3
  });

  const responseText = completion.choices[0].message.content || '';

  // Extraire les suggestions du texte (chercher des actions)
  const suggestions = extractSuggestions(responseText);

  return {
    response: responseText,
    suggestions
  };
}

function extractSuggestions(text: string): string[] {
  // Logique simple pour extraire suggestions
  const commonActions = [
    'Voir les tarifs',
    'Créer mon compte',
    'Demander une démo',
    'Voir les modules',
    'Contacter le support'
  ];

  return commonActions.slice(0, 3);
}
```

**Utilisation dans route.ts** :
```typescript
import { getAIResponse } from './openai';

// Dans la route POST :
try {
  // Essayer d'abord l'IA
  if (process.env.OPENAI_API_KEY) {
    const aiHistory = history?.slice(-6).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    })) || [];

    const { response: aiResponse, suggestions } = await getAIResponse(message, aiHistory);

    return NextResponse.json({
      response: aiResponse,
      suggestions,
      confidence: 0.92,
      intent: 'ai_powered'
    });
  }

  // Fallback sur détection locale
  const response = detectIntent(message, history);
  return NextResponse.json(response);

} catch (error) {
  // Fallback si erreur IA
  const response = detectIntent(message, history);
  return NextResponse.json(response);
}
```

### Option B : Anthropic Claude (Recommandé 🌟)

**Installation** :
```bash
npm install @anthropic-ai/sdk
```

**Configuration** :
```typescript
// app/api/chat/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function getClaudeResponse(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ response: string; suggestions: string[] }> {

  const systemPrompt = `Tu es l'assistant virtuel de Quelyos Suite...`; // Même prompt

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 600,
    system: systemPrompt,
    messages: [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ]
  });

  const responseText = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  const suggestions = extractSuggestions(responseText);

  return { response: responseText, suggestions };
}
```

**Avantages Claude** :
- Meilleure compréhension contextuelle
- Réponses plus naturelles et structurées
- Moins de hallucinations
- Fenêtre de contexte plus grande (200k tokens)

## 🧠 Niveau 3 : RAG (Retrieval Augmented Generation)

Pour des réponses ultra-précises basées sur votre documentation.

### Architecture RAG

```typescript
// 1. Indexer votre documentation
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

// Index initial (une fois)
async function indexDocumentation() {
  const docs = [
    { content: "Guide installation Quelyos...", metadata: { source: 'docs/installation' } },
    { content: "Configuration module Finance...", metadata: { source: 'docs/finance' } },
    // ... tous vos docs
  ];

  await PineconeStore.fromDocuments(
    docs,
    new OpenAIEmbeddings(),
    { pineconeIndex }
  );
}

// 2. Recherche sémantique lors d'une question
async function getRelevantDocs(question: string) {
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    { pineconeIndex }
  );

  const relevantDocs = await vectorStore.similaritySearch(question, 3);
  return relevantDocs.map(doc => doc.pageContent).join('\n\n');
}

// 3. Augmenter la réponse avec le contexte
export async function getRagResponse(message: string) {
  const relevantContext = await getRelevantDocs(message);

  const prompt = `Contexte de la documentation :
${relevantContext}

Question de l'utilisateur : ${message}

Réponds en te basant UNIQUEMENT sur le contexte fourni. Si l'info n'est pas dans le contexte, dis-le clairement.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  });

  return response.choices[0].message.content;
}
```

## 📊 Niveau 4 : Fine-tuning avec vos Données

### Étape 1 : Collecter des Conversations

```typescript
// Sauvegarder toutes les conversations
// Format JSONL pour fine-tuning
{"messages": [
  {"role": "user", "content": "Quels sont vos tarifs ?"},
  {"role": "assistant", "content": "Nos tarifs commencent à 19€/mois..."}
]}
{"messages": [
  {"role": "user", "content": "Comment créer un compte ?"},
  {"role": "assistant", "content": "Pour créer votre compte..."}
]}
```

### Étape 2 : Fine-tuner GPT-4

```bash
# Uploader le dataset
openai api fine_tunes.create \
  -t conversations.jsonl \
  -m gpt-4-0613 \
  --suffix "quelyos-assistant"

# Utiliser le modèle fine-tuné
const completion = await openai.chat.completions.create({
  model: 'ft:gpt-4-0613:quelyos-assistant',
  messages: [...]
});
```

## 🎭 Niveau 5 : Agent avec Outils (Function Calling)

Permettre à l'IA d'effectuer des actions réelles.

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "get_pricing",
      description: "Récupère les tarifs actuels de Quelyos",
      parameters: {
        type: "object",
        properties: {
          plan: { type: "string", enum: ["starter", "business", "enterprise"] }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_demo_request",
      description: "Crée une demande de démo",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string" },
          company: { type: "string" }
        },
        required: ["email"]
      }
    }
  }
];

const response = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  messages: [...],
  tools,
  tool_choice: "auto"
});

if (response.choices[0].message.tool_calls) {
  // Exécuter la fonction demandée
  const toolCall = response.choices[0].message.tool_calls[0];
  if (toolCall.function.name === "get_pricing") {
    const pricing = await getPricing();
    // Renvoyer le résultat à l'IA
  }
}
```

## 📈 Métriques de Performance à Suivre

1. **Taux de résolution** : % de conversations résolues sans humain
2. **Score de confiance moyen** : Devrait être > 0.75
3. **Temps de réponse** : < 2 secondes idéalement
4. **Satisfaction utilisateur** : Thumbs up/down après chaque réponse
5. **Taux d'escalade** : % nécessitant un humain (cible < 20%)

## 🧪 Tests A/B

```typescript
// Tester différentes approches
const variant = Math.random() < 0.5 ? 'keyword' : 'ai';

if (variant === 'ai' && process.env.OPENAI_API_KEY) {
  // Version IA
  const response = await getAIResponse(message, history);
} else {
  // Version keywords
  const response = detectIntent(message, history);
}

// Logger pour comparer les performances
await logABTest({ variant, satisfaction, responseTime });
```

## 💡 Recommandations par Ordre de Priorité

1. ✅ **Fait** : Base de connaissances enrichie + contexte
2. 🎯 **Prochain** : Intégration Claude 3.5 Sonnet (meilleur rapport qualité/prix)
3. 📊 **Ensuite** : Analytics + A/B testing
4. 🧠 **Avancé** : RAG avec votre documentation
5. 🎭 **Expert** : Function calling pour actions automatiques

## 🔑 Variables d'Environnement Nécessaires

```env
# Option A : OpenAI
OPENAI_API_KEY=sk-...

# Option B : Anthropic Claude (Recommandé)
ANTHROPIC_API_KEY=sk-ant-...

# Option RAG : Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX=quelyos-docs

# Analytics
POSTHOG_API_KEY=...
SEGMENT_WRITE_KEY=...
```

## 📞 Support

Pour toute question sur l'implémentation :
- 📧 tech@quelyos.com
- 💬 Discord : #dev-assistant
- 📚 Docs : docs.quelyos.com/assistant
