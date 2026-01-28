# Commande /ecommerce - Audit E-commerce & Roadmap Évolutions 2026

Tu es un expert e-commerce spécialisé dans l'analyse de plateformes de vente en ligne. Ta mission est **double** :

1. **Audit d'exploitation** : Vérifier que les fonctionnalités du Backoffice sont bien exploitées côté Frontend (vitrine-client)
2. **Roadmap évolutions** : Proposer des fonctionnalités innovantes basées sur les tendances 2026 et les leaders mondiaux (Shopify, Amazon, Alibaba, Zalando, ASOS)

## Objectif Principal

**Vision stratégique** : Transformer vitrine-client en une plateforme e-commerce de classe mondiale, compétitive avec les meilleurs du marché.

## Paramètre optionnel

$ARGUMENTS

Options disponibles :
- `/ecommerce` - Audit complet (exploitation + roadmap)
- `/ecommerce audit` - Audit exploitation uniquement
- `/ecommerce roadmap` - Roadmap évolutions uniquement
- `/ecommerce [module]` - Focus sur un module (products, cart, checkout, account, search)

---

## PARTIE 1 : AUDIT D'EXPLOITATION BACKOFFICE → FRONTEND

### Étape 1.1 : Inventaire API Backoffice

**Scanner les endpoints disponibles** :

```bash
# Endpoints produits
grep -rn "route=" odoo-backend/addons/quelyos_api/controllers/ --include="*.py" | grep -E "products|catalog"

# Endpoints commandes
grep -rn "route=" odoo-backend/addons/quelyos_api/controllers/ --include="*.py" | grep -E "orders|cart|checkout"

# Endpoints clients
grep -rn "route=" odoo-backend/addons/quelyos_api/controllers/ --include="*.py" | grep -E "customer|account|auth"
```

**Créer matrice des fonctionnalités Backend** :

| Fonctionnalité Backend | Endpoint | Exploité Frontend | Status |
|------------------------|----------|-------------------|--------|
| Liste produits | `/api/ecommerce/products` | ✅/❌ | |
| Filtres avancés | `/api/ecommerce/products?filters=` | ✅/❌ | |
| Variantes produits | `/api/ecommerce/products/{id}/variants` | ✅/❌ | |
| Stock temps réel | `/api/ecommerce/products/{id}/stock` | ✅/❌ | |
| Prix dynamiques | `/api/ecommerce/pricelists` | ✅/❌ | |
| Promotions | `/api/ecommerce/promotions` | ✅/❌ | |
| Wishlist | `/api/ecommerce/wishlist` | ✅/❌ | |
| Comparateur | (local) | ✅/❌ | |
| Avis clients | `/api/ecommerce/reviews` | ✅/❌ | |
| Recommandations | `/api/ecommerce/recommendations` | ✅/❌ | |

### Étape 1.2 : Scan Frontend - Appels API

**Identifier les appels API dans vitrine-client** :

```bash
# Tous les appels API
grep -rn "fetch\|axios\|api\." vitrine-client/src --include="*.ts" --include="*.tsx" | grep -v node_modules

# Hooks de données
grep -rn "useQuery\|useMutation\|use[A-Z].*\(" vitrine-client/src/hooks --include="*.ts"

# Stores Zustand
grep -rn "create\|useStore" vitrine-client/src/store --include="*.ts"
```

### Étape 1.3 : Matrice de Couverture

**Générer rapport d'exploitation** :

```
═══════════════════════════════════════════════════════════════════
📊 AUDIT EXPLOITATION BACKOFFICE → FRONTEND
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ MODULE PRODUITS                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Liste produits paginée                    [EXPLOITÉ]         │
│ ✅ Détail produit avec variantes             [EXPLOITÉ]         │
│ ⚠️  Filtres multi-attributs                  [PARTIEL]          │
│ ❌ Prix par quantité (volume pricing)        [NON EXPLOITÉ]     │
│ ❌ Produits configurables                    [NON EXPLOITÉ]     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ MODULE PANIER & CHECKOUT                                        │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Ajout/suppression panier                  [EXPLOITÉ]         │
│ ✅ Codes promo                               [EXPLOITÉ]         │
│ ⚠️  Estimation livraison                     [PARTIEL]          │
│ ❌ Sauvegarde panier (guest)                 [NON EXPLOITÉ]     │
│ ❌ Multi-adresses livraison                  [NON EXPLOITÉ]     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ MODULE COMPTE CLIENT                                            │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Inscription / Connexion                   [EXPLOITÉ]         │
│ ✅ Historique commandes                      [EXPLOITÉ]         │
│ ⚠️  Wishlist                                 [PARTIEL]          │
│ ❌ Points fidélité                           [NON EXPLOITÉ]     │
│ ❌ Parrainage                                [NON EXPLOITÉ]     │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
📈 SCORE EXPLOITATION : 65% (13/20 fonctionnalités)
═══════════════════════════════════════════════════════════════════
```

### Étape 1.4 : Actions Correctives

Pour chaque fonctionnalité **NON EXPLOITÉE** ou **PARTIELLE**, proposer :

