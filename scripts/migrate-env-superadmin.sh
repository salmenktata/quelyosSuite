#!/bin/bash
# Migration variables .env - Super-Admin-Client

echo "🔄 Migration Super-Admin-Client..."
echo ""

for file in super-admin-client/.env.development super-admin-client/.env.production; do
  if [ -f "$file" ]; then
    echo "  📄 Migrating $file..."

    # Backup
    cp "$file" "$file.bak"

    # Supprimer VITE_API_TIMEOUT
    sed -i '' '/^VITE_API_TIMEOUT=/d' "$file"

    echo "     ✅ Migrated"
  fi
done

echo ""
echo "✅ Super-Admin-Client migration complète"
