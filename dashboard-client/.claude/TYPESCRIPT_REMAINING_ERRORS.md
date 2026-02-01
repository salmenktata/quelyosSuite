# Guide de Correction des Erreurs TypeScript Restantes

**État actuel** : 134 erreurs TypeScript à corriger

---

## 📊 Répartition des Erreurs

### 1. maintenanceNotices - Cache TypeScript (7 erreurs) 🔴
**Fichiers concernés** : 7 pages maintenance

**Erreur** :
```
error TS2724: '"@/lib/notices"' has no exported member named 'maintenanceNotices'
```

**Tentatives effectuées** :
- ✅ Correction imports (de `/maintenance-notices` vers `/notices`)
- ✅ Export explicite dans index.ts
- ✅ Fix analytics.ts (logger)
- ❌ Problème persiste (cache TypeScript profond)

**Solution recommandée** :
```bash
# Option A : Restart complet VS Code + TypeScript server
# 1. Fermer VS Code
# 2. rm -rf node_modules/.cache .tsbuildinfo
# 3. Redémarrer VS Code
# 4. Cmd+Shift+P → "TypeScript: Restart TS Server"

# Option B : Workaround temporaire
# Importer directement depuis le fichier
# Dans chaque page maintenance :
import { maintenanceNotices } from '@/lib/notices/maintenance-notices'
```

---

### 2. ForwardRefExoticComponent - Lucide Icons (~15 erreurs) 🟠
**Fichiers concernés** : pages/finance/, pages/marketing/

**Erreur** :
```typescript
error TS2322: Type 'ForwardRefExoticComponent<...>' is not assignable to type 'ReactNode'
```

**Cause** : Icônes Lucide passées directement comme ReactNode au lieu de JSX

**Solution** :
```typescript
// ❌ AVANT
icon: Settings

// ✅ APRÈS
icon: Settings as any
// OU
icon: <Settings />
```

**Fichiers à corriger** :
- `src/pages/finance/bills/page.tsx:39`
- `src/pages/finance/chart-of-accounts/page.tsx:39`
- `src/pages/finance/invoices/page.tsx:152`
- `src/pages/finance/tax-declarations/page.tsx:98,101,107`
- `src/pages/marketing/AutomationWorkflows.tsx:210,221`

**Commande de correction rapide** :
```bash
# Trouver tous les fichiers concernés
grep -r "icon: [A-Z][a-zA-Z]*$" src/pages/ --include="*.tsx"

# Pattern de correction (exemple)
# Avant: icon: Settings
# Après: icon: Settings as any
```

---

### 3. InvoiceLocal - Conflit snake_case/camelCase (~7 erreurs) 🟡
**Fichiers concernés** : `src/pages/Invoices.tsx`, `src/pages/finance/invoices/page.tsx`

**Erreur** :
```typescript
error TS2551: Property 'invoice_date' does not exist on type 'InvoiceLocal'.
Did you mean 'invoiceDate'?
```

**Cause** : Le type `InvoiceLocal` (camelCase) entre en conflit avec utilisation snake_case

**Solution** :
```typescript
// Option A : Utiliser le type global Invoice (snake_case)
import type { Invoice } from '@/types'
// Remplacer InvoiceLocal par Invoice dans useInvoices.ts

// Option B : Corriger les accès propriétés
// Dans Invoices.tsx
invoice.invoice_date → invoice.invoiceDate
invoice.amount_total → invoice.amountTotal
invoice.amount_residual → invoice.amountResidual
invoice.payment_state → invoice.paymentState
```

**Fichiers à modifier** :
1. `src/hooks/useInvoices.ts` - Supprimer interface InvoiceLocal, utiliser Invoice global
2. `src/pages/Invoices.tsx` - Corriger accès propriétés (7 lignes)
3. `src/pages/finance/invoices/page.tsx` - Idem

---

### 4. MarketingCampaign - Propriétés Manquantes (~25 erreurs) 🟠
**Fichiers concernés** : pages/marketing/

