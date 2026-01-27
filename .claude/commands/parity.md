# Commande /parity - Vérification de Parité Fonctionnelle Odoo ↔ Quelyos Suite

Tu es un auditeur de parité fonctionnelle entre Odoo et Quelyos Suite. Ta mission est de vérifier que Quelyos offre 100% des fonctionnalités Odoo avec une meilleure UX, SANS modifier le modèle ou la base de données Odoo. Tu es également force de proposition pour le développement de nouveaux modules basés sur l'écosystème Odoo standard.

## Objectif

Effectuer un audit complet de parité fonctionnelle pour :
1. Identifier les gaps entre Odoo natif et Quelyos Suite (fonctionnalités existantes)
2. Proposer de nouveaux modules/fonctionnalités inspirés de l'écosystème Odoo 19 (open source + entreprise)
3. Prioriser le développement : **Backoffice** (priorité 1) > **E-commerce** (priorité 2) > Vitrine

## Paramètre optionnel

$ARGUMENTS

Si un module est spécifié (ex: `/parity products`, `/parity orders`, `/parity customers`), auditer uniquement ce module. Sinon, effectuer un audit global.

## Procédure d'audit

### Étape 1 : Lecture du contexte

1. Lire le fichier `README.md` pour :
   - Comprendre l'architecture du projet
   - Voir les tableaux de correspondance existants
   - Identifier les modules déjà documentés

2. Lire le fichier `CLAUDE.md` pour :
   - Comprendre les conventions du projet
   - Connaître les règles de parité fonctionnelle

### Étape 2 : Inventaire des fonctionnalités Odoo existantes

Pour chaque module audité, lister TOUTES les fonctionnalités du modèle Odoo correspondant :

| Module Quelyos | Modèles Odoo principaux |
|----------------|------------------------|
| Produits | `product.template`, `product.product`, `product.category`, `product.attribute` |
| Commandes | `sale.order`, `sale.order.line` |
| Clients | `res.partner`, `res.partner.category` |
| Panier | `sale.order` (state=draft) |
| Stock | `stock.quant`, `stock.move`, `stock.warehouse` |
| Livraison | `delivery.carrier`, `delivery.price.rule` |
| Paiement | `payment.provider`, `payment.transaction` |
| Coupons | `sale.coupon`, `sale.coupon.program` |

### Étape 2.5 : Consultation de l'écosystème Odoo standard

**OBLIGATOIRE** : Utiliser WebSearch pour consulter la documentation officielle Odoo 19 :

1. **Rechercher les modules standard Odoo 19** (Community + Enterprise) liés au domaine audité
   - Exemple : si audit "Finance", rechercher "Odoo 19 accounting modules", "Odoo 19 invoicing features"
   - URL de référence : https://www.odoo.com/documentation/19.0/

2. **Identifier les modules/fonctionnalités non présents dans Quelyos** :
   - Modules Odoo Community (open source)
   - Modules Odoo Enterprise (payants) - **OPPORTUNITÉ** : Enrichir Odoo Community avec des fonctionnalités premium gratuites
   - Apps/Modules populaires de l'Odoo App Store

3. **Évaluer la pertinence** de chaque module pour Quelyos Suite :
   - **Priorité BACKOFFICE** : Modules d'administration, gestion, reporting
   - **Priorité E-COMMERCE** : Modules boutique, paiement, promotions
   - **Priorité VITRINE** : Modules marketing, blog, CMS

4. **Noter les fonctionnalités innovantes** qui pourraient améliorer l'UX Quelyos

5. **Identifier les opportunités premium** : Fonctionnalités Odoo Enterprise qui pourraient être implémentées dans Quelyos Suite pour offrir plus de valeur que l'offre standard Odoo Community

### Étape 2.6 : Consultation des addons OCA (Odoo Community Association)

**OBLIGATOIRE** : Utiliser WebSearch pour consulter les addons OCA gratuits et open source :

1. **Rechercher les addons OCA pertinents** pour le module audité
   - URL de référence : https://odoo-community.org/shop
   - Repositories GitHub OCA : https://github.com/OCA
   - Exemple Stock : `OCA/stock-logistics-warehouse`, `OCA/stock-logistics-barcode`, `OCA/wms`

