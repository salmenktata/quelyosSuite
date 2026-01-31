# Plan de Tests End-to-End - Marketplace Thèmes

## 📋 Vue d'ensemble

Tests complets couvrant les 4 flows principaux de la marketplace :
1. **Flow Designer** : Création profil → Soumission → Onboarding Stripe
2. **Flow Admin** : Validation → Payout → Analytics
3. **Flow Client** : Navigation → Achat → Installation
4. **Flow Webhooks** : Paiements → Payouts

---

## 🎯 Objectifs

- ✅ Valider tous les endpoints API
- ✅ Tester intégrations Stripe (Payments + Connect)
- ✅ Vérifier calculs revenue split (70/30)
- ✅ Valider workflows complets
- ✅ Tester cas d'erreur
- ✅ Vérifier sécurité (auth, permissions)

---

## 🔧 Prérequis

### Configuration Backend
```bash
# Paramètres système Odoo requis
payment.stripe.secret_key = "sk_test_..." (mode test)
payment.stripe.webhook_secret = "whsec_..." (webhook payments)
payment.stripe.connect_webhook_secret = "whsec_..." (webhook connect)
```

### Configuration Frontend
```bash
# Variables d'environnement
VITE_BACKEND_URL=http://localhost:8069
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Données de test
```sql
-- Créer utilisateur test designer
INSERT INTO res_users (login, password) VALUES ('designer@test.com', 'test123');

-- Créer utilisateur test admin
INSERT INTO res_users (login, password) VALUES ('admin@test.com', 'admin123');
-- Ajouter au groupe admin
INSERT INTO res_groups_users_rel (gid, uid)
SELECT g.id, u.id FROM res_groups g, res_users u
WHERE g.name = 'quelyos_admin' AND u.login = 'admin@test.com';

-- Créer tenant test
INSERT INTO quelyos_tenant (name, subdomain, active)
VALUES ('Test Store', 'teststore', TRUE);
```

### Comptes Stripe Test
- **Designer test** : Créer compte Express via onboarding
- **Cartes test** :
  - Succès : `4242 4242 4242 4242`
  - 3D Secure : `4000 0025 0000 3155`
  - Décliné : `4000 0000 0000 9995`

---

## 🧪 Test Suite 1 : Flow Designer

### Test 1.1 : Création profil designer

**Endpoint** : `POST /api/themes/designers/create`

**Données** :
```json
{
  "display_name": "Jane Designer",
  "email": "jane@designstudio.com",
  "bio": "Experte en design moderne",
  "portfolio_url": "https://janedesign.com"
}
```

**Assertions** :
- ✅ Status `201 Created`
- ✅ Designer créé avec `status = 'pending'`
- ✅ Email unique (erreur si doublon)
- ✅ User lié au designer

**Validation** :
```sql
SELECT * FROM quelyos_theme_designer WHERE email = 'jane@designstudio.com';
-- Expected: 1 row, status = 'pending'
```

---

### Test 1.2 : Soumission thème

**Endpoint** : `POST /api/themes/submissions/create`

**Données** :
```json
{
  "name": "Modern Fashion",
  "description": "Thème élégant pour boutiques de mode",
  "category": "fashion",
  "config_json": "{...}",  // Config JSON valide
  "is_premium": true,
  "price": 49.00,
  "thumbnail": "base64_image_data"
}
```

**Assertions** :
- ✅ Submission créée avec `status = 'draft'`
- ✅ Designer lié à la submission
- ✅ Config JSON valide (schéma)
- ✅ Thumbnail uploadé

**Validation** :
```sql
SELECT * FROM quelyos_theme_submission WHERE name = 'Modern Fashion';
-- Expected: status = 'draft', designer_id NOT NULL
```

---

### Test 1.3 : Soumettre pour validation

**Endpoint** : `POST /api/themes/submissions/{id}/submit`

**Assertions** :
- ✅ Status change `draft` → `submitted`
- ✅ `submit_date` renseignée
- ✅ Erreur si déjà soumis

**Validation** :
```sql
SELECT status, submit_date FROM quelyos_theme_submission WHERE id = ?;
-- Expected: status = 'submitted', submit_date NOT NULL
```

---

### Test 1.4 : Onboarding Stripe Connect

**Endpoint** : `POST /api/themes/designers/stripe-connect/onboard`

**Assertions** :
- ✅ Stripe Account créé (type Express)
- ✅ AccountLink URL retournée
- ✅ `stripe_connect_account_id` sauvegardé

**Validation manuelle** :
1. Copier URL AccountLink
2. Ouvrir dans navigateur
3. Compléter formulaire Stripe (mode test)
4. Vérifier redirection return_url

**Validation backend** :
```sql
SELECT stripe_connect_account_id, stripe_onboarding_completed
FROM quelyos_theme_designer WHERE id = ?;
-- Expected: account_id NOT NULL, onboarding_completed = TRUE (après complétion)
```

---

### Test 1.5 : Vérification statut onboarding

**Endpoint** : `POST /api/themes/designers/stripe-connect/status`

**Assertions** :
- ✅ `onboarding_completed = true`
- ✅ `payouts_enabled = true`
- ✅ `charges_enabled = true`

---

## 🧪 Test Suite 2 : Flow Admin

### Test 2.1 : Liste soumissions en attente

**Endpoint** : `GET /api/themes/submissions/pending`

**Assertions** :
- ✅ Retourne soumissions `status IN ('submitted', 'in_review')`
- ✅ Triées par `submit_date` ASC
- ✅ Admin uniquement (403 si non-admin)

---

### Test 2.2 : Approuver soumission

**Endpoint** : `POST /api/themes/submissions/{id}/approve`

**Assertions** :
- ✅ Status change `submitted` → `approved`
- ✅ `quelyos.theme` créé automatiquement
- ✅ `approval_date` renseignée
- ✅ `reviewer_id` = admin ID
- ✅ Thème publié sur marketplace

**Validation** :
```sql
-- Vérifier submission
SELECT status, approval_date, reviewer_id FROM quelyos_theme_submission WHERE id = ?;
-- Expected: status = 'approved', approval_date NOT NULL

