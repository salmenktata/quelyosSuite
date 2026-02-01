#!/bin/bash

# Script de correction automatique des erreurs ESLint
# Quelyos Dashboard Client - Corrections TypeScript strict

set -e  # Arrêt si erreur

echo "🔧 Démarrage des corrections ESLint automatiques..."
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
CHANGES=0

# ============================================================================
# 1. Supprimer tous les "as any" casts
# ============================================================================
echo "📝 Étape 1/5 : Suppression des casts 'as any'..."

# Trouver tous les fichiers avec "as any"
FILES_WITH_ANY=$(grep -rl " as any" src/ 2>/dev/null || true)

if [ -n "$FILES_WITH_ANY" ]; then
  echo "$FILES_WITH_ANY" | while read -r file; do
    # Supprimer " as any" (avec espace avant)
    sed -i '' 's/ as any//g' "$file"
    echo "  ✓ $file"
    ((CHANGES++)) || true
  done
  echo "${GREEN}✓ ${CHANGES} fichiers corrigés${NC}"
else
  echo "  Aucun 'as any' trouvé"
fi

echo ""

# ============================================================================
# 2. Corriger useState([]) en useState<Type[]>([])
# ============================================================================
echo "📝 Étape 2/5 : Correction des useState non typés..."

# Cette correction est plus complexe et nécessite une approche manuelle
# On va juste signaler les fichiers concernés
echo "  ⚠️  Nécessite correction manuelle pour typage précis"
echo "  Fichiers à vérifier :"
grep -rn "useState(\[\])" src/ 2>/dev/null | head -5 || echo "  Aucun trouvé"

echo ""

# ============================================================================
# 3. Auto-fix ESLint (imports non utilisés, formatage)
# ============================================================================
echo "📝 Étape 3/5 : Auto-fix ESLint..."

pnpm lint --fix 2>&1 | tail -20

echo ""

# ============================================================================
# 4. Vérification finale
# ============================================================================
echo "📝 Étape 4/5 : Vérification finale..."

# Compter les warnings restants
WARNINGS=$(pnpm lint 2>&1 | grep -o "[0-9]* warnings" | grep -o "[0-9]*" || echo "0")

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Warnings restants : ${WARNINGS}"
echo "════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# 5. Proposition de commit
# ============================================================================
echo "📝 Étape 5/5 : Préparation du commit..."

# Vérifier s'il y a des changements
if git diff --quiet; then
  echo "${YELLOW}⚠️  Aucun changement à committer${NC}"
else
  echo ""
  echo "Changements détectés :"
  git diff --stat
  echo ""

  read -p "Voulez-vous committer ces changements ? (o/N) " -n 1 -r
  echo ""

  if [[ $REPLY =~ ^[Oo]$ ]]; then
    git add src/
    git commit -m "fix(lint): corrections automatiques ESLint

- Suppression des casts 'as any'
- Auto-fix imports non utilisés
- Formatage automatique

Warnings: avant inconnu → après ${WARNINGS}"

    echo "${GREEN}✓ Commit créé avec succès${NC}"
  else
    echo "${YELLOW}⚠️  Commit annulé${NC}"
  fi
fi

echo ""
echo "${GREEN}✅ Script terminé${NC}"
echo ""
echo "Pour corriger les warnings restants manuellement :"
echo "  1. Types any → unknown : rechercher 'any' dans les fichiers"
echo "  2. Deps hooks : wrapper les fonctions dans useCallback"
echo "  3. Lancer : pnpm lint pour voir les erreurs détaillées"
