# API Express → Odoo Migration Guide

Guide de migration des routes Express de Prisma vers Odoo avec stratégie Double Write.

## 🎯 Stratégie Double Write

Pendant la migration, on écrit dans **Prisma ET Odoo** simultanément :

1. **Write to Prisma** (comportement existant)
2. **Write to Odoo** (nouveau)
3. **Store ID mapping** (table de correspondance)

Une fois la migration terminée, on supprime les écritures Prisma et on lit depuis Odoo uniquement.

---

## 📦 Fichiers Créés

### Utilitaire Mapping
- **`src/utils/odoo-mapping.js`** - Helpers mapping IDs + conversions types

### Routes Adaptées (Exemples)
- **`src/routes/accounts-odoo.js`** - Comptes (account.account)
- **`src/routes/budgets-odoo.js`** - Budgets (quelyos.budget)
- **`src/routes/portfolios-odoo.js`** - Portefeuilles (quelyos.portfolio)
- **`src/routes/paymentFlows-odoo.js`** - Payment Flows (quelyos.payment.flow)

---

## 🔧 Helpers Odoo Mapping

### Fonctions Principales

```javascript
const {
  getOdooId,           // Prisma ID → Odoo ID
  getPrismaId,         // Odoo ID → Prisma ID
  storeMapping,        // Sauvegarder correspondance
  getOdooModelName,    // Prisma model → Odoo model
  mapAccountType,      // Type compte Prisma → Odoo
  getCurrencyId,       // Code devise → Odoo currency ID
  getOdooCompanyId,    // Prisma company ID → Odoo company ID
  generateAccountCode  // Générer code compte Odoo
} = require("../utils/odoo-mapping");
```

### Mapping Modèles

| Prisma Model | Odoo Model | Type |
|--------------|------------|------|
| Account | account.account | Native Odoo |
| Transaction | account.move.line | Native Odoo |
| Category | account.analytic.account | Native Odoo |
| Portfolio | quelyos.portfolio | Custom |
| PaymentFlow | quelyos.payment.flow | Custom |
| Budgets | quelyos.budget | Custom |
| Budget | quelyos.budget.line | Custom |

### Mapping Types Comptes

| Prisma Type | Odoo account_type |
|-------------|-------------------|
| banque | asset_cash |
| caisse | asset_cash |
| compte courant | asset_current |
| carte de crédit | liability_credit_card |
| épargne | asset_current |
| investissement | asset_non_current |

---

## 📝 Pattern Double Write

### CREATE - Écriture Double

