#!/bin/bash
# Script de création d'un tenant via API
# Usage: ./scripts/create-tenant.sh

API_URL="http://localhost:8069"
SESSION_ID="${1:-YOUR_ADMIN_SESSION_ID}"

# Créer le tenant
curl -X POST "${API_URL}/api/ecommerce/tenant/create" \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: ${SESSION_ID}" \
  -d '{
    "name": "Ma Boutique",
    "code": "maboutique",
    "domain": "localhost",
    "backoffice_domain": "localhost:5175",
    "slogan": "Votre boutique en ligne",
    "plan_code": "starter",
    "admin_email": "admin@maboutique.com",
    "primary_color": "#3b82f6",
    "secondary_color": "#10b981"
  }' | jq .

echo ""
echo "✅ Tenant créé ! Accédez à http://localhost:5175/my-shop"
