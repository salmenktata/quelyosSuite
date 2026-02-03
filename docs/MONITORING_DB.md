# Monitoring Performances Base de Données

**Date** : 2026-02-03
**Version module** : 19.0.3.1.0
**Indexes appliqués** : 15/17 (88%)

---

## 📊 Dashboard Monitoring

### Lancer le dashboard
```bash
bash scripts/monitoring/db-performance-dashboard.sh
```

### Métriques affichées

#### 1. Utilisation Indexes Composites Tenant
Suivi des 15 indexes créés pour l'optimisation multi-tenant :
- **Utilisations** : Nombre de fois où l'index a été utilisé
- **Tuples lus** : Nombre d'entrées lues via l'index
- **Tuples retournés** : Nombre d'entrées retournées
- **Efficacité %** : Ratio retournés/lus (plus c'est élevé, mieux c'est)

**Interprétation** :
- Utilisations = 0 : Index non encore sollicité (normal après création)
- Efficacité > 80% : Excellent
- Efficacité 50-80% : Bon
- Efficacité < 50% : À optimiser

#### 2. Top 10 Requêtes Lentes
*(Nécessite extension `pg_stat_statements` - voir section Activation)*

Identifie les requêtes les plus lentes :
- **Temps moyen (ms)** : Durée moyenne d'exécution
- **Nombre d'appels** : Fréquence d'exécution
- **Temps total (sec)** : Impact cumulé

#### 3. Tables Volumineuses
Statistiques des 6 tables principales avec indexes tenant :
- **Taille totale** : Données + indexes
- **Taille indexes** : Espace occupé par les indexes
- **Opérations** : Insertions + updates + suppressions
- **Sequential scans** : Parcours complet de table (lent)
- **Index scans** : Utilisation d'indexes (rapide)
- **% Index usage** : Ratio index/(index+seq)

**Interprétation** :
- % Index usage > 95% : Optimal
- % Index usage 50-95% : Bon
- % Index usage < 50% : Trop de seq scans, amélioration possible

#### 4. Cache PostgreSQL (Buffer Hit Ratio)
Mesure l'efficacité du cache mémoire PostgreSQL :
- **> 99%** : Excellent (configuration actuelle)
- **90-99%** : Bon
- **< 90%** : Augmenter `shared_buffers` dans postgresql.conf

---

## 📈 État Actuel (2026-02-03)

### Résultats Dashboard

#### Indexes Composites Tenant
✅ 15 indexes créés et détectés
⏳ Utilisations = 0 (pas encore de trafic après création)

**Action** : Attendre trafic réel pour mesurer impact

#### Tables Volumineuses

| Table | Taille | Seq Scans | Index Scans | % Index Usage |
|-------|--------|-----------|-------------|---------------|
| `sale_order` | 472 kB | 1240 | 1989 | **61.60%** 👍 |
| `account_move` | 464 kB | 109 | 107 | **49.54%** |
| `res_partner` | 616 kB | 5061 | 4395 | **46.48%** |
| `product_template` | 664 kB | 1766 | 390 | **18.09%** ⚠️ |
| `stock_quant` | 152 kB | 954 | 204 | **17.62%** ⚠️ |
| `crm_lead` | 872 kB | 168 | 28 | **14.29%** ⚠️ |

**Observations** :
- ✅ `sale_order` : Bon usage des indexes
- ⚠️ `product_template`, `stock_quant`, `crm_lead` : Trop de sequential scans

**Cause probable** : Requêtes sans clause `WHERE company_id = ?` (isolation tenant)

#### Cache PostgreSQL
✅ **99.78%** - Configuration optimale

---

## 🔧 Activation pg_stat_statements (Optionnel)

Extension PostgreSQL pour tracker les requêtes lentes.

### Activer l'extension

```bash
# 1. Activer dans PostgreSQL
docker exec quelyos-db psql -U odoo -d quelyos -c "
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
"

# 2. Ajouter dans postgresql.conf (si pas déjà présent)
docker exec quelyos-db bash -c "
grep -q 'shared_preload_libraries' /var/lib/postgresql/data/postgresql.conf || \
echo \"shared_preload_libraries = 'pg_stat_statements'\" >> /var/lib/postgresql/data/postgresql.conf
"

# 3. Redémarrer PostgreSQL
docker restart quelyos-db

# 4. Vérifier activation
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT * FROM pg_stat_statements LIMIT 1;
"
```

