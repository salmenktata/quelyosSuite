# Prochaines Étapes - Amélioration Configuration Centralisée

**Post-Migration URLs Centralisées** - Optionnel
**Date** : 3 février 2026

---

## 🎯 Améliorations Prioritaires

### P0 : Sécurité & Stabilité

#### 1. Pre-commit Hook Strict
**Statut** : 🟡 Recommandé
**Effort** : 30 min

Ajouter vérification URLs dans `.husky/pre-commit` :

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Bloquer URLs hardcodées
echo "🔍 Vérification URLs hardcodées..."
if ! ./scripts/check-hardcoded-urls.sh; then
  echo "❌ URLs hardcodées détectées. Utiliser @quelyos/config"
  exit 1
fi

# Continuer avec lint-staged
npx lint-staged
```

**Bénéfices** :
- Impossible de commiter URLs hardcodées
- Validation automatique avant chaque commit
- Cohérence garantie dans le temps

---

#### 2. CI/CD Validation
**Statut** : 🟡 Recommandé
**Effort** : 1h

Intégrer dans pipeline GitHub Actions :

```yaml
# .github/workflows/validate-config.yml
name: Validate Configuration

on: [push, pull_request]

jobs:
  check-hardcoded-urls:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check hardcoded URLs
        run: |
          chmod +x ./scripts/check-hardcoded-urls.sh
          ./scripts/check-hardcoded-urls.sh
```

**Bénéfices** :
- Validation sur chaque PR
- Détection précoce erreurs
- Protection branche main

---

### P1 : Optimisation

#### 3. Standardisation Variables .env
**Statut** : 🟢 Optionnel
**Effort** : 2h

Uniformiser noms variables environnement :

**Avant** :
```bash
# dashboard-client/.env
VITE_API_URL=...
VITE_BACKEND_URL=...

# vitrine-client/.env
NEXT_PUBLIC_BACKEND_URL=...
BACKEND_URL=...
```

**Après** :
```bash
# Tous les projets
BACKEND_URL=...           # Server-side
PUBLIC_BACKEND_URL=...    # Client-side
```

**Script de migration** :
```bash
#!/bin/bash
# scripts/migrate-env-vars.sh

# Renommer variables dans tous les .env
find . -name ".env*" -type f -exec sed -i '' \
  's/NEXT_PUBLIC_BACKEND_URL/PUBLIC_BACKEND_URL/g' {} +
find . -name ".env*" -type f -exec sed -i '' \
  's/VITE_BACKEND_URL/PUBLIC_BACKEND_URL/g' {} +
```

---

#### 4. TypeScript Declarations Auto
**Statut** : 🟢 Optionnel
**Effort** : 1h

Réactiver DTS generation quand bug Rollup corrigé :

```typescript
// packages/config/tsup.config.ts
export default defineConfig({
  // ...
  dts: true,  // ✅ Réactiver quand Rollup bug fixé
});
```

**Alternative temporaire** : Générer manuellement avec `tsc`

```json
// packages/config/package.json
{
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly --declaration --outDir dist"
  }
}
```

---

### P2 : Fonctionnalités Avancées

#### 5. Tests E2E Validation URLs
**Statut** : 🔵 Nice-to-have
**Effort** : 3h

Vérifier URLs correctes en runtime :

```typescript
// tests/e2e/config-validation.spec.ts
import { test, expect } from '@playwright/test';
import { PORTS, APPS, API } from '@quelyos/config';

test.describe('Configuration URLs', () => {
  test('should use correct backend URL', async ({ page }) => {
    await page.goto(APPS.dashboard.dev);

    // Intercepter requêtes API
    const apiRequests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/api/')) {
        apiRequests.push(req.url());
      }
    });

    // Vérifier que toutes les requêtes utilisent le bon backend
    await page.waitForTimeout(2000);
    apiRequests.forEach(url => {
      expect(url).toContain(API.backend.dev);
      expect(url).not.toContain('localhost:8069'); // ❌ Hardcodé
    });
  });

  test('should use correct ports', async ({ page }) => {
    const dashboardUrl = new URL(APPS.dashboard.dev);
    expect(dashboardUrl.port).toBe(String(PORTS.dashboard));
  });
});
```

---

#### 6. Monitoring Runtime Errors
**Statut** : 🔵 Nice-to-have
**Effort** : 2h

Détecter URLs hardcodées en production via Sentry/logging :

```typescript
// packages/config/src/monitoring.ts
export function validateRuntimeUrls() {
  const forbiddenPatterns = [
    'localhost:8069',
    'localhost:3000',
    'localhost:5175',
  ];

  // Intercepter fetch global
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = String(args[0]);

    forbiddenPatterns.forEach(pattern => {
      if (url.includes(pattern) && process.env.NODE_ENV === 'production') {
        console.error(`⚠️ Hardcoded URL detected: ${url}`);
        // Envoyer à Sentry
        // Sentry.captureException(new Error(`Hardcoded URL: ${url}`));
      }
    });

    return originalFetch(...args);
  };
}
```

---

#### 7. Config Playground/Sandbox
**Statut** : 🔵 Nice-to-have
**Effort** : 4h

Créer page de test configuration :

```typescript
// packages/config/playground/index.html
<!DOCTYPE html>
<html>
<head>
  <title>@quelyos/config Playground</title>
