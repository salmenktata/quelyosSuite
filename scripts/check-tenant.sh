#!/bin/bash
# Vérifier si un tenant existe pour l'utilisateur connecté

API_URL="http://localhost:8069"
SESSION_ID="${1:-YOUR_SESSION_ID}"

echo "🔍 Vérification du tenant associé à votre compte..."
echo ""

curl -X GET "${API_URL}/api/ecommerce/tenant/my" \
  -H "X-Session-Id: ${SESSION_ID}" \
  -s | jq .

echo ""
echo "Si 'success: true', votre tenant est configuré ✅"
echo "Si 'error: Aucun tenant associé', suivez les instructions de création"