-- Vérifier thème créé
SELECT * FROM quelyos_theme WHERE code LIKE '%modern-fashion%';
-- Expected: is_marketplace = TRUE, is_public = TRUE
```

---

### Test 2.3 : Rejeter soumission

**Endpoint** : `POST /api/themes/submissions/{id}/reject`

**Données** :
```json
{
  "reason": "Design non conforme aux standards"
}
```

**Assertions** :
- ✅ Status change → `rejected`
- ✅ `rejection_reason` sauvegardée
- ✅ Thème NON publié

---

### Test 2.4 : Consulter analytics

**Endpoint** : `POST /api/themes/analytics/overview`

**Assertions** :
- ✅ Admin uniquement (403 si non-admin)
- ✅ Métriques cohérentes :
  - `total_revenue = SUM(purchases.amount)`
  - `platform_revenue = total_revenue * 0.30`
  - `designer_revenue = total_revenue * 0.70`
- ✅ Pas d'erreur 500

---

### Test 2.5 : Trigger payout manuel

**Endpoint** : `POST /api/themes/designers/payout`

**Données** :
```json
{
  "designer_id": 1,
  "amount": 150.00
}
```

**Assertions** :
- ✅ Admin uniquement
- ✅ Designer doit avoir `stripe_payouts_enabled = true`
- ✅ `amount <= pending_balance`
- ✅ Minimum 5 EUR
- ✅ Stripe Transfer créé
- ✅ Revenues marqués `payout_status = 'processing'`

**Validation Stripe** :
```bash
# Vérifier transfer créé dans Stripe Dashboard
stripe transfers list --limit 1
```

**Validation DB** :
```sql
SELECT payout_status, stripe_transfer_id
FROM quelyos_theme_revenue
WHERE designer_id = 1 AND payout_status = 'processing';
-- Expected: au moins 1 row, stripe_transfer_id NOT NULL
```

---

## 🧪 Test Suite 3 : Flow Client

### Test 3.1 : Liste marketplace publique

**Endpoint** : `GET /api/themes/marketplace`

**Assertions** :
- ✅ Retourne uniquement thèmes `is_public = true` et `is_marketplace = true`
- ✅ Filtres fonctionnels (category, is_premium)
- ✅ Pagination (limit, offset)
- ✅ Tri (price, rating, sales_count)

---

### Test 3.2 : Détails thème

**Endpoint** : `GET /api/themes/marketplace/{id}`

**Assertions** :
- ✅ Retourne config_json complète
- ✅ Thumbnail URL valide
- ✅ Designer info (display_name, average_rating)
- ✅ Sales count, reviews

---

### Test 3.3 : Achat thème premium (Stripe)

#### Étape 3.3.1 : Créer Payment Intent

**Endpoint** : `POST /api/themes/{id}/stripe/create-payment-intent`

**Données** :
```json
{
  "theme_id": 1,
  "tenant_id": 5
}
```

**Assertions** :
- ✅ Payment Intent créé dans Stripe
- ✅ `client_secret` retourné
- ✅ `quelyos.theme.purchase` créé avec `status = 'pending'`

**Validation** :
```sql
SELECT * FROM quelyos_theme_purchase
WHERE submission_id = 1 AND tenant_id = 5 AND status = 'pending';
-- Expected: 1 row, stripe_payment_intent_id NOT NULL
```

---

#### Étape 3.3.2 : Confirmer paiement (Frontend)

**Action manuelle** :
1. Ouvrir page thème premium
2. Cliquer "Acheter"
3. Modal Stripe Elements s'ouvre
4. Entrer carte test `4242 4242 4242 4242`
5. Date expiration : `12/34`
6. CVC : `123`
7. Cliquer "Payer"

**Assertions frontend** :
- ✅ Formulaire se soumet
- ✅ Loading state affiché
- ✅ Pas d'erreur console
- ✅ Success message affiché
- ✅ Modal se ferme

---

#### Étape 3.3.3 : Webhook payment_intent.succeeded

**Trigger webhook** (local test) :
```bash
# Forwarder webhook vers local
stripe listen --forward-to http://localhost:8069/api/stripe/webhook

