# Plan d'Intégration Module Facturation ↔ Autres Modules Quelyos

## 🎯 Objectif
Garantir que les 18 améliorations du module Facturation s'intègrent **harmonieusement** avec les 8 autres modules de la Full Suite Quelyos (Finance, Store, Stock, CRM, Marketing, HR, Support, POS).

---

## 📊 Cartographie des Intégrations Critiques

### 1. **Facturation ↔ Finance** (Intégration Majeure)

#### Points d'Intégration Identifiés

**Backend Existant** :
- `chart_of_accounts_ctrl.py` - Plan comptable
- `payments_ctrl.py` - Paiements génériques
- `payment.py` - Logique paiements
- `payment_stripe.py` - Intégration Stripe
- `analytic_accounting_ctrl.py` - Comptabilité analytique

**Intégrations Plan d'Évolution** :

| Amélioration | Impact Finance | Fichiers Touchés | Type Intégration |
|--------------|----------------|------------------|------------------|
| **1.1. Stats Backend** | ✅ Réutilisable pour dashboard Finance | `invoices_ctrl.py` (nouveau endpoint `/stats`) | Lecture seule |
| **2.1. Cash Flow Forecasting** | ⭐ **CRITIQUE** - Dashboard Finance utilise prédictions | `cash_flow_forecast.py` (nouveau), `/finance/forecast` (page existante) | Bidirectionnelle |
| **3.1. Rapprochement Bancaire** | ⭐ **CRITIQUE** - Écritures comptables auto | `bank_reconciliation_ctrl.py` (nouveau), `chart_of_accounts_ctrl.py` (extension) | Écriture |
| **3.2. Portail Expert-Comptable** | ✅ Export FEC déjà existant à étendre | `accountant_portal_ctrl.py` (nouveau), `/invoicing/settings/fec` (existant) | Lecture + Export |
| **5.1. Facturation Récurrente** | ✅ Transactions récurrentes Finance | `subscription.py` (extend Odoo), `/finance/forecast` (lecture) | Lecture |

**Checklist Intégration** :
- ✅ **Utiliser modèle existant** : `account.move` (factures) + `account.payment` (paiements)
- ✅ **Respecter plan comptable** : Écritures 411 (Clients) / 512 (Banque) / 627 (Frais) via `chart_of_accounts_ctrl.py`
- ✅ **Webhook Stripe** : Étendre `payment_stripe.py` (lignes 50-120) au lieu de dupliquer
- ✅ **Cash Flow** : Lire transactions Finance via endpoint `/finance/transactions` au lieu de requête SQL directe

---

### 2. **Facturation ↔ CRM** (Scoring Clients)

#### Points d'Intégration Identifiés

**Backend Existant** :
- `customers_ctrl.py` - CRUD clients
- `payment_risk_ml_ctrl.py` - **⚠️ Module ML risque paiement DÉJÀ EXISTANT !**

**Découverte Importante** :
Le contrôleur `payment_risk_ml_ctrl.py` existe déjà. Nous devons **l'étendre** au lieu de créer un module scoring risque from scratch.

**Intégrations Plan d'Évolution** :

| Amélioration | Impact CRM | Fichiers Touchés | Type Intégration |
|--------------|------------|------------------|------------------|
| **2.2. Scoring Risque Impayé** | ⭐ **ÉTENDRE EXISTANT** - `payment_risk_ml_ctrl.py` | `customer_risk_score.py` → **NON**, étendre `payment_risk_ml_ctrl.py` | Lecture + Écriture |
| **2.2. Relances IA Personnalisées** | ✅ Lire profil client (secteur, ancienneté) | `customers_ctrl.py` (lecture), `payment_reminder_sequence.py` (nouveau) | Lecture seule |

**Checklist Intégration** :
- ✅ **Lire ML existant** : Endpoint `/api/payment-risk/score/<partner_id>` (vérifier si existe)
- ✅ **Étendre scoring** : Ajouter features (saisonnalité, litiges) au modèle existant
- ✅ **Badge CRM** : Afficher score 0-100 dans fiche client CRM (`/crm/customers/:id`)
- ✅ **Historique litiges** : Stocker dans `res.partner` (champ `x_payment_disputes`)

