# API Chat Assistant Quelyos

API backend intelligente pour l'assistant virtuel Quelyos avec détection d'intent et réponses contextuelles.

## 📍 Endpoint

```
POST /api/chat
```

## 📤 Request

```typescript
{
  message: string;           // Message de l'utilisateur (requis)
  history?: ChatMessage[];   // Historique de conversation (optionnel)
  sessionId?: string;        // ID de session (optionnel)
  metadata?: {
    page?: string;           // Page d'origine
    userAgent?: string;      // User agent du navigateur
  }
}
```

## 📥 Response

```typescript
{
  response: string;          // Réponse de l'assistant
  suggestions?: string[];    // Suggestions d'actions rapides
  confidence: number;        // Score de confiance (0-1)
  intent?: string;          // Intent détecté
  requiresHuman?: boolean;  // Nécessite intervention humaine
}
```

## 🎯 Intents Supportés

| Intent | Mots-clés | Description |
|--------|-----------|-------------|
| `pricing` | prix, tarif, coût, abonnement | Informations sur les tarifs |
| `modules` | module, fonctionnalité, finance, crm | Détails sur les 9 modules |
| `signup` | inscription, créer, compte, commencer | Guide d'inscription |
| `support` | aide, support, problème, bug | Support technique |
| `security` | sécurité, rgpd, données, confidentiel | Sécurité et conformité |
| `ai` | ia, prévision, intelligence artificielle | IA et prévisions |
| `demo` | démo, essai, test, tester | Démos et essais gratuits |
| `greeting` | bonjour, salut, hello | Message d'accueil |
| `thanks` | merci, parfait, super | Remerciements |

## 🚀 Améliorations Futures

### 1. Intégration avec une vraie IA (OpenAI, Anthropic)

```typescript
import { Configuration, OpenAIApi } from 'openai';

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

const completion = await openai.createChatCompletion({
  model: "gpt-4",
  messages: [
    { role: "system", content: "Tu es l'assistant Quelyos..." },
    { role: "user", content: message }
  ],
});
```

### 2. Sauvegarde des conversations

```typescript
// prisma/schema.prisma
model Conversation {
  id        String   @id @default(cuid())
  sessionId String
  message   String
  response  String
  intent    String?
  createdAt DateTime @default(now())
}

// Dans route.ts
await prisma.conversation.create({
  data: {
    sessionId,
    message,
    response: response.response,
    intent: response.intent
  }
});
```

### 3. Analytics et Métriques

```typescript
// Tracking des intents populaires
const intentStats = await prisma.conversation.groupBy({
  by: ['intent'],
  _count: true,
  orderBy: { _count: { intent: 'desc' } }
});

// Taux de satisfaction
const satisfactionRate = await prisma.feedback.aggregate({
  _avg: { rating: true }
});
```

### 4. Rate Limiting

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

const { success } = await ratelimit.limit(sessionId);
if (!success) {
  return NextResponse.json(
    { error: 'Trop de requêtes' },
    { status: 429 }
  );
}
```

### 5. Contexte Multi-tours

```typescript
// Garder le contexte sur plusieurs tours
const context = history?.slice(-5).map(msg => ({
  role: msg.type === 'user' ? 'user' : 'assistant',
  content: msg.text
}));

// Utiliser le contexte pour améliorer les réponses
const response = await generateResponseWithContext(message, context);
```

### 6. Sentiment Analysis

```typescript
import Sentiment from 'sentiment';

const sentiment = new Sentiment();
const result = sentiment.analyze(message);

if (result.score < -2) {
  // Client frustré, escalader vers humain
  return {
    response: "Je comprends votre frustration. Un membre de notre équipe va vous contacter rapidement.",
    requiresHuman: true
  };
}
```

### 7. Multilangue

```typescript
import { detect } from 'langdetect';

const language = detect(message);

const responses = {
  fr: knowledgeBaseFr,
  en: knowledgeBaseEn,
  es: knowledgeBaseEs
};

const response = responses[language] || responses.fr;
```

## 🧪 Tests

```bash
# Test basique
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quels sont vos tarifs ?"}'

# Test avec historique
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Et pour les modules ?",
    "history": [
      {"type": "user", "text": "Bonjour", "timestamp": "2024-01-30T10:00:00Z"},
      {"type": "bot", "text": "Bonjour ! Comment puis-je vous aider ?", "timestamp": "2024-01-30T10:00:01Z"}
    ]
  }'

# Healthcheck
curl http://localhost:3000/api/chat
```

## 📊 Métriques à Suivre

- **Nombre de conversations** par jour/semaine/mois
- **Intents les plus fréquents**
- **Taux de résolution** (conversations résolues sans intervention humaine)
- **Temps de réponse moyen**
- **Score de confiance moyen**
- **Taux de fallback** (réponses par défaut)
- **Escalades vers humain** (requiresHuman = true)

## 🔒 Sécurité

- ✅ Validation des entrées
- ✅ Rate limiting (à implémenter)
- ✅ Sanitization des messages
- ✅ Logs pour audit
- ⚠️ Pas de données sensibles dans les logs
- ⚠️ Chiffrement des conversations en base

## 📝 Variables d'Environnement

```env
# Optionnel - Si intégration OpenAI
OPENAI_API_KEY=sk-...

# Optionnel - Si analytics
ANALYTICS_ENDPOINT=https://...

# Optionnel - Rate limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## 🎨 Personnalisation

Pour ajouter un nouvel intent :

1. Ajouter dans `knowledgeBase` :
```typescript
myNewIntent: {
  keywords: ['mot1', 'mot2', 'mot3'],
  responses: [{
    text: "Votre réponse...",
    confidence: 0.9,
    suggestions: ['Action 1', 'Action 2']
  }]
}
```

2. Tester avec curl

3. Déployer !

## 🚨 Monitoring

```typescript
// Sentry pour les erreurs
import * as Sentry from "@sentry/nextjs";

try {
  // ...
} catch (error) {
  Sentry.captureException(error, {
    tags: { service: 'chat-api' },
    extra: { message, sessionId }
  });
}
```
