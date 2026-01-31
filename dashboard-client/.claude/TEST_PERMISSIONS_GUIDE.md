# Guide Tests Permissions - Édition Finance

**Objectif** : Vérifier le double filtrage (édition + permissions backend)

---

## 🎯 Scénarios de Test

### **Scénario 1 : Finance User dans Édition Finance**

**Setup Backend** :
1. Créer utilisateur test : `finance.user@quelyos.com`
2. Assigner groupe : `Quelyos Finance User`

**Test UI** :
1. Lancer édition Finance : `pnpm run dev:finance`
2. Login avec `finance.user@quelyos.com`
3. **Vérifications** :
   - ✅ Accès dashboard Finance
   - ✅ Menu affiche UNIQUEMENT module Finance
   - ❌ Modules Store, POS, CRM, etc. invisibles
   - ✅ Navigation `/finance/dashboard` → OK
   - ❌ Navigation `/store/products` → Redirect `/home` ou `/error`

**Commande test automatique** :
```bash
# TODO: Créer script Playwright
pnpm run test:e2e:permissions:finance-user
```

---

### **Scénario 2 : Finance User avec Groupes Multiples**

**Setup Backend** :
1. Utilisateur : `multi.user@quelyos.com`
2. Groupes : `Quelyos Finance User` + `Quelyos Store User`

**Test UI** :
1. Lancer édition Finance
2. Login avec `multi.user@quelyos.com`
3. **Vérifications** :
   - ✅ Accès Finance (whitelisté)
   - ❌ PAS accès Store (permission OK mais NON whitelisté dans édition Finance)

**Résultat attendu** : L'édition PRIME sur les permissions.

---

### **Scénario 3 : Super-Admin dans Édition Finance**

**Setup Backend** :
1. Utilisateur : `admin@quelyos.com`
2. Groupe : `Access Rights` (super-admin)

**Test UI** :
1. Lancer édition Finance
2. Login avec `admin@quelyos.com`
3. **Vérifications** :
   - ✅ Accès Finance (whitelisté)
   - ❌ PAS accès Store (NON whitelisté, même si super-admin)
   - ❌ PAS accès POS (NON whitelisté)

**Résultat attendu** : Super-admin limité aux modules de l'édition.

---

### **Scénario 4 : Super-Admin dans Édition Full**

**Setup Backend** :
1. Utilisateur : `admin@quelyos.com`
2. Groupe : `Access Rights`

**Test UI** :
1. Lancer édition Full : `pnpm run dev` (port 5175)
2. Login avec `admin@quelyos.com`
3. **Vérifications** :
   - ✅ Accès TOUS modules (Finance, Store, POS, CRM, etc.)

**Résultat attendu** : Super-admin accès complet dans édition Full.

---

### **Scénario 5 : User Sans Permissions**

**Setup Backend** :
1. Utilisateur : `nogroup.user@quelyos.com`
2. Groupes : Aucun groupe Quelyos

**Test UI** :
1. Lancer édition Finance
2. Login avec `nogroup.user@quelyos.com`
3. **Vérifications** :
   - ❌ Aucun module accessible
   - ✅ Message "Aucun module disponible" ou redirect `/error`

---

## 🧪 Tests Automatisés (À Créer)

### **Test E2E : Finance User**
```typescript
// e2e/permissions-finance-user.spec.ts
test('Finance User accède uniquement à Finance', async ({ page }) => {
  await page.goto('http://localhost:3010/login')
  await page.fill('[name="username"]', 'finance.user@quelyos.com')
  await page.fill('[name="password"]', 'test123')
  await page.click('button[type="submit"]')
  
  await page.waitForURL(/\/finance|\/home/)
  
  // Vérifier menu
  const menu = await page.locator('nav, aside').textContent()
  expect(menu).toContain('Finance')
  expect(menu).not.toContain('Store')
  expect(menu).not.toContain('POS')
  
  // Tenter navigation Store
  await page.goto('http://localhost:3010/store/products')
  await page.waitForURL(/\/home|\/error|\/login/)
  expect(page.url()).not.toContain('/store')
})
```

### **Test E2E : Super-Admin Édition Finance**
```typescript
// e2e/permissions-admin-finance.spec.ts
test('Super-Admin limité à Finance dans édition Finance', async ({ page }) => {
  await page.goto('http://localhost:3010/login')
  await page.fill('[name="username"]', 'admin@quelyos.com')
  await page.fill('[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  
  await page.waitForURL(/\/finance|\/home/)
  
  const menu = await page.locator('nav, aside').textContent()
  
  // Super-admin voit Finance
  expect(menu).toContain('Finance')
  
  // Mais PAS Store (non whitelisté)
  expect(menu).not.toContain('Store')
  expect(menu).not.toContain('POS')
})
```

---

## 📊 Checklist Tests Manuels

### **Édition Finance**
- [ ] Finance User → Accès Finance uniquement
- [ ] Finance User + Store groupe → Accès Finance uniquement (édition prime)
- [ ] Super-admin → Accès Finance uniquement
- [ ] User sans groupe → Aucun accès
- [ ] Navigation `/store` → Bloquée
- [ ] Navigation `/pos` → Bloquée
- [ ] Branding vert #059669 visible
- [ ] Titre "Quelyos Finance"

### **Édition Full (Contrôle)**
- [ ] Super-admin → Accès TOUS modules
- [ ] Finance User → Accès Finance uniquement (permissions normales)

---

## 🔧 Commandes Utiles

### **Créer users test backend**
```bash
# TODO: Script Python pour créer users Odoo
# odoo-backend/scripts/create_test_users.py

python3 odoo-backend/scripts/create_test_users.py \
  --user finance.user@quelyos.com \
  --groups "Quelyos Finance User"

python3 odoo-backend/scripts/create_test_users.py \
  --user admin@quelyos.com \
  --groups "Access Rights"
```

### **Lancer tests**
```bash
# Dev Finance
pnpm run dev:finance

# Tests E2E permissions
pnpm run test:e2e e2e/permissions-*.spec.ts
```

---

## 🎯 Critères de Succès

| Scénario | Utilisateur | Édition | Modules Visibles | Statut |
|----------|-------------|---------|------------------|--------|
| 1 | Finance User | Finance | `finance` uniquement | ⏸️ |
| 2 | Multi-User (Finance+Store) | Finance | `finance` uniquement | ⏸️ |
| 3 | Super-Admin | Finance | `finance` uniquement | ⏸️ |
| 4 | Super-Admin | Full | Tous modules | ⏸️ |
| 5 | No-Group User | Finance | Aucun | ⏸️ |

**Validation** : ✅ 5/5 scénarios passent

---

**Statut** : ⏸️ Tests à exécuter manuellement  
**Prochaine étape** : Créer users backend + lancer tests
