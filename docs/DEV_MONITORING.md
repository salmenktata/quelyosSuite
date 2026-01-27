# 🔍 Guide de Monitoring Dev - Phase 1

Outils de détection d'erreurs en temps réel pour le développement local.

## 📦 Ce qui a été mis en place

### 1. Script de Monitoring Console (`scripts/dev-monitor.js`)

Dashboard temps réel surveillant les 3 frontends :
- **Vitrine Quelyos** (port 3000)
- **E-commerce Client** (port 3001)
- **Dashboard Backoffice** (port 5175)

**Fonctionnalités** :
- ✅ Compteurs d'erreurs/warnings par service
- ✅ Buffer des 10 dernières erreurs
- ✅ Alerte sonore sur erreur critique
- ✅ Rafraîchissement auto toutes les 5s
- ✅ Résumé final à l'arrêt

**Usage** :
```bash
node scripts/dev-monitor.js
```

**Limitations actuelles** :
- Nécessite que les services soient déjà lancés
- Affiche dashboard statique (pas de parsing logs en temps réel pour l'instant)
- Pour monitoring complet, utiliser en parallèle des logs natifs

---

### 2. Health Check API Endpoints

Endpoints exposant l'état de santé de chaque service.

#### Dashboard Client (`/api/health`)
**GET** `http://localhost:5175/api/health`

**Réponse** :
```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T10:30:00.000Z",
  "uptime": 3600,
  "errors": [...],
  "warnings": [...],
  "metrics": {
    "errorCount": 0,
    "warningCount": 2,
    "lastErrorTime": null
  }
}
```

**Statuts possibles** :
- `healthy` : Aucune erreur récente
- `degraded` : 3-10 erreurs dans la dernière minute
- `down` : Plus de 10 erreurs dans la dernière minute

#### E-commerce Client (`/api/health`)
**GET** `http://localhost:3001/api/health`

**Réponse** :
```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T10:30:00.000Z",
  "service": "vitrine-client",
  "version": "0.1.0",
  "uptime": 3600
}
```

#### Vitrine Quelyos (`/api/health`)
**GET** `http://localhost:3000/api/health`

**Réponse** : Identique à E-commerce Client

---

### 3. Logger Centralisé

Remplacement de tous les `console.log` par un logger sécurisé.

#### Dashboard Client (`src/lib/logger.ts`)

**API** :
```typescript
import { logger } from '@/lib/logger';

// Erreurs (silencieux en prod, capturé dans health check)
logger.error('Error message', error);

// Warnings (silencieux en prod, capturé dans health check)
logger.warn('Warning message', data);

// Info (toujours visible)
logger.info('Info message');

// Debug (uniquement en dev)
logger.debug('Debug message', data);
```

**Intégration Health Check** :
- Les erreurs/warnings sont automatiquement loggés dans le système de health check
- Buffer de 5 minutes, max 50 entrées par type
- Nettoyage automatique des anciennes entrées

**Fichiers modifiés** :
- ✅ `src/pages/NoticeAnalytics.tsx`
- ✅ `src/components/common/ErrorBoundary.tsx`
- ✅ `src/lib/finance/api.ts`
- ✅ `src/lib/stock/tree-utils.ts`

**Résultat** : **0 console.log non autorisés** dans `dashboard-client/src`

---

## 🚀 Comment utiliser

### Pendant le développement

1. **Lancer les services** :
```bash
./scripts/dev-start.sh all
```

2. **Lancer le moniteur d'erreurs** (dans un terminal séparé) :
```bash
node scripts/dev-monitor.js
```

3. **Vérifier le health check manuellement** :
```bash
# Dashboard
curl http://localhost:5175/api/health | jq

# E-commerce
curl http://localhost:3001/api/health | jq

# Vitrine
curl http://localhost:3000/api/health | jq
```

### Script de vérification rapide

Créer `scripts/check-health.sh` :
```bash
#!/bin/bash
echo "🏥 Vérification santé des services..."
echo ""

echo "Dashboard (5175):"
curl -s http://localhost:5175/api/health | jq '.status' || echo "❌ DOWN"

echo ""
echo "E-commerce (3001):"
curl -s http://localhost:3001/api/health | jq '.status' || echo "❌ DOWN"

echo ""
echo "Vitrine (3000):"
curl -s http://localhost:3000/api/health | jq '.status' || echo "❌ DOWN"
```

---

## 🎯 Prochaines étapes (Phase 2 & 3)

### Phase 2 - Tests & Prévention
- [ ] Pre-commit hooks (TypeScript, ESLint, console.log check)
- [ ] Vitest + tests unitaires watch mode
- [ ] Integration dans CI/CD

### Phase 3 - Tests E2E
- [ ] Tests Playwright flux critiques
- [ ] Screenshots automatiques sur échec
- [ ] Rapport HTML de test

---

## 🐛 Dépannage

### Le moniteur ne détecte rien
- Vérifier que les services sont lancés
- Vérifier les ports (3000, 3001, 5175)
- Le moniteur actuel affiche un dashboard statique, il ne parse pas encore les logs en temps réel

### Health check retourne 500
- Le service n'est probablement pas lancé
- Vérifier les logs du service concerné

### Trop d'erreurs dans le health check
- Status `degraded` ou `down` indique un problème récurrent
- Consulter `errors` array dans la réponse pour les détails
- Utiliser `logger.error()` pour tracer l'origine

---

## 📚 Références

- Logger partagé : `shared/logger/src/index.ts`
- Health check lib : `dashboard-client/src/lib/health.ts`
- Monitoring script : `scripts/dev-monitor.js`
