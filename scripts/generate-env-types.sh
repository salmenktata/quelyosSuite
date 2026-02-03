#!/bin/bash
# Génération automatique des types TypeScript pour variables d'environnement
# Analyse le code source pour détecter toutes les variables utilisées

set -e

echo "🔍 Génération automatique des types d'environnement..."
echo ""

generate_vite_env_types() {
  local project=$1
  local src_dir=$2

  echo "📦 $project"

  # Trouver toutes les variables VITE_ utilisées dans le code (exclure vite-env.d.ts)
  vars=$(grep -r "import\.meta\.env\.VITE_" "$src_dir" --no-filename --exclude="vite-env.d.ts" --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -o 'import\.meta\.env\.VITE_[A-Z_]*' | \
    sed 's/import\.meta\.env\.//' | \
    sort -u || echo "")

  if [ -z "$vars" ]; then
    echo "   ⚠️  Aucune variable VITE_ trouvée"
    return
  fi

  # Générer le fichier vite-env.d.ts
  cat > "$project/src/vite-env.d.ts" << 'EOF'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
EOF

  # Ajouter chaque variable avec son type (toujours string car import.meta.env renvoie des strings)
  while IFS= read -r var; do
    if [ -n "$var" ]; then
      echo "  readonly $var: string" >> "$project/src/vite-env.d.ts"
    fi
  done <<< "$vars"

  # Fermer l'interface
  cat >> "$project/src/vite-env.d.ts" << 'EOF'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
EOF

  # Compter les variables
  count=$(echo "$vars" | wc -l | xargs)
  echo "   ✅ $count variables détectées et typées"
  echo ""
}

# Générer pour dashboard-client
if [ -d "dashboard-client" ]; then
  generate_vite_env_types "dashboard-client" "dashboard-client/src"
fi

# Générer pour super-admin-client
if [ -d "super-admin-client" ]; then
  generate_vite_env_types "super-admin-client" "super-admin-client/src"
fi

echo "✅ Génération des types complète!"
echo ""
echo "💡 Astuce : Ajouter ce script à package.json :"
echo '   "scripts": { "types:env": "./scripts/generate-env-types.sh" }'
