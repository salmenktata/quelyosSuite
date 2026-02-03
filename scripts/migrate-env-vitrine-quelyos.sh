#!/bin/bash
# Migration variables .env - Vitrine-Quelyos

echo "🔄 Migration Vitrine-Quelyos..."
echo ""

for file in vitrine-quelyos/.env.production vitrine-quelyos/.env.local; do
  if [ -f "$file" ]; then
    echo "  📄 Migrating $file..."

    # Backup
    cp "$file" "$file.bak"

    # Renommer BACKEND_DB -> BACKEND_DATABASE
    sed -i '' 's/^BACKEND_DB=/BACKEND_DATABASE=/' "$file"

    # Renommer NEXT_PUBLIC_WEBSITE_URL -> NEXT_PUBLIC_VITRINE_URL
    sed -i '' 's/^NEXT_PUBLIC_WEBSITE_URL=/NEXT_PUBLIC_VITRINE_URL=/' "$file"

    echo "     ✅ Migrated"
  fi
done

echo ""
echo "✅ Vitrine-Quelyos migration complète"