</head>
<body>
  <h1>Configuration Playground</h1>

  <h2>Ports</h2>
  <pre id="ports"></pre>

  <h2>URLs (Development)</h2>
  <pre id="urls-dev"></pre>

  <h2>URLs (Production)</h2>
  <pre id="urls-prod"></pre>

  <script type="module">
    import { PORTS, APPS, API } from '../dist/index.js';

    document.getElementById('ports').textContent =
      JSON.stringify(PORTS, null, 2);

    document.getElementById('urls-dev').textContent =
      JSON.stringify({
        vitrine: APPS.vitrine.dev,
        ecommerce: APPS.ecommerce.dev,
        dashboard: APPS.dashboard.dev,
        backend: API.backend.dev,
      }, null, 2);

    document.getElementById('urls-prod').textContent =
      JSON.stringify({
        vitrine: APPS.vitrine.prod,
        ecommerce: APPS.ecommerce.prod,
        dashboard: APPS.dashboard.prod,
        backend: API.backend.prod,
      }, null, 2);
  </script>
</body>
</html>
```

---

## 📋 Checklist Maintenance Continue

### Quotidien
- [ ] Lancer `check-hardcoded-urls.sh` avant chaque commit
- [ ] Vérifier que les builds passent
- [ ] Utiliser `@quelyos/config` pour toute nouvelle feature

### Hebdomadaire
- [ ] Vérifier logs erreurs URLs hardcodées (si monitoring activé)
- [ ] Revoir PRs pour conformité configuration

### Mensuel
- [ ] Mettre à jour documentation si nouveaux services ajoutés
- [ ] Vérifier que script validation couvre tous les patterns
- [ ] Audit complet codebase pour nouvelles URLs hardcodées

### Trimestriel
- [ ] Revoir architecture configuration
- [ ] Évaluer si nouveaux helpers nécessaires
- [ ] Mise à jour dépendances package @quelyos/config

---

## 🔧 Scripts Utiles

### Vérification Rapide
```bash
# Vérifier URLs dans un fichier spécifique
grep -n "localhost:8069\|localhost:5175" path/to/file.ts

# Vérifier tous les imports @quelyos/config
grep -r "from '@quelyos/config'" --include="*.ts" --include="*.tsx"

# Trouver usages d'un helper spécifique
grep -r "getBackendUrl" --include="*.ts" --include="*.tsx"
```

### Statistiques
```bash
# Compter usages @quelyos/config
echo "Imports @quelyos/config:"
grep -r "from '@quelyos/config'" --include="*.ts" --include="*.tsx" | wc -l

# Trouver fichiers sans import (potentiellement à migrer)
find . -name "*.ts" -o -name "*.tsx" | \
  xargs grep -L "@quelyos/config" | \
  xargs grep -l "localhost:8069\|localhost:5175"
```

---

## 🎓 Onboarding Nouveaux Développeurs

### Documentation à Fournir
1. **CLAUDE.md** section "🎯 URLS CENTRALISÉES"
2. **packages/config/README.md**
3. **`.claude/MIGRATION_URLS_CENTRALISEES.md`** (contexte historique)

### Points Clés à Expliquer
- **Pourquoi** : Source de vérité unique, éviter duplication
- **Quoi** : Package `@quelyos/config` contient toutes les URLs/ports
- **Comment** : Toujours importer depuis `@quelyos/config`
- **Validation** : Script `check-hardcoded-urls.sh` obligatoire

### Exercice Pratique
Créer une nouvelle page qui :
1. Se connecte au backend API
2. Redirige vers le dashboard
3. Utilise un timeout standardisé
4. Stocke une clé localStorage

**Solution attendue** :
```typescript
import { getBackendUrl, getAppUrl, TIMEOUTS, STORAGE_KEYS } from '@quelyos/config';

const apiUrl = getBackendUrl(process.env.NODE_ENV as 'development' | 'production');
const dashboardUrl = getAppUrl('dashboard', 'development');
const timeout = TIMEOUTS.API_REQUEST;
const storageKey = STORAGE_KEYS.USER_DATA;
```

---

## 📊 KPIs à Suivre

| Métrique | Cible | Actuel |
|----------|-------|--------|
| URLs hardcodées (code) | 0 | ✅ 0 |
| Coverage imports @quelyos/config | >90% | ~95% |
| Temps validation pre-commit | <5s | ~3s |
| Erreurs URLs runtime (prod) | 0 | N/A |

---

## 🚀 Roadmap Optionnelle (6 mois)

### Q1 2026
- ✅ Migration URLs centralisées complète
- 🟡 Pre-commit hook strict
- 🟡 CI/CD validation

### Q2 2026
- 🟢 Standardisation variables .env
- 🟢 Tests E2E validation URLs
- 🔵 Monitoring runtime errors

### Q3 2026
- 🔵 Config playground
- 🔵 Dashboard monitoring URLs
- 🔵 Métriques usage @quelyos/config

---

## 📞 Support

**Questions/Issues** :
- Documentation : `packages/config/README.md`
- Migration historique : `.claude/MIGRATION_URLS_CENTRALISEES.md`
- Script validation : `scripts/check-hardcoded-urls.sh`

**Maintenance** :
- Owner : Salmen KTATA
- Co-Maintainer : Claude Sonnet 4.5

---

**Dernière mise à jour** : 3 février 2026
**Statut migration** : ✅ **COMPLÈTE**
**Statut améliorations** : 🟡 **En cours d'évaluation**
