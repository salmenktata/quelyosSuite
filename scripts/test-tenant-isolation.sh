#!/bin/bash
# Script de test d'isolation multi-tenant

set -e

echo "🔒 Tests d'Isolation Multi-Tenant"
echo "=================================="
echo ""

if ! docker ps --filter "name=quelyos-odoo" --format "{{.Names}}" | grep -q "quelyos-odoo"; then
    echo "❌ Erreur : Le conteneur quelyos-odoo n'est pas actif"
    exit 1
fi

echo "📋 Lancement des tests de sécurité..."
echo ""

docker exec quelyos-odoo python3 -m odoo \
    -d quelyos \
    --test-tags tenant_isolation \
    --stop-after-init \
    --log-level=test \
    2>&1 | tee /tmp/tenant-isolation-tests.log

if grep -q "FAILED" /tmp/tenant-isolation-tests.log; then
    echo ""
    echo "❌ ÉCHEC - Des tests de sécurité ont échoué !"
    exit 1
elif grep -q "test_" /tmp/tenant-isolation-tests.log; then
    echo ""
    echo "✅ SUCCÈS - Tous les tests de sécurité passent !"
    TEST_COUNT=$(grep -c "test_" /tmp/tenant-isolation-tests.log || echo "0")
    echo "📊 Tests exécutés : $TEST_COUNT"
    exit 0
fi