```javascript
router.post("/", auth, async (req, res) => {
  try {
    // STEP 1: Create in Prisma (existing behavior)
    const prismaRecord = await prisma.model.create({
      data: { ... }
    });

    // STEP 2: Create in Odoo (new)
    try {
      const odooCompanyId = await getOdooCompanyId(req.user.companyId);
      const odooRecord = await odoo.create('odoo.model', {
        name: req.body.name,
        company_id: odooCompanyId,
        // ... other fields
      });

      // STEP 3: Store mapping
      if (odooRecord && odooRecord.id) {
        await storeMapping('PrismaModel', prismaRecord.id, 'odoo.model', odooRecord.id);
        logger.info(`Created: Prisma#${prismaRecord.id} <-> Odoo#${odooRecord.id}`);
      }

    } catch (odooError) {
      // Log error but don't fail (Prisma succeeded)
      logger.error(`Odoo creation failed:`, odooError);
      logger.warn(`Record created in Prisma only (ID: ${prismaRecord.id})`);
    }

    // Return Prisma record (existing API contract)
    res.json(prismaRecord);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Creation failed" });
  }
});
```

### READ - Lecture Prisma (Court terme)

```javascript
router.get("/", auth, async (req, res) => {
  try {
    // Option 1: Read from Prisma (safe during migration)
    const records = await prisma.model.findMany({
      where: { companyId: req.user.companyId }
    });

    res.json(records);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});
```

### READ - Lecture Odoo (Long terme)

```javascript
router.get("/", auth, async (req, res) => {
  try {
    // Option 2: Read from Odoo (once migration complete)
    const odooCompanyId = await getOdooCompanyId(req.user.companyId);

    const odooRecords = await odoo.search('odoo.model', [
      ['company_id', '=', odooCompanyId]
    ]);

    // Transform Odoo format → API format
    const records = odooRecords.map(rec => ({
      id: rec.id,
      name: rec.name,
      // ... transform fields
      companyId: req.user.companyId // Map back to Prisma company ID
    }));

    res.json(records);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});
```

### UPDATE - Mise à jour Double

```javascript
router.put("/:id", auth, async (req, res) => {
  try {
    const recordId = Number(req.params.id);

    // STEP 1: Update Prisma
    const updated = await prisma.model.update({
      where: { id: recordId },
      data: { name: req.body.name }
    });

    // STEP 2: Update Odoo
    try {
      const odooId = await getOdooId('PrismaModel', recordId);
      if (odooId) {
        await odoo.write('odoo.model', odooId, {
          name: req.body.name
        });
        logger.info(`Updated in Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`Odoo update failed:`, odooError);
    }

    res.json(updated);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});
```

### DELETE - Suppression Double

```javascript
router.delete("/:id", auth, async (req, res) => {
  try {
    const recordId = Number(req.params.id);

    // STEP 1: Delete from Odoo first (referential integrity)
    try {
      const odooId = await getOdooId('PrismaModel', recordId);
      if (odooId) {
        await odoo.unlink('odoo.model', [odooId]);
        logger.info(`Deleted from Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`Odoo deletion failed:`, odooError);
    }

    // STEP 2: Delete from Prisma
    await prisma.model.delete({ where: { id: recordId } });

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Deletion failed" });
  }
});
```

---

## 🔄 Transactions - Cas Complexe

Les transactions sont mappées vers `account.move.line` (lignes d'écriture comptable).

### Créer Transaction → account.move + account.move.line

```javascript
router.post("/", auth, async (req, res) => {
  try {
    const { amount, type, description, accountId, categoryId, occurredAt } = req.body;

    // STEP 1: Create in Prisma
    const prismaTransaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type: type, // "credit" | "debit"
        description,
        accountId: Number(accountId),
        categoryId: categoryId ? Number(categoryId) : null,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        status: 'CONFIRMED'
      }
    });

    // STEP 2: Create in Odoo
    try {
      const odooAccountId = await getOdooId('Account', accountId);
      const odooCategoryId = categoryId ? await getOdooId('Category', categoryId) : false;

      // Create account.move (journal entry)
      const move = await odoo.create('account.move', {
        move_type: 'entry',
        date: occurredAt || fields.Date.today(),
        ref: description || 'Transaction',
        journal_id: 1, // TODO: Get appropriate journal
        company_id: await getOdooCompanyId(req.user.companyId)
      });

      // Create account.move.line (journal item)
      if (move && move.id) {
        const lineData = {
          move_id: move.id,
          account_id: odooAccountId,
          name: description || '/',
          date: occurredAt || fields.Date.today(),
          analytic_account_id: odooCategoryId || false
        };

        // Debit or credit based on type
        if (type === 'debit') {
          lineData.debit = parseFloat(amount);
          lineData.credit = 0;
        } else {
          lineData.debit = 0;
          lineData.credit = parseFloat(amount);
        }

        const moveLine = await odoo.create('account.move.line', lineData);

        // Store mapping Transaction → account.move.line
        if (moveLine && moveLine.id) {
          await storeMapping('Transaction', prismaTransaction.id, 'account.move.line', moveLine.id);
          logger.info(`[Transactions] Created: Prisma#${prismaTransaction.id} <-> Odoo#${moveLine.id}`);
        }

        // Post the move (validate)
        await odoo.call('account.move', 'action_post', [move.id]);
      }

    } catch (odooError) {
      logger.error(`[Transactions] Odoo creation failed:`, odooError);
    }

    res.json(prismaTransaction);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Transaction creation failed" });
  }
});
```

### Lire Transactions → account.move.line

```javascript
router.get("/", auth, async (req, res) => {
  try {
    // Option 1: Read from Prisma (current)
    const transactions = await prisma.transaction.findMany({
      where: {
        account: { companyId: req.user.companyId }
      },
      include: {
        account: true,
        category: true
      },
      orderBy: { occurredAt: 'desc' }
    });

    res.json(transactions);

    // Option 2: Read from Odoo (future)
    /*
    const odooCompanyId = await getOdooCompanyId(req.user.companyId);

    const moveLines = await odoo.search('account.move.line', [
      ['company_id', '=', odooCompanyId],
      ['parent_state', '=', 'posted']
    ], {
      fields: ['id', 'name', 'debit', 'credit', 'date', 'account_id', 'analytic_account_id'],
      order: 'date desc'
    });

    // Transform to API format
    const transactions = moveLines.map(line => ({
      id: line.id,
      amount: line.debit > 0 ? line.debit : line.credit,
      type: line.debit > 0 ? 'debit' : 'credit',
      description: line.name,
      occurredAt: line.date,
      // Map IDs back to Prisma format
      accountId: await getPrismaId('Account', line.account_id[0]),
      categoryId: line.analytic_account_id ? await getPrismaId('Category', line.analytic_account_id[0]) : null
    }));

    res.json(transactions);
    */

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});
```

---

## 📋 Checklist Migration Route

Pour chaque route à migrer :

### Étape 1 : Créer version -odoo.js
- [ ] Copier route existante → `route-odoo.js`
- [ ] Importer `@quelyos/odoo` et helpers mapping
- [ ] Initialiser `OdooRPC` client

### Étape 2 : Adapter CREATE
- [ ] Créer dans Prisma (existant)
- [ ] Créer dans Odoo (nouveau)
- [ ] Mapper types Prisma → Odoo
- [ ] Mapper company ID
- [ ] Stocker mapping ID
- [ ] Logger succès/erreur
- [ ] Ne PAS échouer si Odoo fail (Prisma suffit)

### Étape 3 : Adapter READ
- [ ] Lire depuis Prisma (court terme)
- [ ] Ajouter commentaire lecture Odoo (long terme)
- [ ] Transformer format Odoo → API

### Étape 4 : Adapter UPDATE
- [ ] Update Prisma
- [ ] Update Odoo via mapping ID
- [ ] Logger succès

### Étape 5 : Adapter DELETE
- [ ] Delete Odoo d'abord (intégrité référentielle)
- [ ] Delete Prisma ensuite
- [ ] Logger succès

### Étape 6 : Tester
- [ ] Créer record via API
- [ ] Vérifier dans Prisma
- [ ] Vérifier dans Odoo
- [ ] Vérifier mapping stocké
- [ ] Tester update
- [ ] Tester delete

---

## 🚀 Ordre Migration Recommandé

| Route | Modèle Odoo | Priorité | Difficulté |
|-------|-------------|----------|------------|
| 1. portfolios.js | quelyos.portfolio | HAUTE | Facile ✅ |
| 2. paymentFlows.js | quelyos.payment.flow | HAUTE | Facile ✅ |
| 3. budgets.js | quelyos.budget | HAUTE | Moyenne ✅ |
| 4. accounts.js | account.account | HAUTE | Moyenne ✅ |
| 5. categories.js | account.analytic.account | HAUTE | Facile |
| 6. transactions.js | account.move.line | CRITIQUE | Difficile ⚠️ |
| 7. forecast-events.js | quelyos.forecast.event | MOYENNE | Facile |
| 8. currencies.js | res.currency | BASSE | Facile |
| 9. company.js | res.company | MOYENNE | Moyenne |
| 10. users.js | res.users | BASSE | Difficile ⚠️ |

**⚠️ Difficile** = Nécessite création account.move + validation

---

## 🔍 Exemple Complet : Transactions

### Structure account.move (Journal Entry)

```python
account.move:
  - name: str (numéro pièce, auto-généré)
  - move_type: 'entry' (écriture manuelle)
  - date: date
  - ref: str (description)
  - journal_id: many2one account.journal
  - state: 'draft' | 'posted'
  - company_id: many2one res.company
  - line_ids: one2many account.move.line
```

### Structure account.move.line (Journal Item)

```python
account.move.line:
  - move_id: many2one account.move
  - account_id: many2one account.account
  - name: str (libellé)
  - debit: float (montant débit)
  - credit: float (montant crédit)
  - date: date
  - analytic_account_id: many2one account.analytic.account
  - partner_id: many2one res.partner (optional)
```

### Créer Transaction Complète

```javascript
async function createTransaction(req, res) {
  const { amount, type, description, accountId, categoryId, occurredAt } = req.body;

  // STEP 1: Create in Prisma
  const prismaTransaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      type: type, // "credit" | "debit"
      description,
      accountId: Number(accountId),
      categoryId: categoryId ? Number(categoryId) : null,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      status: 'CONFIRMED'
    }
  });

  // STEP 2: Create in Odoo
  const odooCompanyId = await getOdooCompanyId(req.user.companyId);
  const odooAccountId = await getOdooId('Account', accountId);
  const odooCategoryId = categoryId ? await getOdooId('Category', categoryId) : false;

  // Get appropriate journal (cash journal, bank journal, etc.)
  const journals = await odoo.search('account.journal', [
    ['type', '=', 'general'],
    ['company_id', '=', odooCompanyId]
  ], { limit: 1 });

  const journalId = journals && journals[0] ? journals[0].id : 1;

  // Create move (journal entry)
  const move = await odoo.create('account.move', {
    move_type: 'entry',
    date: occurredAt || new Date().toISOString().split('T')[0],
    ref: description || 'Transaction',
    journal_id: journalId,
    company_id: odooCompanyId
  });

  // Create move lines (balanced entry required in Odoo)
  if (move && move.id) {
    // Line 1: Debit or Credit on target account
    const line1Data = {
      move_id: move.id,
      account_id: odooAccountId,
      name: description || '/',
      date: occurredAt || new Date().toISOString().split('T')[0],
      analytic_account_id: odooCategoryId || false
    };

    if (type === 'debit') {
      line1Data.debit = parseFloat(amount);
      line1Data.credit = 0;
    } else {
      line1Data.debit = 0;
      line1Data.credit = parseFloat(amount);
    }

    const moveLine1 = await odoo.create('account.move.line', line1Data);

    // Line 2: Balancing entry (required by Odoo accounting)
    // Use a default counterpart account (e.g., "Unallocated Funds")
    const counterpartAccount = await getCounterpartAccount(odooCompanyId);

    const line2Data = {
      move_id: move.id,
      account_id: counterpartAccount,
      name: description || '/',
      date: occurredAt || new Date().toISOString().split('T')[0],
      debit: type === 'credit' ? parseFloat(amount) : 0,
      credit: type === 'debit' ? parseFloat(amount) : 0
    };

    await odoo.create('account.move.line', line2Data);

    // Post the move (validate and lock)
    await odoo.call('account.move', 'action_post', [move.id]);

    // Store mapping
    if (moveLine1 && moveLine1.id) {
      await storeMapping('Transaction', prismaTransaction.id, 'account.move.line', moveLine1.id);
      logger.info(`[Transactions] Created: Prisma#${prismaTransaction.id} <-> Odoo#${moveLine1.id}`);
    }
  }

  res.json(prismaTransaction);
}

