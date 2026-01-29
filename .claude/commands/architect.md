# Commande /architect - Analyse et Optimisation Architecture

## Description
Analyse l'architecture technique de Quelyos Suite et propose des améliorations basées sur les patterns enterprise-grade déjà implémentés.

## Utilisation
```
/architect [option]
```

## Options
- `status` - Affiche l'état actuel des modules d'architecture
- `audit` - Audit complet de l'architecture
- `optimize` - Propose des optimisations
- `security` - Focus sur la sécurité
- `performance` - Focus sur les performances
- `scalability` - Focus sur la scalabilité
- `refactor` - Analyse factorisation, simplification et robustesse du code
- `tenant-isolation` - Analyse isolation et sécurité multi-tenant

## Instructions

### Étape 1 : Inventaire des modules existants

Vérifie les modules d'architecture dans `odoo-backend/addons/quelyos_api/lib/`:

**Infrastructure (Points 1-8):**
- [ ] `rate_limiter.py` - Limitation du taux de requêtes
- [ ] `audit_log.py` - Journalisation des actions
- [ ] `cache.py` - Cache avec Redis
- [ ] `request_id.py` - Traçabilité des requêtes

**Robustesse (Points 9-14):**
- [ ] `error_tracking.py` - Suivi des erreurs (Sentry)
- [ ] `webhooks.py` - Système de webhooks
- [ ] `versioning.py` - Versioning de l'API

**Production (Points 21-28):**
- [ ] `secrets.py` - Gestion sécurisée des secrets
- [ ] `job_queue.py` - File d'attente de tâches
- [ ] `websocket.py` - Communication temps réel
- [ ] `validation.py` - Validation des données
- [ ] `metrics.py` - Métriques Prometheus
- [ ] `query_builder.py` - Construction sécurisée de requêtes

**Architecture Avancée (Points 29-36):**
- [ ] `event_store.py` - Event Sourcing
- [ ] `cqrs.py` - Command Query Responsibility Segregation
- [ ] `distributed_lock.py` - Verrouillage distribué
- [ ] `encryption.py` - Chiffrement des données
- [ ] `throttling.py` - Throttling par utilisateur

**Enterprise (Points 37-44):**
- [ ] `saga.py` - Saga Pattern (transactions distribuées)
- [ ] `db_routing.py` - Read Replicas
- [ ] `multitenancy.py` - Multi-tenant support
- [ ] `idempotency.py` - Clés d'idempotence
- [ ] `bulk_operations.py` - Opérations en masse
- [ ] `data_transfer.py` - Import/Export
- [ ] `profiler.py` - Performance Profiling
- [ ] `migrations.py` - Database Migrations

**Avancé (Points 45-48):**
- [ ] `service_registry.py` - Service Discovery
- [ ] `rate_plans.py` - API Rate Plans
- [ ] `coalescing.py` - Request Coalescing

### Étape 2 : Vérifier les modules frontend

Dans `dashboard-client/src/lib/`:
- [ ] `api/circuitBreaker.ts` - Circuit Breaker
- [ ] `api/retry.ts` - Retry Logic
- [ ] `api/gateway.ts` - API Gateway
- [ ] `featureFlags.ts` - Feature Flags
- [ ] `websocket/` - WebSocket Client
- [ ] `validation/` - Validation Zod
- [ ] `graphql/` - Client GraphQL
- [ ] `config/` - Configuration centralisée

### Étape 3 : Vérifier les scripts DevOps

Dans `scripts/`:
- [ ] `backup-db.sh` - Backup PostgreSQL
- [ ] `deploy-blue-green.sh` - Blue/Green Deployment
- [ ] `graceful-shutdown.sh` - Graceful Shutdown
- [ ] `db-monitor.sh` - Database Monitoring
- [ ] `job-worker.py` - Background Jobs Worker

### Étape 4 : Analyser et proposer

Selon l'option choisie, analyser et proposer:

**Si `audit`:**
1. Vérifier que tous les modules sont importés dans `lib/__init__.py`
2. Vérifier les dépendances manquantes
3. Identifier les patterns non utilisés
4. Proposer des améliorations de cohérence
5. **Inclure automatiquement** l'analyse refactor (factorisation, simplification, optimisation, robustesse)
6. **Inclure automatiquement** l'analyse tenant-isolation (isolation multi-tenant complète)

**Si `optimize`:**
1. Analyser les performances potentielles
2. Identifier les goulots d'étranglement
3. Proposer des optimisations de cache
4. Suggérer des améliorations de requêtes
5. **Inclure automatiquement** :
   - Analyse de factorisation (DRY pour réduire bundle size)
   - Simplification (réduire complexité = meilleure performance)
   - Optimisations spécifiques (lazy loading, memoization, code splitting)

**Si `security`:**
1. Vérifier les mécanismes d'authentification
2. Auditer les secrets et encryption
3. Vérifier le rate limiting
4. Analyser les validations de données

**Si `performance`:**
1. Analyser le profiler
2. Vérifier le caching
3. Examiner le query builder
4. Évaluer le coalescing

**Si `scalability`:**
1. Vérifier le multi-tenancy
2. Analyser les read replicas
3. Examiner le service registry
4. Évaluer les bulk operations

**Si `refactor`:**
1. **Factorisation** - Identifier le code dupliqué:
   - Fonctions similaires dans plusieurs fichiers
   - Patterns répétés (ex: fetch + error handling)
   - Composants UI avec logique similaire
   - Modèles Odoo avec champs redondants
   - Validation Zod répétée
   - Hooks React personnalisés similaires