---

### 3. **Facturation ↔ Store** (E-commerce)

#### Points d'Intégration Identifiés

**Backend Existant** :
- `orders_ctrl.py` - Commandes e-commerce
- `products_ctrl.py` - Produits catalogue
- `delivery_payment_ctrl.py` - Livraisons + paiements

**Workflow Actuel** :
```
Commande Store → Paiement Stripe → Facture générée automatiquement ?
```

**Intégrations Plan d'Évolution** :

| Amélioration | Impact Store | Fichiers Touchés | Type Intégration |
|--------------|--------------|------------------|------------------|
| **1.4. Validation Zod** | ✅ Réutiliser schémas produits Store | `schemas.ts` (facturation + store unifiés) | Partagé |
| **4.1. E-invoicing 2026 PDP** | ⭐ **CRITIQUE** - Factures e-commerce conformes | `pdp_connector.py`, `orders_ctrl.py` (auto-send) | Automatisation |
| **5.1. Facturation Récurrente** | ✅ Abonnements produits SaaS Store | `subscription.py`, `/store/catalog/products` (flag `is_subscription`) | Bidirectionnelle |
| **Stripe Webhooks** | ⭐ **CRITIQUE** - Commande → Paiement → Facture | `payment_stripe.py` (étendre), `orders_ctrl.py` (webhook `order.paid`) | Automatisation |

**Checklist Intégration** :
- ✅ **Auto-facturation commandes** : Webhook `sale.order` confirmé → Création `account.move` automatique
- ✅ **Ligne facture = ligne commande** : Mapper `sale.order.line` → `account.move.line` (même description, prix, TVA)
- ✅ **Conformité e-commerce** : Factures e-commerce DOIVENT être Factur-X (obligation DSP2)
- ✅ **Abonnements SaaS** : Produits flaggés `x_is_subscription` → Facture récurrente auto

---

### 4. **Facturation ↔ Stock** (Livraisons)

#### Points d'Intégration Identifiés

**Backend Existant** :
- `delivery_payment_ctrl.py` - Livraisons
- `stock_ctrl.py` (à vérifier si existe)

**Workflow Actuel** :
```
Commande → Bon de livraison → Facture ?
```

**Intégrations Plan d'Évolution** :

| Amélioration | Impact Stock | Fichiers Touchés | Type Intégration |
|--------------|--------------|------------------|------------------|
| **Lien Livraison-Facture** | ✅ Facture créée APRÈS livraison confirmée | `delivery_payment_ctrl.py`, `invoices_ctrl.py` (champ `delivery_id`) | Référence |
| **Validation Facture** | ⚠️ Bloquer validation si livraison non effectuée | `invoices_ctrl.py` (validation rules) | Validation métier |

**Checklist Intégration** :
- ✅ **Référence livraison** : Champ `x_delivery_ref` sur `account.move`
- ✅ **Statut cohérent** : Facture "Payée" → Livraison "Livrée" (vérification croisée)
- ✅ **Blocage validation** : Si produits physiques NON livrés → Bloquer validation facture (configurable)

---

### 5. **Facturation ↔ Marketing** (Analytics)

#### Points d'Intégration Identifiés

**Backend Existant** :
- `marketing_ctrl.py` (à vérifier)
- Newsletters, campagnes promo

**Intégrations Plan d'Évolution** :

| Amélioration | Impact Marketing | Fichiers Touchés | Type Intégration |
|--------------|------------------|------------------|------------------|
| **2.1. DSO Analytics** | ✅ Segmentation clients (bon/mauvais payeurs) | Dashboard Marketing (lecture stats) | Lecture seule |
| **2.2. Relances IA** | ✅ Exclusion campagnes (clients en retard) | `customers_ctrl.py` (flag `x_payment_overdue`) | Lecture seule |

