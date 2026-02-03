# @quelyos/config

> Configuration centralisée pour Quelyos Suite - URLs, ports et environnements

## 📦 Installation

```bash
pnpm add @quelyos/config
```

## 🎯 Objectif

Package central pour **éliminer toutes les URLs hardcodées** dans Quelyos Suite. Source de vérité unique pour ports, URLs backend/frontend, services externes et constantes globales.

## ✅ Conformité CLAUDE.md

Ce package implémente la règle **"🎯 URLS CENTRALISÉES - RÈGLE ABSOLUE"** :
- ❌ **JAMAIS** hardcoder `http://localhost:8069`, `http://localhost:3000`, etc.
- ✅ **TOUJOURS** utiliser `@quelyos/config`

## 📚 Usage

### Ports

```typescript
import { PORTS } from '@quelyos/config';

// Vite config
export default defineConfig({
  server: { port: PORTS.dashboard }
});

// Next.js config
export default {
  devServer: { port: PORTS.vitrine }
};
```

### Applications Frontend

```typescript
import { APPS, getAppUrl, buildCrossAppUrl } from '@quelyos/config';

// URL selon environnement
const dashboardUrl = getAppUrl('dashboard', 'development'); // http://localhost:5175
const prodUrl = getAppUrl('dashboard', 'production');       // https://backoffice.quelyos.com

// Navigation cross-app
const loginUrl = buildCrossAppUrl('vitrine', '/login'); // http://localhost:3000/login
```

### Backend API

```typescript
import { API, getBackendUrl, buildApiUrl, getProxiedImageUrl } from '@quelyos/config';

// URL backend
const backendUrl = getBackendUrl('development'); // http://localhost:8069

// Construire URL API
const productsUrl = buildApiUrl('/products'); // http://localhost:8069/api/products

// Proxifier images (anonymisation)
const imageUrl = getProxiedImageUrl('/web/image/product.template/123/image_1920');
// → http://localhost:3001/web/image/product.template/123/image_1920
```

### Proxy Vite

```typescript
import { getViteProxyConfig } from '@quelyos/config';

export default defineConfig({
  server: {
    port: PORTS.dashboard,
    proxy: getViteProxyConfig()
  }
});
```

### Rewrites Next.js

```typescript
import { getNextRewriteConfig } from '@quelyos/config';

export default {
  async rewrites() {
    return getNextRewriteConfig();
  }
};
```

### Services Externes

```typescript
import { STRIPE, GOOGLE, IMAGES, isExternalService } from '@quelyos/config';

// URLs services externes
const stripeUrl = STRIPE.dashboard; // https://dashboard.stripe.com
const googleFonts = GOOGLE.fonts;   // https://fonts.googleapis.com
const unsplashApi = IMAGES.unsplash.api; // https://api.unsplash.com

// Vérifier si URL externe
isExternalService('https://api.stripe.com/v1/charges'); // true
```

### Constantes

```typescript
import { TIMEOUTS, STORAGE_KEYS, ERROR_CODES, PATTERNS } from '@quelyos/config';

// Timeouts
const apiTimeout = TIMEOUTS.API_REQUEST; // 30000ms

// LocalStorage
localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

// Erreurs
throw new Error(ERROR_CODES.UNAUTHORIZED);

// Regex
PATTERNS.EMAIL.test('user@example.com'); // true
```

### Validation Environnement (Zod)

```typescript
import { validateViteEnv, validateNextEnv } from '@quelyos/config';

// Vite (import.meta.env)
const config = validateViteEnv(import.meta.env);
// → { VITE_BACKEND_URL: "http://localhost:8069", ... }

// Next.js (process.env)
const config = validateNextEnv(process.env);
// → { NEXT_PUBLIC_BACKEND_URL: "http://localhost:8069", ... }
```

### Détection Environnement

```typescript
import { detectEnvironment, isDevelopment, isProduction, isServer } from '@quelyos/config';

if (isDevelopment()) {
  console.log('Mode dev');
}

if (isServer()) {
  // Code server-side uniquement
}
```

## 📁 Structure

```
packages/config/
├── src/
│   ├── ports.ts          # Ports fixes (RÈGLE CLAUDE.md absolue)
│   ├── apps.ts           # URLs 4 frontends (dev/staging/prod)
│   ├── api.ts            # Backend API + proxy Vite helper
│   ├── external.ts       # Services externes (Stripe, Unsplash, etc.)
│   ├── validation.ts     # Schémas Zod pour env
│   ├── env.ts            # Détection environnement (server/client/vite)
│   ├── constants.ts      # Constantes (timeouts, keys storage)
│   ├── routes.ts         # Routes (existant)
│   └── index.ts          # Exports modulaires
├── package.json
└── tsconfig.json
```

## 🧪 Tests

```bash
pnpm test
```

Tests couvrent :
- Ports fixes (PORTS.*)
- URLs frontends (APPS.*)
- Backend API (API.*)
- Services externes
- Constantes

## 🔒 Anonymisation Odoo

Ce package respecte la règle **"🔒 ANONYMISATION ODOO"** :
- ❌ Ne mentionne **JAMAIS** "Odoo" dans les exports
- ✅ Utilise des noms génériques : `backend`, `API`, `getBackendUrl()`
- ✅ Fonction `getProxiedImageUrl()` pour masquer `/web/image`

## ⚡ Optimisation Tokens

Mode économie activé :
- Build ESM uniquement (tree-shaking)
- Exports modulaires (import uniquement ce qui est utilisé)
- Types TypeScript générés automatiquement

## 🛠️ Config Build Partagée

### TypeScript
```json
{
  "extends": "@quelyos/config/typescript"
}
```

### ESLint (Next.js)
```javascript
import quelyosConfig from "@quelyos/config/eslint/next";
export default quelyosConfig;
```

### Tailwind CSS
```javascript
const baseConfig = require("@quelyos/config/tailwind");

module.exports = {
  ...baseConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
  ],
};
```

### PostCSS
```javascript
module.exports = require("@quelyos/config/postcss");
```

## 📖 Voir aussi

- [CLAUDE.md](../../CLAUDE.md) - Règles globales
- [scripts/check-hardcoded-urls.sh](../../scripts/check-hardcoded-urls.sh) - Script de vérification

## 🚨 Important

**Ne JAMAIS modifier les ports** sans mettre à jour `CLAUDE.md`. Les ports sont fixés et documentés :
- `vitrine`: 3000
- `ecommerce`: 3001
- `dashboard`: 5175
- `superadmin`: 9000
- `backend`: 8069

En cas de conflit de port, **tuer le processus** qui occupe le port, ne PAS changer le port ici.