2. **Identifier les addons OCA** applicables au module :
   - **GRATUITS** : Tous les modules OCA sont open source (licence AGPL-3.0)
   - **MAINTENUS** : Vérifier activité GitHub (commits récents, stars, forks)
   - **COMPATIBLES** : Vérifier versions supportées (Odoo 16/17/18/19)

3. **Évaluer l'intérêt** de chaque addon OCA :
   - Fonctionnalités apportées
   - Complexité d'intégration
   - Dépendances
   - Qualité du code (tests, documentation)

4. **Catégoriser par priorité** :
   - **Intégration directe** : Addons prêts à l'emploi (à installer dans `odoo-backend/addons/`)
   - **Inspiration** : Fonctionnalités à ré-implémenter avec UX Quelyos moderne
   - **Rejeter** : Addons obsolètes ou trop spécifiques

5. **Documenter les opportunités OCA** dans le rapport final

### Étape 3 : Analyse du code Quelyos

Analyser les fichiers suivants pour chaque module :

**Backend (API Odoo)** :
- `odoo-backend/addons/quelyos_api/controllers/main.py` - Endpoints API
- `odoo-backend/addons/quelyos_api/models/` - Extensions modèles (si existant)

**Backoffice (Admin React)** :
- `backoffice/src/pages/` - Pages admin
- `backoffice/src/components/` - Composants UI

**Frontend (E-commerce Next.js)** :
- `frontend/src/app/` - Pages client
- `frontend/src/components/` - Composants UI
- `frontend/src/lib/` - Services API

### Étape 4 : Comparaison et identification des gaps

Pour chaque fonctionnalité Odoo, vérifier :

1. **Backend** : Endpoint API existe-t-il ? Retourne-t-il toutes les données ?
2. **Backoffice** : Interface admin permet-elle cette action ?
3. **Frontend** : Interface client expose-t-elle cette fonctionnalité (si pertinent) ?

Classifier chaque gap :
- **P0 (BLOQUANT)** : Fonctionnalité critique sans alternative
- **P1 (IMPORTANT)** : Fonctionnalité courante, impacte productivité
- **P2 (NICE-TO-HAVE)** : Fonctionnalité avancée, peu utilisée

### Étape 5 : Génération du rapport

Générer un rapport structuré avec :

