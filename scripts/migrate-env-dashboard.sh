#!/bin/bash
# Migration variables .env - Dashboard-Client

echo "🔄 Migration Dashboard-Client..."
echo ""

for file in dashboard-client/.env dashboard-client/.env.example dashboard-client/.env.development dashboard-client/.env.production; do
  if [ -f "$file" ]; then
    echo "  📄 Migrating $file..."

    # Backup
    cp "$file" "$file.bak"

    # Supprimer VITE_API_URL (garder VITE_BACKEND_URL)
    sed -i '' '/^VITE_API_URL=/d' "$file"

    # Renommer VITE_SHOP_URL -> VITE_ECOMMERCE_URL
    sed -i '' 's/^VITE_SHOP_URL=/VITE_ECOMMERCE_URL=/' "$file"

    # Renommer VITE_SITE_URL -> VITE_VITRINE_URL
    sed -i '' 's/^VITE_SITE_URL=/VITE_VITRINE_URL=/' "$file"

    # Supprimer VITE_API_TIMEOUT
    sed -i '' '/^VITE_API_TIMEOUT=/d' "$file"

    echo "     ✅ Migrated"
  fi
done

echo ""
echo "✅ Dashboard-Client migration complète"
