#!/bin/bash
set -e

MODULE=${1:-quelyos_api}

echo "🔄 Upgrading module: $MODULE"
docker-compose exec odoo odoo -d quelyos -u $MODULE --stop-after-init

echo "♻️  Restarting Odoo..."
docker-compose restart odoo

echo "✅ Done! Waiting for Odoo to be ready..."
sleep 5

echo "🧪 Testing API health..."
curl -s http://localhost:8069/web/health 2>/dev/null | grep -q "pass" && echo "✅ Odoo is healthy" || echo "⚠️  Odoo health check failed (may be normal)"

echo ""
echo "📝 Logs récents (erreurs uniquement) :"
docker logs quelyos-odoo --tail 50 2>&1 | grep -i "error\|exception\|traceback" || echo "✅ Aucune erreur détectée"
