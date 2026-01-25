#!/bin/bash

# Script de vérification du dark mode dans le backoffice
# Usage: ./scripts/check-dark-mode.sh

set -e

cd "$(dirname "$0")/.."

echo "🌓 Vérification du mode dark - Backoffice Quelyos"
echo "================================================"
echo ""

ERRORS=0

# 1. Vérifier la configuration Tailwind
echo "📋 1. Configuration Tailwind..."
if grep -q "darkMode: 'class'" tailwind.config.js; then
  echo "   ✅ darkMode configuré en mode 'class'"
else
  echo "   ❌ darkMode n'est pas configuré correctement"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Vérifier les pages
echo "📄 2. Vérification des pages..."
PAGE_ERRORS=0
for file in src/pages/*.tsx; do
  filename=$(basename "$file")

  # Ignorer Login qui a son propre fond
  if [[ "$filename" == "Login.tsx" ]]; then
    continue
  fi

  # Vérifier si la page a des bg-white sans dark:
  if grep -q 'className.*bg-white[^-]' "$file"; then
    if ! grep -q 'dark:bg-gray' "$file"; then
      echo "   ❌ $filename - bg-white sans variante dark"
      PAGE_ERRORS=$((PAGE_ERRORS + 1))
    fi
  fi

  # Vérifier si la page a des text-gray sans dark:
  if grep -q 'className.*text-gray-[0-9]00[^-]' "$file"; then
    if ! grep -q 'dark:text-' "$file"; then
      echo "   ⚠️  $filename - Peut manquer des variantes dark pour les textes"
    fi
  fi
done

if [[ $PAGE_ERRORS -eq 0 ]]; then
  echo "   ✅ Toutes les pages ont le dark mode"
else
  echo "   ❌ $PAGE_ERRORS page(s) avec problèmes"
  ERRORS=$((ERRORS + PAGE_ERRORS))
fi
echo ""

# 3. Vérifier les composants communs
echo "🧩 3. Vérification des composants communs..."
COMP_ERRORS=0
for file in src/components/common/*.tsx; do
  filename=$(basename "$file")

  if grep -q 'className.*bg-white[^-]' "$file"; then
    if ! grep -q 'dark:bg-gray' "$file"; then
      echo "   ❌ $filename - bg-white sans variante dark"
      COMP_ERRORS=$((COMP_ERRORS + 1))
    fi
  fi
done

if [[ $COMP_ERRORS -eq 0 ]]; then
  echo "   ✅ Tous les composants ont le dark mode"
else
  echo "   ❌ $COMP_ERRORS composant(s) avec problèmes"
  ERRORS=$((ERRORS + COMP_ERRORS))
fi
echo ""

# 4. Vérifier le Layout
echo "🎨 4. Vérification du Layout..."
if grep -q 'bg-gray-50 dark:bg-gray-900' src/components/Layout.tsx; then
  echo "   ✅ Layout a un fond avec variante dark"
else
  echo "   ❌ Layout manque le fond dark"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Vérifier App.tsx
echo "⚙️  5. Vérification de App.tsx..."
if grep -q 'min-h-screen bg-gray' src/App.tsx; then
  echo "   ⚠️  App.tsx définit un fond (devrait être géré par Layout)"
else
  echo "   ✅ App.tsx ne définit pas de fond (correct)"
fi
echo ""

# Résumé
echo "================================================"
if [[ $ERRORS -eq 0 ]]; then
  echo "✅ Aucun problème détecté - Dark mode OK"
  exit 0
else
  echo "❌ $ERRORS problème(s) détecté(s)"
  echo ""
  echo "Consultez DARK_MODE.md pour les bonnes pratiques"
  exit 1
fi