1. **Fichiers à modifier** (Frontend)
2. **Endpoint API à appeler** (Backend)
3. **Composants UI à créer**
4. **Priorité** (P0/P1/P2)

---

## PARTIE 2 : ROADMAP ÉVOLUTIONS E-COMMERCE 2026

### Étape 2.1 : Benchmark Leaders Mondiaux

**Analyser les fonctionnalités des top plateformes** :

| Plateforme | Forces | Fonctionnalités Clés 2026 |
|------------|--------|---------------------------|
| **Shopify** | UX, Apps, Checkout | Shop Pay, AR Try-On, AI Search |
| **Amazon** | Logistique, Reco | Buy with Prime, Voice Commerce, Same-day |
| **Alibaba** | Social Commerce | Livestream, Group Buying, Gamification |
| **Zalando** | Mode, Personnalisation | Virtual Fitting Room, Style Advisor AI |
| **ASOS** | Gen-Z, Mobile-first | Visual Search, See My Fit, Instant Checkout |
| **Shein** | Fast Fashion, Prix | Flash Sales, Coins/Rewards, UGC Reviews |

### Étape 2.2 : Tendances E-commerce 2026

**Catégoriser par priorité d'implémentation** :

#### 🔥 TENDANCES CRITIQUES (Must-Have 2026)

| Tendance | Description | Impact Business | Complexité |
|----------|-------------|-----------------|------------|
| **AI-Powered Search** | Recherche sémantique, comprend l'intention | +30% conversion | Moyenne |
| **Visual Search** | Recherche par image (upload photo) | +25% engagement | Haute |
| **Personnalisation AI** | Recommandations hyper-personnalisées | +40% panier moyen | Moyenne |
| **One-Click Checkout** | Paiement instantané (Apple Pay, Google Pay) | +15% conversion | Basse |
| **Mobile-First PWA** | App-like experience, offline mode | +50% mobile sales | Moyenne |

#### ⚡ TENDANCES ÉMERGENTES (Nice-to-Have)

| Tendance | Description | Impact Business | Complexité |
|----------|-------------|-----------------|------------|
| **AR/VR Try-On** | Essayage virtuel (mode, déco) | +20% conversion mode | Très haute |
| **Livestream Shopping** | Ventes en direct (TikTok-style) | +60% engagement Gen-Z | Haute |
| **Voice Commerce** | Commande vocale (Alexa, Siri) | +10% commandes récurrentes | Haute |
| **Social Commerce** | Achat direct Instagram/TikTok | +35% découverte produits | Moyenne |
| **Sustainability Scoring** | Score écologique par produit | +25% fidélisation millennials | Basse |

#### 🚀 TENDANCES FUTURES (2027+)

| Tendance | Description | Impact Business | Complexité |
|----------|-------------|-----------------|------------|
| **Web3 Loyalty** | NFT rewards, token-gated access | Communauté exclusive | Très haute |
| **AI Shopping Assistant** | Chatbot conseiller personnel | -40% support, +20% conversion | Haute |
| **Predictive Inventory** | Stock anticipé par ML | -30% ruptures | Très haute |
| **Headless Commerce** | Multi-canal unifié (web, app, IoT) | Scalabilité infinie | Haute |

### Étape 2.3 : Roadmap Proposée

**Générer roadmap priorisée** :

```
═══════════════════════════════════════════════════════════════════
🚀 ROADMAP ÉVOLUTIONS E-COMMERCE 2026
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ Q1 2026 - FONDATIONS (Quick Wins)                               │
├─────────────────────────────────────────────────────────────────┤
│ □ One-Click Checkout (Apple Pay, Google Pay)                    │
│   → Impact: +15% conversion | Effort: 2 semaines                │
│                                                                 │
│ □ Amélioration recherche (autocomplete, suggestions)            │
│   → Impact: +20% recherches | Effort: 1 semaine                 │
│                                                                 │
│ □ PWA complète (installation, offline catalog)                  │
│   → Impact: +30% mobile | Effort: 2 semaines                    │
│                                                                 │
│ □ Wishlist partageable (social sharing)                         │
│   → Impact: +10% viralité | Effort: 3 jours                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Q2 2026 - PERSONNALISATION                                      │
├─────────────────────────────────────────────────────────────────┤
│ □ Recommandations AI (similar, frequently bought)               │
│   → Impact: +25% panier | Effort: 3 semaines                    │
│                                                                 │
│ □ Programme fidélité (points, tiers, rewards)                   │
│   → Impact: +40% rétention | Effort: 4 semaines                 │
│                                                                 │
│ □ Notifications push personnalisées                             │
│   → Impact: +15% retour | Effort: 2 semaines                    │
│                                                                 │
│ □ Recently viewed + "Continue shopping"                         │
│   → Impact: +10% conversion | Effort: 3 jours                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Q3 2026 - EXPÉRIENCE AVANCÉE                                    │
├─────────────────────────────────────────────────────────────────┤
│ □ Visual Search (recherche par image)                           │
│   → Impact: +25% engagement | Effort: 4 semaines                │
│                                                                 │
│ □ AI Search sémantique (comprend "robe pour mariage été")       │
│   → Impact: +30% conversion | Effort: 3 semaines                │
│                                                                 │
│ □ Avis avec photos/vidéos UGC                                   │
│   → Impact: +35% confiance | Effort: 2 semaines                 │
│                                                                 │
│ □ Comparateur produits avancé                                   │
│   → Impact: +15% décision | Effort: 1 semaine                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Q4 2026 - DIFFÉRENCIATION                                       │
├─────────────────────────────────────────────────────────────────┤
│ □ Livestream Shopping (ventes en direct)                        │
│   → Impact: +60% Gen-Z | Effort: 6 semaines                     │
│                                                                 │
│ □ AR Try-On (mode, accessoires)                                 │
│   → Impact: +20% conversion | Effort: 8 semaines                │
│                                                                 │
│ □ Chatbot AI conseiller                                         │
│   → Impact: -40% support | Effort: 4 semaines                   │
│                                                                 │
│ □ Social Commerce (Instagram/TikTok integration)                │
│   → Impact: +35% découverte | Effort: 3 semaines                │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
```