/**
 * Get counterpart account for unbalanced entries
 * Typically: 471000 "Compte d'attente" or 580000 "Virements internes"
 */
async function getCounterpartAccount(odooCompanyId) {
  const accounts = await odoo.search('account.account', [
    ['code', '=', '471000'], // Compte d'attente
    ['company_id', '=', odooCompanyId]
  ], { limit: 1 });

  if (accounts && accounts[0]) {
    return accounts[0].id;
  }

  // Fallback: search any suspense account
  const suspense = await odoo.search('account.account', [
    ['account_type', '=', 'asset_current'],
    ['company_id', '=', odooCompanyId]
  ], { limit: 1 });

  return suspense && suspense[0] ? suspense[0].id : 1;
}
```

---

## ⚙️ Configuration Odoo Client

### Initialisation

```javascript
const { OdooRPC } = require('@quelyos/odoo');

const odoo = new OdooRPC(process.env.ODOO_URL || 'http://localhost:8069');

// Optional: Configure authentication
// odoo.setCredentials({
//   db: 'quelyos',
//   username: 'admin@quelyos.com',
//   password: process.env.ODOO_ADMIN_PASSWORD
// });
```

### Méthodes Principales

```javascript
// CREATE
const record = await odoo.create('model.name', { field: value });

// READ
const records = await odoo.read('model.name', [id1, id2], ['field1', 'field2']);