**Checklist Intégration** :
- ✅ **Segmentation** : Segment "Clients à risque" (DSO > 60j) exclu des campagnes promo
- ✅ **Analytics** : Taux conversion commande → paiement (Module Marketing utilise données Facturation)

---

### 6. **Facturation ↔ HR** (Frais)

#### Points d'Intégration Identifiés

**Backend Existant** :
- `hr_expense_ctrl.py` (à vérifier - notes de frais)

**Intégrations Plan d'Évolution** :

| Amélioration | Impact HR | Fichiers Touchés | Type Intégration |
|--------------|-----------|------------------|------------------|
| **3.1. Rapprochement Bancaire** | ✅ Notes de frais → Paiements auto | `bank_reconciliation_ctrl.py`, `hr_expense_ctrl.py` | Lecture |

**Checklist Intégration** :
- ✅ **Notes de frais** : Rapprochement bancaire détecte paiements notes de frais (via libellé "NOTE FRAIS #123")

---

### 7. **Facturation ↔ Support** (Litiges)

#### Points d'Intégration Identifiés

**Backend Existant** :
- `admin_tickets_ctrl.py` - Tickets support

**Intégrations Plan d'Évolution** :

| Amélioration | Impact Support | Fichiers Touchés | Type Intégration |
|--------------|----------------|------------------|------------------|
| **2.2. Scoring Risque** | ✅ Litiges paiement → Tickets auto | `payment_risk_ml_ctrl.py`, `admin_tickets_ctrl.py` | Création ticket |
| **Validation Facture** | ⚠️ Bloquer validation si litige client ouvert | `invoices_ctrl.py` (validation rules) | Lecture seule |

**Checklist Intégration** :
- ✅ **Ticket auto** : Impayé J+45 → Création ticket support "Recouvrement Client X"
- ✅ **Blocage validation** : Si ticket "Litige facture #123" ouvert → Bloquer édition facture

---

### 8. **Facturation ↔ POS** (Point de Vente)

#### Points d'Intégration Identifiés

**Backend Existant** :
- `pos_ctrl.py` (à vérifier - Point de vente)

**Intégrations Plan d'Évolution** :

| Amélioration | Impact POS | Fichiers Touchés | Type Intégration |
|--------------|------------|------------------|------------------|
| **4.1. E-invoicing 2026** | ✅ Tickets POS → Factures électroniques | `pos_ctrl.py`, `pdp_connector.py` | Automatisation |
| **Rapprochement Bancaire** | ✅ Encaissements POS → Rapprochement auto | `bank_reconciliation_ctrl.py`, `pos_ctrl.py` | Lecture |

**Checklist Intégration** :
- ✅ **Tickets POS** : Générer Factur-X pour montants > 1000€ (obligation B2B)
- ✅ **Encaissements** : Rapprochement bancaire identifie virements POS (via libellé "POS Session #123")

---

## 🔧 Modifications Contrôleurs Backend - Règles Strictes

### Règle 1 : **NE PAS DUPLIQUER** - Toujours étendre l'existant

| ❌ **INTERDIT** | ✅ **OBLIGATOIRE** |
|-----------------|---------------------|
| Créer `customer_risk_score.py` from scratch | Étendre `payment_risk_ml_ctrl.py` existant |
| Créer nouveau webhook Stripe | Étendre `payment_stripe.py` lignes 50-120 |
| Créer nouveau plan comptable | Utiliser `chart_of_accounts_ctrl.py` |
| Dupliquer logique paiements | Utiliser `payments_ctrl.py` + `payment.py` |

### Règle 2 : **ISOLATION ODOO** - Préfixes obligatoires

Tous les nouveaux champs sur modèles Odoo core DOIVENT avoir préfixe `x_` ou `tenant_id`.