### Désactiver (si nécessaire)
```bash
docker exec quelyos-db psql -U odoo -d quelyos -c "
DROP EXTENSION IF EXISTS pg_stat_statements;
"
```

---

## 📊 Monitoring Continu

### Fréquence recommandée
- **Quotidien (7 premiers jours)** : Vérifier adoption des indexes
- **Hebdomadaire** : Identifier requêtes lentes
- **Mensuel** : Maintenance (VACUUM, REINDEX si fragmentation)

### Commandes rapides

#### Lister indexes tenant
```bash
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT schemaname, relname, indexrelname
FROM pg_stat_user_indexes
WHERE indexrelname LIKE 'idx_%tenant%'
ORDER BY relname, indexrelname;
"
```

#### Statistiques utilisation indexes
```bash
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT
    indexrelname,
    idx_scan AS utilisations,
    idx_tup_read AS tuples_lus,
    idx_tup_fetch AS tuples_retournés
FROM pg_stat_user_indexes
WHERE indexrelname LIKE 'idx_%tenant%'
ORDER BY idx_scan DESC;
"
```

#### EXPLAIN ANALYZE une requête
```bash
docker exec quelyos-db psql -U odoo -d quelyos -c "
EXPLAIN ANALYZE
SELECT * FROM product_template
WHERE company_id = 1
ORDER BY create_date DESC
LIMIT 100;
"
```

Doit afficher : `Index Scan using idx_product_template_tenant_created`

---

## 🎯 Objectifs Performance

### Gains attendus (après adoption)
- Requêtes multi-tenant : **3-6x plus rapides**
- Listing produits par date : **3-5x plus rapide**
- Commandes par tenant : **3-4x plus rapides**
- Recherche clients : **2-3x plus rapides**
- Stock par produit : **4-6x plus rapides**

### KPIs cibles
- % Index usage : **> 80%** pour toutes les tables principales
- Cache hit ratio : **> 99%** (déjà atteint)
- Sequential scans : **< 20%** des requêtes

---

## 🚨 Alertes à Surveiller

### Cache hit ratio < 90%
**Action** : Augmenter `shared_buffers` dans `postgresql.conf`
```conf
shared_buffers = 512MB  # Augmenter selon RAM disponible
```

### Index jamais utilisé (idx_scan = 0 après 7 jours)
**Action** : Investiguer requêtes, supprimer index inutile si confirmé

### Sequential scans excessifs (> 80% du trafic)
**Action** :
1. Vérifier que les requêtes utilisent `WHERE company_id = ?`
2. Analyser avec `EXPLAIN ANALYZE`
3. Créer indexes supplémentaires si nécessaire

---

## 📝 Maintenance Régulière

### Hebdomadaire
```bash
# VACUUM ANALYZE pour mettre à jour statistiques
docker exec quelyos-db psql -U odoo -d quelyos -c "
VACUUM ANALYZE product_template, sale_order, res_partner, stock_quant, account_move, crm_lead;
"
```

### Mensuel
```bash
# Vérifier fragmentation indexes
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT
    schemaname,
    relname,
    indexrelname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS taille,
    idx_scan
FROM pg_stat_user_indexes
WHERE indexrelname LIKE 'idx_%tenant%'
ORDER BY pg_relation_size(indexrelid) DESC;
"

# Si fragmentation détectée (rare) : REINDEX
# docker exec quelyos-db psql -U odoo -d quelyos -c "REINDEX INDEX idx_product_template_tenant_created;"
```

---

## 📚 Ressources

- **Script dashboard** : `scripts/monitoring/db-performance-dashboard.sh`
- **Indexes appliqués** : `INDEXES_APPLIED.md`
- **Tests isolation** : `odoo-backend/addons/quelyos_api/tests/test_tenant_isolation.py`
- **Doc PostgreSQL** : https://www.postgresql.org/docs/current/monitoring-stats.html

---

**Monitoring actif** : ✅ Dashboard opérationnel
**Prochaine vérification** : 2026-02-10 (7 jours après création indexes)
**Dernière mise à jour** : 2026-02-03
