# 🚀 Système d'Éditions Quelyos - Guide Démarrage Rapide

## ✨ Qu'est-ce que c'est ?

Le **système d'éditions** permet de générer **7 SaaS distincts** à partir d'une **seule codebase** (`dashboard-client`).

Chaque édition :
- ✅ Affiche uniquement **ses modules** (whiteliste)
- ✅ Applique son **branding** (couleur, nom, favicon)
- ✅ Génère un **bundle optimisé** (tree-shaking)
- ✅ Déploie sur son **port dédié** (3010-3016)

---

## 🎯 Éditions Disponibles (8)

| Édition | Nom | Modules | Port | Couleur |
|---------|-----|---------|------|---------|
| **finance** | Quelyos Finance | `finance` | 3010 | 🟢 #059669 |
| **store** | Quelyos Store | `store`, `marketing` | 3011 | 🟣 #7C3AED |
| **copilote** | Quelyos Copilote | `stock`, `hr` | 3012 | 🟠 #EA580C |
| **sales** | Quelyos Sales | `crm`, `marketing` | 3013 | 🔵 #2563EB |
| **retail** | Quelyos Retail | `pos`, `store`, `stock` | 3014 | 🔴 #DC2626 |
| **team** | Quelyos Team | `hr` | 3015 | 🐦 #0891B2 |
| **support** | Quelyos Support | `support`, `crm` | 3016 | 🟣 #9333EA |
| **full** | Quelyos Suite | Tous (9 modules) | 5175 | 🟣 #6366F1 |

---

## 🛠️ Commandes Essentielles

### **Dev** (lancer édition en local)
```bash
pnpm run dev:finance   # Quelyos Finance (port 3010)
pnpm run dev:store     # Quelyos Store (port 3011)
pnpm run dev           # Quelyos Suite (port 5175, édition full)
```

### **Build** (construire édition)
```bash
pnpm run build:finance   # → dist-finance/
pnpm run build:store     # → dist-store/
pnpm run build:all       # Toutes éditions (séquentiel)
```

### **Tests**
```bash
pnpm test                # Tests unitaires (24 tests)
pnpm run test:e2e        # E2E tous navigateurs
pnpm run test:e2e:finance # E2E édition Finance
```

### **Docker**
```bash
# Build image Finance
docker build --build-arg EDITION=finance -t quelyos-finance:latest .

# Lancer toutes éditions
docker-compose up -d

# Health check
curl http://localhost:3010/health
```

---

## 📚 Fichiers Clés

### **Configuration**
- `src/config/editions.ts` — Définition 8 éditions (branding, modules)
- `src/lib/editionDetector.ts` — Détection édition active
- `src/hooks/useBranding.ts` — Branding dynamique
- `src/hooks/usePermissions.ts` — Filtrage modules

### **Build**
- `vite.config.ts` — Builds multi-éditions + tree-shaking
- `package.json` — Scripts `dev:*` et `build:*`

### **Docker**
- `Dockerfile` — Multi-stage avec ARG EDITION
- `docker-compose.yml` — 7 services parallèles
- `nginx.conf` — Config SPA

### **CI/CD**
- `.github/workflows/build-editions.yml` — Matrix 7 éditions

### **Tests**
- `src/hooks/*.test.ts` — Tests unitaires (24 tests)
- `e2e/editions.spec.ts` — Tests E2E
- `playwright.config.ts` — Config Playwright

---

## 🔍 Comment Ça Marche ?

### **1. Détection Édition**
```typescript
// Build-time (prioritaire)
VITE_EDITION=finance pnpm build

// Runtime (subdomain)
finance.quelyos.com → édition finance

// Runtime (port dev)
localhost:3010 → édition finance

// Fallback
app.quelyos.com → édition full
```

### **2. Filtrage Modules**
```typescript
// Exemple : User "Finance User" dans édition Finance
canAccessModule('finance') // ✅ true (whitelisté)
canAccessModule('store')   // ❌ false (non whitelisté)
```

### **3. Branding Dynamique**
```typescript
useBranding() // Hook avec effets

// Applique automatiquement :
document.documentElement.style.setProperty('--color-primary', '#059669')
document.title = 'Quelyos Finance'
favicon.href = '/favicon.svg'
```

---

## 🎓 Cas d'Usage

### **Développer une nouvelle page Finance**
```bash
# 1. Lancer édition Finance
pnpm run dev:finance

# 2. Créer page dans src/pages/finance/
# 3. Vérifier branding (couleur verte, seul module finance)
# 4. Tester navigation (blocage modules non-finance)
```

### **Tester une édition complète**
```bash
# 1. Build édition
pnpm run build:store

# 2. Vérifier bundle size
ls -lh dist-store/assets/*.js

# 3. Tester E2E
pnpm run test:e2e:store

# 4. Déployer Docker
docker build --build-arg EDITION=store -t quelyos-store .
docker run -p 3011:80 quelyos-store
```

### **Ajouter une nouvelle édition**
```typescript
// 1. Ajouter dans src/config/editions.ts
export const EDITIONS = {
  // ...
  mynewedition: {
    id: 'mynewedition',
    name: 'My New Edition',
    color: '#FF5733',
    modules: ['finance', 'crm'],
    port: 3020,
  }
}

// 2. Ajouter scripts package.json
{
  "dev:mynewedition": "VITE_EDITION=mynewedition vite",
  "build:mynewedition": "VITE_EDITION=mynewedition vite build"
}

// 3. Tester
pnpm run dev:mynewedition
```

---

## 🐛 Debugging

### **Vérifier édition détectée**
```javascript
// Dans console browser (F12)
console.log(import.meta.env.VITE_EDITION) // 'finance'
```

### **Vérifier modules accessibles**
```javascript
// Dans composant React
const { getAccessibleModules } = usePermissions()
console.log(getAccessibleModules()) // ['finance']
```

### **Vérifier branding appliqué**
```javascript
// Dans console browser
getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
// '#059669' (vert Finance)
```

---

## 📖 Documentation Complète

- `.claude/PHASE0_COMPLETE.md` — Récapitulatif détaillé Phase 0
- `.claude/PHASE0_RECAP.md` — Synthèse tâches 1-6
- Plan migration complet — Message contexte initial

---

## 🚀 Next Steps

**Phase 1 : Finance** (Semaine 2)
1. Corriger bug build pré-existant
2. Valider build Finance
3. Tests E2E
4. Déploiement staging
5. Migration users pilotes

**Documentation mise à jour** : 2026-01-31