**Exemple** :
```python
# ❌ INTERDIT - Héritage sans préfixe
class AccountMove(models.Model):
    _inherit = 'account.move'
    cash_flow_predicted = fields.Float()  # COLLISION POSSIBLE !

# ✅ OBLIGATOIRE - Préfixe x_
class AccountMove(models.Model):
    _inherit = 'account.move'
    x_cash_flow_predicted = fields.Float()
    x_risk_score = fields.Integer()
    x_delivery_ref = fields.Char()
```

### Règle 3 : **MULTI-TENANT** - Toujours filtrer par tenant_id

Tous les endpoints DOIVENT filtrer par `tenant_id` pour isolation SaaS.

**Exemple** :
```python
# ❌ INTERDIT - Pas de filtre tenant
invoices = AccountMove.search([('move_type', '=', 'out_invoice')])

# ✅ OBLIGATOIRE - Filtre tenant
tenant_id = self._get_tenant_id(user)
invoices = AccountMove.search([
    ('tenant_id', '=', tenant_id),
    ('move_type', '=', 'out_invoice'),
])
```

### Règle 4 : **API CONVENTIONSUSE** - Suivre `.claude/API_CONVENTIONS.md`

- Endpoints : `/api/<module>/<resource>` (ex: `/api/finance/invoices/stats`)
- Méthodes : `GET` (liste), `POST` (create/search), `PUT` (update), `DELETE` (delete)
- Réponses : `{ success: boolean, data: {}, error?: string }`
- Authentification : Header `Authorization: Bearer <token>`

---

## 📋 Checklist Pré-Implémentation (À Valider Avant Chaque Amélioration)

### Pour chaque amélioration du plan :

1. **Lire contrôleurs existants** :
   ```bash
   grep -r "class.*Controller" odoo-backend/addons/quelyos_api/controllers/
   ```

2. **Vérifier modèles Odoo** :
   ```bash
   grep -r "_inherit.*account.move" odoo-backend/addons/quelyos_*/models/
   ```

3. **Tester intégration** :
   - Créer facture → Vérifier impact Finance (trésorerie update)
   - Payer facture → Vérifier rapprochement bancaire
   - Valider facture → Vérifier blocages métier (livraison, litiges)

4. **Migration DB** :
   - Nouveaux champs → Script migration SQL
   - Incrémenter version `__manifest__.py`
   - Alerter utilisateur → `/upgrade-odoo`

5. **Documentation** :
   - Ajouter JSDoc en-tête endpoint
   - Mettre à jour `.claude/INVOICING_INTEGRATION_MAP.md` (ce fichier)
   - Commit message : `feat(invoicing): <amélioration> + intégration <module>`

---

## 🚀 Roadmap Implémentation avec Intégrations

### Phase 1 : Quick Wins Techniques (1-2 semaines)

**Sprint 1** :
- ✅ **1.1. Fix totalOverdue + Stats Backend**
  - Fichiers : `invoices_ctrl.py` (nouveau endpoint `/stats`)
  - Intégration : **Finance** (dashboard `/finance` utilise stats)
  - Test : Dashboard Finance affiche stats temps réel

- ✅ **1.3. Sonner Toast**
  - Fichiers : `useInvoices.ts`, `App.tsx`
  - Intégration : **Globale** (remplacer 81 `alert()` tous modules)
  - Test : Toasts non-bloquants sur toutes actions

- ✅ **1.4. Validation Zod**
  - Fichiers : `schemas.ts` (facturation + store + finance unifiés)
  - Intégration : **Store + Finance** (réutiliser schémas produits/comptes)
  - Test : Validation cohérente multi-modules

**Sprint 2-3** :
- ✅ **1.2. Migration TanStack Query**
  - Fichiers : `useInvoices.ts` (pattern `useProducts.ts` existant)
  - Intégration : **Store + CRM** (pattern réplicable)
  - Test : Cache partagé multi-modules (invalidation granulaire)

- ✅ **1.5. Notifications WebSocket**
  - Fichiers : `WebSocketClient.ts`, `NotificationCenter.tsx`
  - Intégration : **Globale** (tous modules utilisent channels)
  - Test : Notifications temps réel cross-modules