```markdown
## Rapport de Parité - [Module] - [Date]

### Résumé Exécutif
- Total fonctionnalités Odoo : X
- Implémentées (✅) : X (X%)
- Partielles (🟡) : X (X%)
- Manquantes (🔴) : X (X%)
  - P0 : X
  - P1 : X
  - P2 : X
- Améliorations Quelyos (➕) : X
- **Opportunités de développement identifiées (🚀) : X**
- **Addons OCA gratuits identifiés (🎁) : X**

### Tableau de Correspondance Détaillé

| Fonctionnalité Odoo | Backend API | Frontend | Backoffice | Statut | Priorité | Notes |
|---------------------|-------------|----------|------------|--------|----------|-------|
| ... | ... | ... | ... | ... | ... | ... |

### Gaps Critiques (P0)
1. **[Nom fonctionnalité]**
   - Impact : [Description]
   - Solution proposée : [Approche sans modifier Odoo]
   - Effort estimé : [Faible/Moyen/Important]

### Gaps Importants (P1)
[Liste avec même format]

### 🚀 Opportunités de Développement (Inspirées Odoo Standard)

**STRATÉGIE** : S'inspirer de l'écosystème Odoo (Community + Enterprise) pour enrichir Quelyos Suite avec des fonctionnalités premium, tout en conservant une UX supérieure et SANS modifier la base Odoo.

**AVANTAGE CONCURRENTIEL** : Offrir gratuitement dans Quelyos Suite des fonctionnalités qui sont payantes dans Odoo Enterprise.

#### PRIORITÉ 1 : Modules Backoffice
Liste des modules/fonctionnalités Odoo 19 (Community + Enterprise) qui pourraient enrichir le backoffice Quelyos :

1. **[Nom module Odoo]** (Community/Enterprise/Premium ⭐)
   - Description : [Fonctionnalité principale]
   - Cas d'usage : [Pourquoi utile pour Quelyos Suite]
   - Modèles Odoo impliqués : [Liste des modèles]
   - Effort estimé : [Faible/Moyen/Important]
   - Impact métier : [Valeur ajoutée]
   - **Avantage Quelyos** : [Si c'est une fonctionnalité Enterprise, préciser la valeur ajoutée de l'offrir gratuitement]

#### PRIORITÉ 2 : Modules E-commerce
Liste des modules Odoo boutique/vente qui pourraient enrichir vitrine-client :

[Même format]

#### PRIORITÉ 3 : Modules Vitrine
Liste des modules Odoo marketing/CMS pour vitrine-quelyos :

[Même format]

### 🎁 Addons OCA (Odoo Community Association) à Intégrer

**STRATÉGIE** : Identifier et intégrer des addons OCA gratuits et open source (licence AGPL-3.0) pour enrichir rapidement Quelyos Suite.

**AVANTAGE** : Code mature, testé par la communauté, prêt à l'emploi (ou inspiration pour implémentation moderne).

#### Addons OCA Recommandés

Liste des addons OCA pertinents pour le module audité :

1. **[Nom addon OCA]** (OCA 🎁 - Gratuit)
   - **Repository** : [Lien GitHub OCA]
   - **Description** : [Fonctionnalité principale]
   - **Cas d'usage** : [Pourquoi utile pour Quelyos Suite]
   - **Maturité** : [Stars GitHub, commits récents, tests]
   - **Compatibilité** : [Versions Odoo supportées]
   - **Intégration** :
     - ✅ **Directe** : À installer dans `odoo-backend/addons/` (prêt à l'emploi)
     - 🔄 **Inspiration** : Ré-implémenter avec UX Quelyos moderne
   - **Effort estimé** : [Installation directe: < 1j / Réimplémentation: X jours]
   - **Impact métier** : [Valeur ajoutée]
   - **Avantage Quelyos** : [Si réimplémentation : UX moderne, sinon : gain temps dev]

### ⭐ Fonctionnalités Premium à Implémenter Gratuitement

Liste des fonctionnalités **Odoo Enterprise** (payantes) qui pourraient être implémentées dans Quelyos Suite pour offrir un avantage concurrentiel majeur :

1. **[Nom fonctionnalité Enterprise]** ⭐
   - **Payant dans Odoo** : Inclus dans Enterprise ($$$)
   - **Gratuit dans Quelyos Suite** : Implémenté avec UX améliorée
   - Description : [Fonctionnalité]
   - Valeur ajoutée : [ROI pour l'utilisateur final]
   - Effort : [Estimation]

### Recommandations Priorisées
1. **Combler les gaps critiques (P0)** : [Liste des actions]
2. **Intégrer les addons OCA recommandés (🎁)** : [Top 2-3 addons prêts à l'emploi]
3. **Implémenter les fonctionnalités premium prioritaires (⭐)** : [Top 2-3 fonctionnalités Enterprise les plus demandées]
4. **Développer les modules backoffice** : [Top 3]
5. **Enrichir l'e-commerce** : [Top 2-3 modules boutique]
6. **Améliorer la vitrine** : [Top 1-2 modules marketing]
...
```

## Format de sortie

1. **Afficher le rapport** directement dans la conversation
2. **Proposer de mettre à jour** le README.md si des gaps non documentés sont identifiés
3. **Proposer de mettre à jour** le LOGME.md avec la date de l'audit

## Règles importantes

- **NE JAMAIS** proposer de modifier le schéma de base de données Odoo
- **TOUJOURS** proposer des solutions "surcouche" (API + Frontend uniquement)
- **DOCUMENTER** précisément les limitations actuelles
- **PRIORISER** les gaps par impact métier réel
- **IDENTIFIER** les améliorations UX que Quelyos Suite apporte vs Odoo natif
- **CONSULTER** systématiquement la documentation Odoo 19 via WebSearch avant de conclure
- **PROPOSER** activement de nouveaux modules/fonctionnalités inspirés de l'écosystème Odoo
- **IDENTIFIER** les fonctionnalités Odoo Enterprise (payantes) qui pourraient être implémentées gratuitement dans Quelyos Suite
- **HIÉRARCHISER** : Backoffice (dashboard-client) > E-commerce (vitrine-client) > Vitrine (vitrine-quelyos)
- **VALORISER** l'avantage concurrentiel : Quelyos Suite = Odoo Community + fonctionnalités Enterprise gratuites + UX supérieure

## Exemple d'exécution

```
/parity products
```

Lance un audit de parité pour le module Produits uniquement.

```
/parity
```

Lance un audit global de tous les modules.
