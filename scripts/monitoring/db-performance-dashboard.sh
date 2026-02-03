#!/bin/bash
# Dashboard monitoring performances PostgreSQL
# Affiche métriques en temps réel pour les indexes tenant

echo "📊 Dashboard Performances PostgreSQL - Quelyos Multi-Tenant"
echo "============================================================="
echo ""
echo "⏰ $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. Utilisation des indexes composites tenant
echo "🎯 Utilisation Indexes Composites Tenant"
echo "-----------------------------------------"
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT
    schemaname || '.' || relname AS table,
    indexrelname AS indexname,
    idx_scan AS utilisations,
    idx_tup_read AS tuples_lus,
    idx_tup_fetch AS tuples_retournés,
    ROUND((idx_tup_fetch::numeric / NULLIF(idx_tup_read, 0)) * 100, 2) AS efficacité_pct
FROM pg_stat_user_indexes
WHERE indexrelname LIKE 'idx_%tenant%'
ORDER BY idx_scan DESC, relname
LIMIT 15;
"

echo ""

# 2. Top 10 requêtes lentes
echo "⏱️  Top 10 Requêtes Lentes (pg_stat_statements)"
echo "-----------------------------------------------"
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT
    ROUND(mean_exec_time::numeric, 2) AS temps_moyen_ms,
    calls AS nb_appels,
    ROUND((total_exec_time / 1000)::numeric, 2) AS temps_total_sec,
    LEFT(query, 80) AS requete
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
  AND query NOT LIKE '%information_schema%'
ORDER BY mean_exec_time DESC
LIMIT 10;
" 2>/dev/null || echo "⚠️  Extension pg_stat_statements non activée"

echo ""

# 3. Statistiques tables volumineuses
echo "📦 Tables Volumineuses (avec indexes tenant)"
echo "---------------------------------------------"
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT
    schemaname || '.' || relname AS table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS taille_totale,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||relname)) AS taille_indexes,
    n_tup_ins + n_tup_upd + n_tup_del AS operations,
    seq_scan AS seq_scans,
    idx_scan AS index_scans,
    ROUND((idx_scan::numeric / NULLIF(seq_scan + idx_scan, 0)) * 100, 2) AS pct_index_usage
FROM pg_stat_user_tables
WHERE relname IN ('product_template', 'sale_order', 'res_partner', 'stock_quant', 'account_move', 'crm_lead')
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;
"

echo ""

# 4. Cache PostgreSQL
echo "💾 Cache PostgreSQL (Buffer Hit Ratio)"
echo "---------------------------------------"
docker exec quelyos-db psql -U odoo -d quelyos -c "
SELECT
    ROUND(
        (sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100,
        2
    ) AS cache_hit_ratio_pct
FROM pg_statio_user_tables;
"

echo ""
echo "💡 Interprétation :"
echo "   - Utilisation indexes : Plus c'est élevé, mieux c'est"
echo "   - Efficacité : >80% = excellent, 50-80% = bon, <50% = à optimiser"
echo "   - % Index usage : >95% = optimal, <50% = trop de seq scans"
echo "   - Cache hit ratio : >99% = excellent, <90% = augmenter shared_buffers"
echo ""