### Phase 2 : Intelligence Prédictive (2-3 semaines)

**Sprint 4-6** :
- ✅ **2.1. Cash Flow Forecasting + DSO**
  - Fichiers : `cash_flow_forecast.py`, `/finance/forecast` (étendre page existante)
  - Intégration : **Finance** ⭐ MAJEURE (dashboard utilise prédictions)
  - Test : Widget dashboard Finance affiche prévisions 30/60/90j

- ✅ **2.2. Scoring Risque + Relances IA**
  - Fichiers : `payment_risk_ml_ctrl.py` (**ÉTENDRE EXISTANT**), `customers_ctrl.py`
  - Intégration : **CRM + Marketing** (segmentation clients à risque)
  - Test : Badge score 0-100 dans fiche client CRM

### Phase 3 : Automatisation Comptable (3-4 semaines)

**Sprint 7-10** :
- ✅ **3.1. Rapprochement Bancaire Auto**
  - Fichiers : `bank_reconciliation_ctrl.py`, `payment_stripe.py` (étendre)
  - Intégration : **Finance + POS + HR** (transactions multi-sources)
  - Test : Rapprochement Stripe + virements + notes de frais

- ✅ **3.2. Portail Expert-Comptable**
  - Fichiers : `accountant_portal_ctrl.py`, `/invoicing/settings/fec` (étendre)
  - Intégration : **Finance** (export FEC existant)
  - Test : Export FEC temps réel conforme

### Phase 4 : Conformité Réglementaire (4-6 mois)

**Sprint 11-20** :
- ✅ **4.1. E-invoicing 2026 PDP**
  - Fichiers : `pdp_connector.py`, `orders_ctrl.py` (auto-send), `pos_ctrl.py`
  - Intégration : **Store + POS** ⭐ CRITIQUE (factures e-commerce conformes)
  - Test : Commande Store → Factur-X auto envoyée PDP

### Phase 5 : Fonctionnalités Avancées (2-3 semaines)

**Sprint 21-24** :
- ✅ **5.1. Facturation Récurrente**
  - Fichiers : `subscription.py` (extend `sale_subscription`), `/store/catalog/products`
  - Intégration : **Store + Finance** (produits SaaS + prévisions trésorerie)
  - Test : Abonnement SaaS → Facture mensuelle auto

---

## ✅ Validation Finale Intégration

### Tests d'Intégration End-to-End

**Scénario 1 : E-commerce → Facturation → Finance**
```
1. Client achète produit Store (100€)
2. Paiement Stripe webhook → Facture auto créée
3. Dashboard Finance : +100€ revenus
4. Rapprochement bancaire : 97,75€ (après frais) auto-réconcilié
5. Cash Flow : +97,75€ prévision J+2
```

**Scénario 2 : CRM → Facturation → Support**
```
1. Client CRM score risque = 85/100
2. Facture créée 500€
3. J+30 impayé → Relance IA personnalisée (ton formel)
4. J+45 toujours impayé → Ticket support auto "Recouvrement Client X"
5. Commercial notifié WebSocket temps réel
```

**Scénario 3 : Facturation Récurrente → Conformité**
```
1. Produit SaaS abonnement 50€/mois
2. J=1 : Facture auto générée
3. Format Factur-X (PDF/A-3 + XML EN 16931)
4. Transmission PDP → Client B2B
5. Archive AWS S3 10 ans
6. E-reporting fiscal auto (TVA pré-remplie)
```

---

## 📖 Conclusion

Ce plan d'intégration garantit que **chaque amélioration du module Facturation** :
1. ✅ **Réutilise** l'existant (pas de duplication)
2. ✅ **Respecte** l'architecture multi-tenant Odoo 19
3. ✅ **S'intègre** harmonieusement avec les 8 autres modules
4. ✅ **Suit** les conventions API et isolation Odoo
5. ✅ **Teste** les workflows cross-modules end-to-end

**Prochaine étape** : Implémenter Phase 1 (Quick Wins) en suivant strictement ce plan d'intégration.
