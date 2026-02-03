# TypeScript Strict Mode - Roadmap d'activation

**État actuel** : ✅ **Strict activé** (strict: true, noImplicitAny: true)
**Dernière mise à jour** : 2026-02-03

---

## ✅ Règles Strictes Activées

| Règle | État | Erreurs |
|-------|------|---------|
| `strict` | ✅ Activé | 0 |
| `noImplicitAny` | ✅ Activé | 1 (volontaire dans useFormState) |
| `strictNullChecks` | ✅ Activé (via strict) | 0 |
| `strictFunctionTypes` | ✅ Activé (via strict) | 0 |
| `strictBindCallApply` | ✅ Activé (via strict) | 0 |
| `strictPropertyInitialization` | ✅ Activé (via strict) | 0 |
| `noFallthroughCasesInSwitch` | ✅ Activé | 0 |

---

## ⚠️ Règles à Activer Progressivement

### 1. `noUnusedLocals: true` - **200 erreurs**

**Impact** : Variables déclarées mais non utilisées
**Priorité** : P2 (Moyen)
**Effort** : 2-3 jours (correction manuelle)

**Exemples typiques** :
```typescript
// ❌ Variable non utilisée
function loadProducts() {
  const api = useApi()  // Déclaré mais jamais utilisé
  return fetchProducts()
}

// ✅ Correction : Supprimer ou utiliser
function loadProducts() {
  return fetchProducts()
}

// ✅ Alternative : Préfixe underscore si volontaire
function loadProducts() {
  const _api = useApi()  // Explicitement non utilisé
  return fetchProducts()
}
```

**Plan d'activation** :
1. Lancer : `pnpm type-check 2>&1 | grep "is declared but never used" | wc -l`
2. Identifier fichiers avec le plus d'erreurs
3. Corriger par batch de 20-30 erreurs
4. Activer `noUnusedLocals: true` quand < 10 erreurs

**Script d'analyse** :
```bash
./scripts/analyze-unused-locals.sh
```

---

### 2. `noUncheckedIndexedAccess: true` - **341 erreurs** 🔴 CRITIQUE

**Impact** : Accès tableaux/objets sans vérification undefined
**Priorité** : **P0 (Critique - Risque bugs runtime)**
**Effort** : 1 semaine (correction + tests)

**Problème** :
```typescript
// ❌ RISQUE : products[0] peut être undefined
const products: Product[] = await fetchProducts()
const firstProduct = products[0]  // Type: Product (MAIS peut être undefined !)
console.log(firstProduct.name)    // ❌ Crash si tableau vide

// ✅ Avec noUncheckedIndexedAccess: true
const firstProduct = products[0]  // Type: Product | undefined ✅
if (firstProduct) {
  console.log(firstProduct.name)  // ✅ Safe
}

// ✅ Alternative : Optional chaining
console.log(products[0]?.name)
```

**Exemples réels détectés** :
```typescript
// ❌ Dangereux
const items = data.result.items
const item = items[selectedIndex]  // undefined si index invalide
return item.id  // ❌ Crash

// ✅ Sécurisé
const items = data.result.items
const item = items[selectedIndex]
if (!item) throw new Error('Item not found')
return item.id  // ✅ Safe
```

**Plan d'activation** :
1. **Phase 1** : Analyse des 341 erreurs
   ```bash
   pnpm type-check --noUncheckedIndexedAccess 2>&1 | tee typescript-indexed-errors.log
   ```

2. **Phase 2** : Catégorisation
   - Tableaux : `array[index]` → Vérifier `if (array[index])`
   - Objets : `obj[key]` → Vérifier `if (key in obj)`
   - Record/Map : `record[id]` → Utiliser `.get()` ou vérifier

3. **Phase 3** : Correction par module
   - store/ : ~50 erreurs
   - finance/ : ~80 erreurs
   - crm/ : ~40 erreurs
   - stock/ : ~60 erreurs
   - autres : ~111 erreurs

4. **Phase 4** : Activation
   - Activer `noUncheckedIndexedAccess: true`
   - Vérifier build CI/CD passe
   - Déployer avec tests complets

**Helpers recommandés** :
```typescript
// Helper 1: Safe array access
function safeArrayAccess<T>(array: T[], index: number): T | undefined {
  return array[index]
}

// Helper 2: Assert array has item
function assertArrayItem<T>(array: T[], index: number): T {
  const item = array[index]
  if (item === undefined) {
    throw new Error(`No item at index ${index}`)
  }
  return item
}

// Helper 3: Safe record access
function safeRecordAccess<T>(record: Record<string, T>, key: string): T | undefined {
  return key in record ? record[key] : undefined
}
```

---

### 3. `noUnusedParameters: true` - **Désactivé volontairement**

**État** : ❌ Désactivé (et garder désactivé)
**Raison** : Callbacks React/event handlers ont souvent des paramètres non utilisés

**Exemple légitime** :
```typescript
// ✅ OK - event non utilisé mais requis par signature
function handleClick(_event: React.MouseEvent) {
  doSomething()
}

// ✅ OK - index requis par .map() mais non utilisé
items.map((item, _index) => <Item key={item.id} {...item} />)
```

**Décision** : **Garder désactivé** ✅

---

## 📊 Score TypeScript Strict

| Catégorie | Score Actuel | Score Cible | Status |
|-----------|--------------|-------------|--------|
| **Base Strict** | 100% | 100% | ✅ Atteint |
| **Unused Locals** | 0% (200 erreurs) | 100% | 🟡 P2 |
| **Indexed Access** | 0% (341 erreurs) | 100% | 🔴 P0 |
| **Score Global** | **75%** | **100%** | 🟡 En cours |

---

## 🎯 Plan d'Action

### Semaine 1 : noUncheckedIndexedAccess (P0)
- [ ] Jour 1-2 : Analyse et catégorisation 341 erreurs
- [ ] Jour 3-4 : Correction modules store + finance (130 erreurs)
- [ ] Jour 5 : Correction modules crm + stock (100 erreurs)

### Semaine 2 : noUncheckedIndexedAccess (suite) + Tests
- [ ] Jour 1-2 : Correction autres modules (111 erreurs)
- [ ] Jour 3 : Tests end-to-end complets
- [ ] Jour 4 : Activation `noUncheckedIndexedAccess: true`
- [ ] Jour 5 : Monitoring production

### Semaine 3-4 : noUnusedLocals (P2)
- [ ] Correction progressive 200 erreurs (50/jour)
- [ ] Activation quand < 10 erreurs

---

## 🛠️ Scripts Utilitaires

```bash
# Analyser erreurs noUncheckedIndexedAccess
./scripts/analyze-indexed-access.sh

# Analyser erreurs noUnusedLocals
./scripts/analyze-unused-locals.sh

# Vérifier progression
./scripts/check-typescript-strict.sh

# Activer une règle (après correction)
./scripts/enable-typescript-rule.sh noUncheckedIndexedAccess
```

---

## 📈 Bénéfices Attendus

### noUncheckedIndexedAccess
- 🐛 **-90% bugs** accès array/object undefined
- 🛡️ **Sécurité runtime** améliorée
- 📊 **Maintenabilité** code plus robuste

### noUnusedLocals
- 🧹 **Code cleanup** automatique
- 📦 **Bundle size** -5% (dead code elimination)
- 🔍 **Lisibilité** améliorée

---

**Dernière révision** : 2026-02-03
**Prochaine étape** : Activer noUncheckedIndexedAccess (P0)