### Étape 2.4 : Fiches Fonctionnalités Détaillées

Pour chaque fonctionnalité proposée, générer une fiche :

```markdown
## 🎯 [NOM FONCTIONNALITÉ]

**Priorité** : P0/P1/P2
**Complexité** : Basse/Moyenne/Haute
**Impact estimé** : +X% [métrique]

### Description
[Description courte de la fonctionnalité]

### Benchmark
- **Shopify** : [Comment Shopify le fait]
- **Amazon** : [Comment Amazon le fait]

### Implémentation Technique

**Backend (Odoo)** :
- Modèle(s) à créer/modifier : `[model.name]`
- Endpoint(s) API : `POST /api/ecommerce/[endpoint]`

**Frontend (vitrine-client)** :
- Page(s) : `src/app/[page]/page.tsx`
- Composant(s) : `src/components/[Component].tsx`
- Hook(s) : `src/hooks/use[Hook].ts`
- Store(s) : `src/store/[store]Store.ts`

**Backoffice (dashboard-client)** :
- Page admin : `src/pages/[module]/[page].tsx`
- Configuration : [Paramètres administrables]

### User Stories
1. En tant que client, je veux [action] pour [bénéfice]
2. En tant qu'admin, je veux [action] pour [bénéfice]

### KPIs à Suivre
- [ ] Taux de conversion : +X%
- [ ] Panier moyen : +X€
- [ ] Taux de rebond : -X%
```

---

## PARTIE 3 : RAPPORT FINAL

### Format de Sortie

```
═══════════════════════════════════════════════════════════════════
🛒 AUDIT E-COMMERCE COMPLET - QUELYOS
═══════════════════════════════════════════════════════════════════
Date : [DATE]
Version analysée : vitrine-client v[X.X.X]

═══════════════════════════════════════════════════════════════════
📊 PARTIE 1 : EXPLOITATION BACKOFFICE
═══════════════════════════════════════════════════════════════════

Score global : XX% (XX/XX fonctionnalités exploitées)

[Détail par module...]

Actions prioritaires :
1. [Action 1] - Impact: [X] - Effort: [Y]
2. [Action 2] - Impact: [X] - Effort: [Y]
3. [Action 3] - Impact: [X] - Effort: [Y]

═══════════════════════════════════════════════════════════════════
🚀 PARTIE 2 : ROADMAP ÉVOLUTIONS 2026
═══════════════════════════════════════════════════════════════════

Fonctionnalités proposées : XX
- Quick Wins (Q1) : XX fonctionnalités
- Personnalisation (Q2) : XX fonctionnalités
- Expérience avancée (Q3) : XX fonctionnalités
- Différenciation (Q4) : XX fonctionnalités

Top 5 recommandations :
1. [Fonctionnalité 1] - ROI estimé: +XX%
2. [Fonctionnalité 2] - ROI estimé: +XX%
3. [Fonctionnalité 3] - ROI estimé: +XX%
4. [Fonctionnalité 4] - ROI estimé: +XX%
5. [Fonctionnalité 5] - ROI estimé: +XX%

═══════════════════════════════════════════════════════════════════
📋 PROCHAINES ÉTAPES
═══════════════════════════════════════════════════════════════════

□ Valider priorités avec stakeholders
□ Créer tickets JIRA/Linear pour Q1
□ Planifier sprints développement
□ Définir KPIs de suivi

═══════════════════════════════════════════════════════════════════
```

---

## Règles d'Exécution

1. **Toujours scanner le code réel** avant de générer le rapport
2. **Citer les fichiers exacts** (chemin + ligne) pour chaque constat
3. **Prioriser par ROI** (impact / effort)
4. **Rester réaliste** sur les estimations de complexité
5. **S'adapter au contexte** Quelyos (B2B, multi-tenant, Tunisie/France)

## Intégration avec Autres Commandes

- `/coherence` : Vérifier cohérence technique après ajout fonctionnalité
- `/parity` : Vérifier parité Odoo ↔ Quelyos
- `/uiux` : Auditer UX des nouvelles pages
- `/perf` : Vérifier performance après ajout fonctionnalité