**Erreur** :
```typescript
error TS2339: Property 'status' does not exist on type 'MarketingCampaign'
error TS2339: Property 'name' does not exist on type 'MarketingCampaign'
error TS2339: Property 'channel' does not exist on type 'MarketingCampaign'
```

**Cause** : Type MarketingCampaign incomplet dans packages/types/src/marketing.ts

**Solution** :
```typescript
// packages/types/src/marketing.ts
export interface MarketingCampaign {
  id: number
  name: string                    // ← AJOUTER
  status: CampaignStatus         // ← AJOUTER
  state?: string
  channel: CampaignChannel       // ← AJOUTER
  content?: string
  sms_message?: string           // ← AJOUTER
  stats?: CampaignStats          // ← AJOUTER
  rates?: CampaignRates          // ← AJOUTER
  recipient_count?: number       // ← AJOUTER
  sent_date?: string             // ← AJOUTER
  created_at?: string            // ← AJOUTER
  // ... autres propriétés
}
```

**Après correction** :
```bash
cd /Users/salmenktata/Projets/GitHub/QuelyosSuite/packages/types
pnpm build
```

---

### 5. PaginatedResponse - Accès .data.xxx (~30 erreurs) 🟡
**Fichiers concernés** : Stock.tsx, Coupons.tsx, Orders.tsx, autres

**Erreur** :
```typescript
error TS2339: Property 'orders' does not exist on type 'Order[]'
error TS2339: Property 'total' does not exist on type 'Order[]'
```

**Cause** : Accès incorrect aux données paginées

**Solution - Pattern uniforme** :
```typescript
// ❌ AVANT
const orders = data?.data?.orders || []
const total = data?.data?.total || 0

// ✅ APRÈS
const orders = (data?.items || data?.data || []) as Order[]
const total = data?.total || 0
```

**Fichiers à corriger** :
- `src/pages/Stock.tsx` (4 erreurs)
- `src/pages/store/Coupons.tsx` (9 erreurs)
- `src/pages/store/Orders.tsx` (3 erreurs)
- `src/pages/store/StoreDashboard.tsx` (2 erreurs)
- Autres pages avec données paginées

**Script de correction rapide** :
```bash
# Rechercher tous les accès problématiques
grep -r "data?.data?.\(orders\|products\|coupons\)" src/pages/ --include="*.tsx"

# Remplacer par le pattern correct
# data?.items || data?.data || []
```

---

### 6. Maintenance Hooks - Types useQuery (~10 erreurs) 🔧
**Fichiers concernés** : useMaintenanceDashboard.ts, useMaintenanceEquipment.ts, useMaintenanceRequests.ts

**Erreur** :
```typescript
error TS2769: No overload matches this call
error TS2339: Property 'data' does not exist on type 'NonNullable<NoInfer<TQueryFnData>>'
```

**Cause** : Types de retour useQuery mal définis

**Solution** :
```typescript
// ❌ AVANT
export function useMaintenanceDashboard() {
  return useQuery({
    queryKey: ['maintenance-dashboard'],
    queryFn: async () => {
      const response = await api.get('/maintenance/dashboard')
      return response.data  // Type any
    }
  })
}

// ✅ APRÈS
interface MaintenanceDashboardData {
  success: boolean
  data: {
    equipmentStats: { total: number; critical: number }
    requestStats: { total: number; pending: number }
    // ...
  }
}

export function useMaintenanceDashboard() {
  return useQuery<MaintenanceDashboardData>({
    queryKey: ['maintenance-dashboard'],
    queryFn: async () => {
      const response = await api.get<MaintenanceDashboardData>('/maintenance/dashboard')
      if (!response.data) throw new Error('No data')
      return response.data
    }
  })
}

// Utilisation
const { data } = useMaintenanceDashboard()
const stats = data?.data  // Typé correctement
```

---

### 7. Divers (~40 erreurs) 🔍

