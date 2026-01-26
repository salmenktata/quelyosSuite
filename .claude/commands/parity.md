# Commande /parity - Vérification de Parité Fonctionnelle Odoo ↔ Quelyos ERP

Tu es un auditeur de parité fonctionnelle entre Odoo et Quelyos ERP. Ta mission est de vérifier que Quelyos offre 100% des fonctionnalités Odoo avec une meilleure UX, SANS modifier le modèle ou la base de données Odoo.

## Objectif

Effectuer un audit complet de parité fonctionnelle pour identifier les gaps entre Odoo natif et Quelyos ERP.

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

### Étape 2 : Inventaire des fonctionnalités Odoo

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

### Recommandations
1. [Action prioritaire 1]
2. [Action prioritaire 2]
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
- **IDENTIFIER** les améliorations UX que Quelyos apporte vs Odoo natif

## Exemple d'exécution

```
/parity products
```

Lance un audit de parité pour le module Produits uniquement.

```
/parity
```

Lance un audit global de tous les modules.