# Trigger événement test
stripe trigger payment_intent.succeeded
```

**Assertions backend** :
- ✅ Webhook reçu (log dans Odoo)
- ✅ Signature vérifiée
- ✅ Purchase status `pending` → `completed`
- ✅ `completion_date` renseignée
- ✅ `quelyos.theme.revenue` créé automatiquement

**Validation** :
```sql
-- Vérifier purchase
SELECT status, completion_date FROM quelyos_theme_purchase WHERE id = ?;
-- Expected: status = 'completed', completion_date NOT NULL

-- Vérifier revenue créé
SELECT * FROM quelyos_theme_revenue WHERE purchase_id = ?;
-- Expected: 1 row
-- amount = purchase.designer_share
-- designer_id = submission.designer_id
-- payout_status = 'pending'
```

---

### Test 3.4 : Calcul revenue split

**Données test** :
- Prix thème : 100 EUR
- Revenue share rate designer : 70%

**Validation** :
```sql
SELECT
  p.amount AS total,
  p.designer_share,
  p.platform_share,
  r.amount AS revenue_amount
FROM quelyos_theme_purchase p
JOIN quelyos_theme_revenue r ON r.purchase_id = p.id
WHERE p.id = ?;

-- Expected:
-- total = 100.00
-- designer_share = 70.00
-- platform_share = 30.00
-- revenue_amount = 70.00
```

---

### Test 3.5 : Installation thème tenant

**Endpoint** : `POST /api/tenants/{id}/theme/set`

**Données** :
```json
{
  "theme_id": 1
}
```

**Assertions** :
- ✅ Tenant doit avoir acheté le thème (purchase completed)
- ✅ `active_theme_id` mis à jour
- ✅ Config JSON appliquée

**Validation** :
```sql
SELECT active_theme_id FROM quelyos_tenant WHERE id = ?;
-- Expected: active_theme_id = 1
```

---

## 🧪 Test Suite 4 : Flow Webhooks

### Test 4.1 : Webhook transfer.paid

**Trigger** :
```bash
stripe trigger transfer.paid
```

**Assertions** :
- ✅ Webhook reçu endpoint `/api/stripe-connect/webhook`
- ✅ Signature vérifiée
- ✅ Revenues marqués `payout_status = 'paid'`
- ✅ `payout_date` renseignée
- ✅ `payout_reference` = transfer_id

**Validation** :
```sql
SELECT payout_status, payout_date, payout_reference
FROM quelyos_theme_revenue
WHERE stripe_transfer_id = 'tr_test_...';
-- Expected: status = 'paid', dates NOT NULL
```

---

### Test 4.2 : Webhook transfer.failed

**Trigger** :
```bash
stripe trigger transfer.failed
```

**Assertions** :
- ✅ Revenues marqués `payout_status = 'failed'`
- ✅ `payout_error` renseignée avec message d'erreur

**Validation** :
```sql
SELECT payout_status, payout_error
FROM quelyos_theme_revenue
WHERE stripe_transfer_id = 'tr_test_...';
-- Expected: status = 'failed', error NOT NULL
```

---

## 🧪 Test Suite 5 : Sécurité

### Test 5.1 : Endpoints admin protégés

**Endpoints à tester** :
- `/api/themes/submissions/{id}/approve`
- `/api/themes/submissions/{id}/reject`
- `/api/themes/designers/payout`
- `/api/themes/analytics/*`

**Test** :
```bash
# Sans auth
curl -X POST http://localhost:8069/api/themes/analytics/overview
# Expected: 401 Unauthorized

# Avec auth non-admin
curl -X POST http://localhost:8069/api/themes/analytics/overview \
  --cookie "session_id=user_session"
# Expected: 403 Forbidden

# Avec auth admin
curl -X POST http://localhost:8069/api/themes/analytics/overview \
  --cookie "session_id=admin_session"
# Expected: 200 OK
```

---

### Test 5.2 : Ownership validation

**Test** : Designer A essaie de modifier soumission de Designer B

**Endpoint** : `PUT /api/themes/submissions/{id}/update`

**Assertions** :
- ✅ 403 Forbidden si `submission.designer_id != current_user.designer_id`
- ✅ 200 OK si ownership valide

---

### Test 5.3 : Webhook signature invalide

**Test** : Envoyer webhook sans signature valide

```bash
curl -X POST http://localhost:8069/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid_signature" \
  -d '{"type": "payment_intent.succeeded"}'
```

**Assertions** :
- ✅ 400 Bad Request
- ✅ Log "Invalid signature"

---

## 🧪 Test Suite 6 : Cas d'erreur

### Test 6.1 : Achat thème déjà acheté

**Scénario** : Tenant essaie d'acheter un thème déjà acheté

**Assertions** :
- ✅ Erreur "Theme already purchased"
- ✅ Pas de Payment Intent créé

---

### Test 6.2 : Payout designer sans onboarding

**Scénario** : Admin trigger payout pour designer avec `stripe_payouts_enabled = false`

**Assertions** :
- ✅ Erreur "Payouts not enabled for this designer"
- ✅ Pas de Transfer créé

---

### Test 6.3 : Soumission thème avec config JSON invalide

**Données** :
```json
{
  "config_json": "invalid json{{{"
}
```

**Assertions** :
- ✅ 400 Bad Request
- ✅ Erreur "Invalid JSON config"

---

### Test 6.4 : Payout montant insuffisant

**Données** :
```json
{
  "designer_id": 1,
  "amount": 2.00  // < 5 EUR minimum
}
```

**Assertions** :
- ✅ Erreur "Minimum payout amount is 5 EUR"

---

## 📊 Critères de succès

### Critères obligatoires (PASS/FAIL)

- ✅ **100% endpoints API fonctionnels** (0 erreur 500)
- ✅ **Stripe Payments opérationnel** (Payment Intent créé + webhook traité)
- ✅ **Stripe Connect opérationnel** (Onboarding + Transfer + webhook)
- ✅ **Revenue split correct** (70/30 validé sur 5+ achats)
- ✅ **Sécurité admin** (403 sur endpoints admin si non-admin)
- ✅ **Webhooks sécurisés** (signature vérifiée)

### Critères optionnels (qualité)

- ⚠️ **Performance** : Tous endpoints < 500ms
- ⚠️ **UX** : Formulaires responsive mobile
- ⚠️ **Logs** : Événements critiques loggés
- ⚠️ **Rollback** : Erreur webhook → rollback automatique

---

## 🚀 Exécution des tests

### Mode Manuel (Première fois)

1. **Setup environnement** :
   ```bash
   cd odoo-backend && docker-compose up -d
   cd ../vitrine-client && npm run dev
   cd ../dashboard-client && npm run dev
   ```

2. **Configurer Stripe** :
   - Ajouter clés test dans Odoo
   - Configurer webhooks test

3. **Créer données test** :
   - Exécuter SQL setup (users, tenant)
   - Créer profil designer via UI

4. **Exécuter tests** :
   - Suivre chaque test suite séquentiellement
   - Cocher assertions validées
   - Noter erreurs rencontrées

5. **Valider critères** :
   - Vérifier tous critères PASS
   - Générer rapport

---

### Mode Automatisé (Future)

**Playwright E2E tests** :
```typescript
// tests/e2e/marketplace.spec.ts
describe('Marketplace Flow', () => {
  test('Designer can submit theme', async ({ page }) => {
    // Login as designer
    // Navigate to submit page
    // Fill form
    // Submit
    // Assert success
  });

  test('Client can purchase theme', async ({ page }) => {
    // Navigate to marketplace
    // Click theme
    // Purchase with Stripe test card
    // Assert success
  });
});
```

---

## 📝 Rapport de tests

### Template rapport

```markdown
# Rapport Tests E2E Marketplace - [DATE]

## Résumé
- **Tests exécutés** : 25 / 25
- **Tests réussis** : 23 / 25
- **Tests échoués** : 2 / 25
- **Critères obligatoires** : ✅ PASS / ❌ FAIL

## Détails échecs

### Test 3.3.3 : Webhook payment_intent.succeeded
- **Erreur** : Timeout webhook (30s)
- **Cause** : Stripe CLI non démarré
- **Action** : Redémarrer `stripe listen`

### Test 4.1 : Webhook transfer.paid
- **Erreur** : Revenue status reste 'processing'
- **Cause** : Signature webhook invalide
- **Action** : Vérifier `connect_webhook_secret` configuré

## Recommandations

1. Automatiser tests avec Playwright
2. Ajouter monitoring webhooks
3. Améliorer gestion erreurs timeouts
```

---

## 🎯 Prochaines étapes après tests

Si tous tests PASS :
- ✅ Déployer en staging
- ✅ Tests UAT avec vrais designers
- ✅ Go-live production

Si tests FAIL :
- ❌ Identifier bugs bloquants
- ❌ Corriger et re-tester
- ❌ Ne PAS déployer
