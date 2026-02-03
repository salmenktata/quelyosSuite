#!/bin/bash
# Script automatique de génération de données seed
# Utilise l'API Super Admin pour générer des données de test

set -e

SUPER_ADMIN_URL="${1:-https://admin.quelyos.com}"
TENANT_ID="${2:-1}"
VOLUMETRY="${3:-standard}"

echo "╔════════════════════════════════════════════════════════╗"
echo "║     GÉNÉRATION AUTOMATIQUE DONNÉES SEED               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo
echo "URL: $SUPER_ADMIN_URL"
echo "Tenant ID: $TENANT_ID"
echo "Volumétrie: $VOLUMETRY"
echo

# Configuration seed
cat > /tmp/seed_config.json <<EOF
{
  "tenant_id": $TENANT_ID,
  "volumetry": "$VOLUMETRY",
  "modules": ["store", "stock", "crm"],
  "reset_before_seed": false,
  "enable_relations": true,
  "enable_unsplash_images": true
}
EOF

echo "📤 Envoi de la requête de génération..."
response=$(curl -s -X POST \
  "$SUPER_ADMIN_URL/api/super-admin/seed-data/generate" \
  -H "Content-Type: application/json" \
  -d @/tmp/seed_config.json)

echo "Response: $response"

job_id=$(echo "$response" | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$job_id" ]; then
  echo "❌ Erreur: Impossible de démarrer la génération"
  echo "Réponse serveur: $response"
  exit 1
fi

echo "✓ Job créé: $job_id"
echo
echo "📊 Monitoring de la progression..."
echo

# Monitoring du job
while true; do
  status_response=$(curl -s "$SUPER_ADMIN_URL/api/super-admin/seed-data/status/$job_id")

  status=$(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  progress=$(echo "$status_response" | grep -o '"progress_percent":[0-9]*' | cut -d':' -f2)
  current_module=$(echo "$status_response" | grep -o '"current_module":"[^"]*"' | cut -d'"' -f4)

  echo -ne "\r🔄 Progression: ${progress}% - Module: ${current_module}          "

  if [ "$status" = "completed" ]; then
    echo
    echo
    echo "✅ Génération terminée avec succès !"

    # Afficher résultats
    echo "$status_response" | grep -o '"results":{[^}]*}' || true
    break
  elif [ "$status" = "error" ]; then
    echo
    echo "❌ Erreur lors de la génération"
    error_msg=$(echo "$status_response" | grep -o '"error_message":"[^"]*"' | cut -d'"' -f4)
    echo "Message: $error_msg"
    exit 1
  fi

  sleep 3
done

echo
echo "🎉 Données seed générées avec succès !"
echo
echo "Vérification:"
echo "  - E-commerce: https://shop.quelyos.com/products"
echo "  - API: curl https://shop.quelyos.com/api/products?limit=5"