// SEARCH
const results = await odoo.search('model.name', [['field', '=', value]], {
  fields: ['field1', 'field2'],
  limit: 10,
  order: 'create_date desc'
});

// WRITE (UPDATE)
await odoo.write('model.name', recordId, { field: newValue });

// UNLINK (DELETE)
await odoo.unlink('model.name', [id1, id2]);

// CALL (Method)
await odoo.call('model.name', 'method_name', [recordId], { param: value });
```

---

## 🎯 Avantages Double Write

### Court Terme (Migration)
✅ API reste compatible (retourne format Prisma)
✅ Pas de breaking changes frontend
✅ Migration progressive sans downtime
✅ Rollback facile si problème Odoo

### Long Terme (Post-migration)
✅ Données unifiées dans Odoo
✅ Suppression dépendance Prisma
✅ Exploitation features Odoo natives (rapports, exports, workflows)
✅ Réduction complexité stack (1 seule DB)

---

## 📊 Checklist Complète Migration API

### Routes Finance Prioritaires (Phase 2.3)
- [x] accounts-odoo.js (account.account) ✅
- [x] budgets-odoo.js (quelyos.budget) ✅
- [x] portfolios-odoo.js (quelyos.portfolio) ✅
- [x] paymentFlows-odoo.js (quelyos.payment.flow) ✅
- [ ] transactions-odoo.js (account.move.line) ⏳
- [ ] categories-odoo.js (account.analytic.account) ⏳
- [ ] forecast-events-odoo.js (quelyos.forecast.event) ⏳

### Routes Secondaires (Phase 3)
- [ ] company-odoo.js (res.company)
- [ ] users-odoo.js (res.users)
- [ ] currencies-odoo.js (res.currency.rate)
- [ ] billing-odoo.js (account.move out_invoice)

### Système Mapping
- [ ] Créer modèle Prisma OdooMapping
- [ ] Migrer schema Prisma
- [ ] Implémenter getOdooId() / getPrismaId()
- [ ] Implémenter storeMapping()

### Tests
- [ ] Tests unitaires routes Odoo
- [ ] Tests E2E double write
- [ ] Vérifier isolation multi-tenant
- [ ] Performance tests (Odoo vs Prisma)

---

## 🚀 Activation Routes Odoo

### Option A : Remplacement Progressif

```javascript
// server.js
// Remplacer routes une par une
app.use('/v1/portfolios', require('./src/routes/portfolios-odoo'));  // NEW
app.use('/v1/budgets', require('./src/routes/budgets-odoo'));        // NEW
app.use('/v1/accounts', require('./src/routes/accounts'));           // OLD (à remplacer)
```

### Option B : Feature Flag

```javascript
// server.js
const USE_ODOO = process.env.USE_ODOO_ROUTES === 'true';