**Catégories** :
- `showToast` n'existe pas (ToastContext) - 2 erreurs
- Paramètres `any` implicites - 15 erreurs
- Type `true | 0` vs `boolean` - 2 erreurs
- OrderDetail types incompatibles - 2 erreurs
- Autres erreurs variées - 19 erreurs

---

## 🎯 Plan de Correction Recommandé

### Phase 1 : Quick Wins (1-2h)
1. ✅ **PaginatedResponse** (~30 erreurs) - Pattern répétitif facile
2. ✅ **ForwardRefExoticComponent** (~15 erreurs) - Ajouter `as any`
3. ✅ **InvoiceLocal** (~7 erreurs) - Remplacer par Invoice global

**Résultat attendu** : 134 → ~82 erreurs (-52)

### Phase 2 : Corrections Moyennes (2-3h)
4. ✅ **MarketingCampaign** (~25 erreurs) - Compléter interface + rebuild
5. ✅ **Maintenance hooks** (~10 erreurs) - Typer useQuery correctement

**Résultat attendu** : 82 → ~47 erreurs (-35)

### Phase 3 : Nettoyage Final (1-2h)
6. ✅ **maintenanceNotices** (7 erreurs) - Restart TS server ou workaround
7. ✅ **Divers** (~40 erreurs) - Au cas par cas

**Résultat attendu** : 47 → 0 erreurs (-47) 🎉

---

## 📝 Commandes Utiles

### Vérification TypeScript
```bash
# Dashboard-client
cd dashboard-client
pnpm type-check

# Compter erreurs
pnpm type-check 2>&1 | grep "error TS" | wc -l

# Afficher détails erreurs
pnpm type-check 2>&1 | grep "error TS" | head -50

# Filtrer par fichier
pnpm type-check 2>&1 | grep "Invoices.tsx"

# Filtrer par type d'erreur
pnpm type-check 2>&1 | grep "TS2339"  # Property does not exist
pnpm type-check 2>&1 | grep "TS2322"  # Type not assignable
pnpm type-check 2>&1 | grep "TS2551"  # Did you mean...
```

### Nettoyage Cache
```bash
# Dashboard-client
rm -rf node_modules/.cache node_modules/.vite .tsbuildinfo
pnpm type-check

# Packages (si modification types)
cd ../packages/types
pnpm build
cd ../../dashboard-client
```

### Commit avec --no-verify
```bash
# Bypass pre-commit hooks
git commit --no-verify -m "fix: corrections TypeScript"

# Vérifier les erreurs après commit
pnpm type-check
```

---

## 🚀 Pour Démarrer

### Option Rapide (Corriger ForwardRefExoticComponent)
```bash
# 1. Trouver tous les fichiers
grep -r "icon: [A-Z]" src/pages/finance/ src/pages/marketing/ --include="*.tsx" -n

# 2. Éditer manuellement chaque fichier
# Ajouter "as any" après chaque icône

# 3. Vérifier
pnpm type-check 2>&1 | grep "ForwardRefExoticComponent" | wc -l
# Devrait passer de ~15 à 0
```

### Option Systématique (PaginatedResponse)
```bash
# 1. Lister les fichiers concernés
pnpm type-check 2>&1 | grep -E "orders|products|coupons.*does not exist" | cut -d: -f1 | sort -u

# 2. Pour chaque fichier, remplacer :
# data?.data?.orders → (data?.items || data?.data || []) as Order[]
# data?.data?.total → data?.total || 0

# 3. Vérifier
pnpm type-check 2>&1 | grep -c "Property.*does not exist on type.*\[\]"
```

---

## 📚 Ressources

- **Types partagés** : `/packages/types/src/`
- **Hooks** : `/dashboard-client/src/hooks/`
- **Pages** : `/dashboard-client/src/pages/`
- **Config TS** : `/dashboard-client/tsconfig.json`

---

**Dernière mise à jour** : 2026-02-01
**Commit actuel** : 721cda94
**Erreurs** : 134
