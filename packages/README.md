# Packages - Bibliothèques Partagées Quelyos Suite

Packages partagés utilisés par tous les frontends (ERP Complet + 7 SaaS).

## 📦 Packages Disponibles

### 1. @quelyos/ui-kit
Composants React réutilisables avec Tailwind + dark mode.

**Composants** : Button, Card, Modal, Table, Badge, Input, Select, etc.

```tsx
import { Button, Card } from '@quelyos/ui-kit'

<Card>
  <Button variant="primary">Enregistrer</Button>
</Card>
```

### 2. @quelyos/api-client
Client API Odoo unifié.

```tsx
import { apiClient } from '@quelyos/api-client'

const products = await apiClient.getProducts()
const order = await apiClient.getOrder(1)
```

### 3. @quelyos/utils
Helpers utilitaires.

```tsx
import { formatCurrency, formatDate } from '@quelyos/utils'

formatCurrency(99.99, 'EUR')    // "99,99 €"
formatDate(new Date(), 'fr')    // "31 janvier 2026"
```

### 4. @quelyos/logger
Logger sécurisé production (masque données sensibles).

```tsx
import { logger } from '@quelyos/logger'

logger.info('User action', { userId: 123 })
logger.error('Error occurred', error)
```

## 🏗️ Développement

```bash
# Build tous les packages
pnpm build

# Test package spécifique
pnpm --filter @quelyos/utils test
```

## 📝 Conventions

- Packages : `@quelyos/package-name`
- Exports depuis `src/index.ts`
- TypeScript strict
- Tests unitaires obligatoires

**Version** : 1.0.0 | **Mise à jour** : 2026-01-31