if (USE_ODOO) {
  app.use('/v1/portfolios', require('./src/routes/portfolios-odoo'));
  app.use('/v1/budgets', require('./src/routes/budgets-odoo'));
} else {
  app.use('/v1/portfolios', require('./src/routes/portfolios'));
  app.use('/v1/budgets', require('./src/routes/budgets'));
}
```

---

## 📝 Notes Importantes

### Many2many Commands Odoo

```python
# Add single record
account_ids: [[4, account_id]]

# Add multiple records
account_ids: [[4, id1], [4, id2]]

# Remove record
account_ids: [[3, account_id]]

# Replace all
account_ids: [[6, 0, [id1, id2, id3]]]

# Clear all
account_ids: [[5]]
```

### Conversion Devises

```javascript
// Odoo gère automatiquement les conversions via currency_id._convert()
// Dans les modèles Python, utiliser:
amount_in_target_currency = source_currency._convert(
    amount,
    target_currency,
    company,
    date
)
```

### Gestion Erreurs

```javascript
try {
  // Odoo operation
} catch (odooError) {
  // Log mais ne pas échouer si Prisma a réussi
  logger.error(`Odoo operation failed:`, odooError);
  logger.warn(`Record created/updated in Prisma only`);
}
```

---

**Document créé** : `apps/api/MIGRATION_GUIDE.md`
**Routes créées** : 4 routes adaptées (accounts, budgets, portfolios, paymentFlows)
**Helpers créés** : odoo-mapping.js avec 8 fonctions utilitaires