2. **Simplification** - Réduire la complexité:
   - Fonctions trop longues (>50 lignes)
   - Imbrications excessives (>3 niveaux)
   - Abstractions inutiles (over-engineering)
   - Dépendances circulaires
   - Code mort (imports/variables non utilisés)
   - Conditions complexes simplifiables
3. **Optimisation** - Améliorer les performances:
   - Requêtes N+1 (backend Odoo)
   - Re-renders React inutiles
   - Bundles JS trop lourds (analyse Vite/Next)
   - Images non optimisées
   - Requêtes API non cachées
   - useEffect avec deps manquantes/excessives
   - Fetch waterfalls (charger en parallèle)
4. **Robustesse** - Améliorer la fiabilité:
   - Gestion d'erreurs manquante (try/catch)
   - Validation de données insuffisante
   - Types TypeScript any/unknown
   - Conditions edge cases non gérées
   - État UI incohérent (loading/error states)
   - Race conditions (async/await)
   - Memory leaks (subscriptions non nettoyées)

**Si `tenant-isolation`:**
1. **Isolation Base de Données** - Vérifier Single-DB stratégie:
   - Vérifier que multitenancy.py utilise `tenant_id` dans toutes les requêtes
   - Audit RLS (Row Level Security) PostgreSQL activée
   - Vérifier tenant_id dans tous les modèles Odoo (champs obligatoires)
   - Pas d'accès cross-tenant possible (tests unitaires)
   - Index composites (tenant_id + autres colonnes) pour performances
2. **Isolation API** - Sécurité endpoints:
   - Vérifier que tenant_security.py filtre TOUS les endpoints
   - Header X-Tenant-ID obligatoire et validé
   - JWT tokens incluent tenant_id (vérifier dans auth.py)
   - Rate limiting par tenant (rate_limiter.py)
   - Logs audit incluent tenant_id (audit_log.py)
3. **Isolation Frontend** - Contexte tenant:
   - Vérifier TenantContext React toujours présent
   - API calls incluent toujours tenant_id
   - Pas de données cross-tenant en cache/localStorage
   - Redirection logout si tenant_id invalide
4. **Isolation Fichiers/Assets** - Stockage séparé:
   - Uploads organisés par tenant_id (`/uploads/tenant_123/`)
   - Pas d'accès direct fichiers autres tenants
   - Vérifier getProxiedImageUrl inclut tenant check
5. **Isolation Cache/Sessions** - Pas de fuites:
   - Keys Redis incluent tenant_id (`tenant:123:cache:...`)
   - Sessions isolées par tenant
   - Invalidation cache ciblée par tenant
6. **Tests d'isolation** - Vérifier qu'aucune fuite possible:
   - Tests unitaires multi-tenant
   - Tests tentatives accès cross-tenant (doivent échouer)
   - Tests injection tenant_id malveillant

### Étape 5 : Rapport

Générer un rapport avec:
- État actuel de chaque catégorie (✅ / ⚠️ / ❌)
- Points d'amélioration prioritaires
- Actions recommandées
- Estimation de complexité (simple/moyen/complexe)

**Format spécifique pour `refactor`:**
- **🔄 Factorisation** : X occurrences de duplication détectées
  - Lister fichiers/fonctions similaires avec % de similarité
  - Proposer extraction en utility/hook/composant partagé
- **🎯 Simplification** : X opportunités identifiées
  - Lister fonctions complexes avec score de complexité
  - Proposer décomposition ou refactoring
- **⚡ Optimisation** : X gains potentiels
  - Lister bottlenecks avec impact estimé
  - Proposer solutions concrètes (lazy load, memo, cache)
- **🛡️ Robustesse** : X risques détectés
  - Lister patterns fragiles avec niveau de risque
  - Proposer corrections prioritaires

## Points d'amélioration potentiels

### Outils d'analyse refactoring (à considérer):
- **SonarQube/SonarCloud** - Analyse qualité code automatisée
- **ESLint complexity rules** - Détection fonctions complexes
- **Duplicate Code Detector** - Identification duplication
- **Bundle Analyzer** - Analyse taille bundles (Vite/Next)
- **React DevTools Profiler** - Détection re-renders inutiles
- **TypeScript strict mode** - Élimination any/unknown
- **Prettier + ESLint** - Formatage et linting automatique
- **Husky + lint-staged** - Pre-commit hooks qualité

### Non encore implémentés (à considérer):
- **Chaos Engineering** - Tests de résilience
- **API Versioning par Header** - Améliorer le versioning
- **Response Compression** - Gzip/Brotli
- **GraphQL Subscriptions** - Real-time GraphQL
- **Database Sharding** - Partitionnement données
- **CDN Integration** - Assets statiques
- **A/B Testing** - Tests utilisateur
- **Audit Dashboard** - UI pour audit logs
- **API Analytics Dashboard** - Métriques usage API
- **Scheduled Tasks Manager** - UI pour jobs planifiés

## Output attendu

```
=== Audit Architecture Quelyos Suite ===

📊 Résumé:
- Modules backend: XX/XX implémentés
- Modules frontend: XX/XX implémentés
- Scripts DevOps: XX/XX présents

✅ Points forts:
- [liste des points forts]

⚠️ Améliorations suggérées:
- [liste des améliorations]

❌ Points critiques:
- [liste si applicable]

📋 Actions recommandées:
1. [action 1]
2. [action 2]
...
```
