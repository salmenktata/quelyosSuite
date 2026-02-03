#!/bin/bash
# Script d'application des indexes composites tenant_id
# Exécute la migration 19.0.3.1.0 pour optimiser les performances DB

set -e

echo "🔍 Application des indexes composites tenant_id (Migration 19.0.3.1.0)"
echo "========================================================================"
echo ""
echo "📊 Impact attendu :"
echo "  - Requêtes produits : 3-5x plus rapides"
echo "  - Requêtes commandes : 3-4x plus rapides"
echo "  - Requêtes contacts : 2-3x plus rapides"
echo "  - Requêtes stock : 4-6x plus rapides"
echo ""

# Vérifier que le conteneur est actif
if ! docker ps --filter "name=quelyos-odoo" --format "{{.Names}}" | grep -q "quelyos-odoo"; then
    echo "❌ Erreur : Le conteneur quelyos-odoo n'est pas actif"
    echo "   Démarrez-le avec : cd odoo-backend && docker-compose up -d"
    exit 1
fi

echo "✅ Conteneur quelyos-odoo actif"
echo ""

# Marquer le module pour upgrade
echo "📦 Marquage module quelyos_api pour upgrade..."
docker exec quelyos-db psql -U odoo -d quelyos -c \
    "UPDATE ir_module_module SET state = 'to upgrade' WHERE name = 'quelyos_api';" \
    > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Module marqué pour upgrade"
else
    echo "❌ Erreur lors du marquage du module"
    exit 1
fi

echo ""
echo "🔄 Redémarrage Odoo avec upgrade..."
echo "   (Cela peut prendre 30-60 secondes)"
echo ""

# Redémarrer Odoo pour appliquer l'upgrade
docker restart quelyos-odoo > /dev/null

# Attendre que le conteneur soit prêt
echo "⏳ Attente démarrage conteneur..."
sleep 5

# Vérifier que le conteneur est healthy
MAX_WAIT=60
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' quelyos-odoo 2>/dev/null || echo "none")

    if [ "$HEALTH" = "healthy" ]; then
        echo "✅ Conteneur redémarré et healthy"
        break
    fi

    echo -n "."
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo ""
    echo "⚠️  Timeout : Le conteneur n'est pas devenu healthy dans les temps"
    echo "   Vérifiez les logs : docker logs quelyos-odoo"
    exit 1
fi

echo ""
echo "🔍 Vérification version module..."

# Vérifier la version du module après upgrade
VERSION=$(docker exec quelyos-db psql -U odoo -d quelyos -t -c \
    "SELECT latest_version FROM ir_module_module WHERE name = 'quelyos_api';" \
    2>/dev/null | xargs)

echo "   Version actuelle : $VERSION"
echo ""

# Vérifier les indexes créés
echo "📊 Vérification indexes créés..."
INDEX_COUNT=$(docker exec quelyos-db psql -U odoo -d quelyos -t -c \
    "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%_tenant_%';" \
    2>/dev/null | xargs)

echo "   Indexes tenant_id trouvés : $INDEX_COUNT"
echo ""

if [ "$INDEX_COUNT" -gt 0 ]; then
    echo "✅ Migration appliquée avec succès !"
    echo ""
    echo "📋 Liste des indexes créés :"
    docker exec quelyos-db psql -U odoo -d quelyos -c \
        "SELECT schemaname, tablename, indexname
         FROM pg_indexes
         WHERE indexname LIKE 'idx_%_tenant_%'
         ORDER BY tablename, indexname;" \
        2>/dev/null || true
else
    echo "⚠️  Aucun index tenant_id détecté"
    echo "   Vérifiez les logs Odoo : docker logs quelyos-odoo --tail 100"
fi

echo ""
echo "✅ Script terminé"
echo ""
echo "💡 Pour vérifier les performances :"
echo "   - Comparez les temps de requêtes avant/après"
echo "   - Utilisez EXPLAIN ANALYZE sur les requêtes lentes"
echo "   - Consultez : scripts/monitoring/db-query-analyzer.sh"
