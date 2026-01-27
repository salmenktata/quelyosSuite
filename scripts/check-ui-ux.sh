#!/bin/bash
# Script de vérification UI/UX - Analyse complète du projet
# Usage: ./scripts/check-ui-ux.sh [path]

set -e

TARGET_PATH="${1:-dashboard-client/src}"
ERRORS=0
WARNINGS=0
FILES_CHECKED=0

echo "🔍 Analyse UI/UX complète du projet"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trouver tous les fichiers TSX/JSX
FILES=$(find "$TARGET_PATH" -type f \( -name "*.tsx" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.next/*")

for file in $FILES; do
  FILES_CHECKED=$((FILES_CHECKED + 1))
  FILE_ERRORS=0
  FILE_WARNINGS=0

  # Vérification 1 : bg-white sans dark:bg-
  if grep -q "className.*bg-white[^/-]" "$file"; then
    if ! grep -q "dark:bg-" "$file"; then
      echo "❌ $file"
      echo "   bg-white sans variante dark:bg-gray-800"
      ERRORS=$((ERRORS + 1))
      FILE_ERRORS=$((FILE_ERRORS + 1))
    fi
  fi

  # Vérification 2 : text-gray-900 sans dark:text-white
  if grep -q "text-gray-900" "$file"; then
    if ! grep -q "dark:text-white" "$file"; then
      echo "❌ $file"
      echo "   text-gray-900 sans dark:text-white"
      ERRORS=$((ERRORS + 1))
      FILE_ERRORS=$((FILE_ERRORS + 1))
    fi
  fi

  # Vérification 3 : border-gray-200 sans dark:border-gray-700
  if grep -q "border-gray-200" "$file"; then
    if ! grep -q "dark:border-gray-700" "$file"; then
      echo "⚠️  $file"
      echo "   border-gray-200 sans dark:border-gray-700"
      WARNINGS=$((WARNINGS + 1))
      FILE_WARNINGS=$((FILE_WARNINGS + 1))
    fi
  fi

  # Vérification 4 : Labels avec text-gray-700
  if grep -q "<label" "$file"; then
    if grep -q "text-gray-700[^-]" "$file"; then
      echo "❌ $file"
      echo "   Label avec text-gray-700 (utiliser text-gray-900 dark:text-white)"
      ERRORS=$((ERRORS + 1))
      FILE_ERRORS=$((FILE_ERRORS + 1))
    fi
  fi

  # Vérification 5 : Inputs sans variantes dark
  if grep -q "<input\|<select\|<textarea" "$file"; then
    if grep -q "bg-white" "$file" && ! grep -q "dark:bg-gray\|dark:bg-white/10" "$file"; then
      echo "⚠️  $file"
      echo "   Input/Select sans dark:bg-"
      WARNINGS=$((WARNINGS + 1))
      FILE_WARNINGS=$((FILE_WARNINGS + 1))
    fi
  fi

  # Vérification 6 : text-white isolé
  if grep -q 'className="[^"]*text-white[^"]*"' "$file"; then
    if ! grep -q "text-gray-.*dark:text-white\|dark:text-white.*text-gray" "$file"; then
      echo "⚠️  $file"
      echo "   text-white sans contrepartie light mode"
      WARNINGS=$((WARNINGS + 1))
      FILE_WARNINGS=$((FILE_WARNINGS + 1))
    fi
  fi

  # Vérification 7 : Composants GlassPanel/GlassCard sans padding
  if grep -q "GlassPanel\|GlassCard" "$file"; then
    CONTEXT=$(grep -A 2 "GlassPanel\|GlassCard" "$file")
    if ! echo "$CONTEXT" | grep -q "className.*p-[0-9]"; then
      echo "⚠️  $file"
      echo "   GlassPanel/GlassCard sans padding"
      WARNINGS=$((WARNINGS + 1))
      FILE_WARNINGS=$((FILE_WARNINGS + 1))
    fi
  fi

  # Afficher résumé si problèmes dans ce fichier
  if [ $FILE_ERRORS -gt 0 ] || [ $FILE_WARNINGS -gt 0 ]; then
    echo ""
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résumé"
echo ""
echo "Fichiers analysés : $FILES_CHECKED"
echo "Erreurs critiques : $ERRORS"
echo "Warnings : $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ Aucun problème détecté - Bravo !"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Warnings détectés - Corrections recommandées"
  exit 0
else
  echo "❌ Erreurs critiques détectées - Corrections requises"
  echo ""
  echo "🔧 Actions :"
  echo "   1. Corriger les erreurs listées ci-dessus"
  echo "   2. Ajouter variantes dark: manquantes"
  echo "   3. Lancer /uiux pour audit détaillé"
  exit 1
fi
