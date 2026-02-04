#!/bin/bash

# Script CI/CD : Vérification cohérence dashboard (menu ↔ routes ↔ fichiers)
# Usage: ./scripts/check-dashboard-coherence.sh
# Exit 0 si OK, Exit 1 si erreurs détectées

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERROR_COUNT=0
WARNING_COUNT=0

echo "🔍 Vérification Cohérence Dashboard"
echo "====================================="
echo ""

# 1. Vérifier que tous les paths du menu ont une route dans routes.tsx
echo "📋 Vérification 1/3 : Menu → Routes"
echo ""

MENU_PATHS=$(grep -E "path: " src/config/modules.ts | grep -oE "path: '[^']+'" | sed "s/path: '//g" | sed "s/'//g" | sort -u)

ROUTES_MISSING=()

while IFS= read -r path; do
    # Vérifier si le path existe directement OU si c'est une route imbriquée (relative)
    # Ex: /finance/settings/flux → vérifier aussi path="flux" dans le contexte /finance/settings

    if grep -q "path=\"$path\"" src/routes.tsx; then
        continue
    fi

    # Vérifier routes imbriquées (ex: /finance/settings/flux)
    if [[ "$path" =~ ^(.*)/([^/]+)$ ]]; then
        parent_path="${BASH_REMATCH[1]}"
        child_path="${BASH_REMATCH[2]}"

        # Chercher si la route parent existe et contient une route enfant avec ce nom
        if grep -q "path=\"$parent_path\"" src/routes.tsx && \
           grep -A 20 "path=\"$parent_path\"" src/routes.tsx | grep -q "path=\"$child_path\""; then
            continue
        fi
    fi

    ROUTES_MISSING+=("$path")
    ERROR_COUNT=$((ERROR_COUNT + 1))
done <<< "$MENU_PATHS"

if [ ${#ROUTES_MISSING[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les paths du menu ont une route déclarée${NC}"
else
    echo -e "${RED}❌ ${#ROUTES_MISSING[@]} path(s) du menu sans route :${NC}"
    for path in "${ROUTES_MISSING[@]}"; do
        echo -e "   ${RED}→${NC} $path"
    done
fi

echo ""

# 2. Vérifier que tous les imports lazy pointent vers des fichiers existants
echo "📋 Vérification 2/3 : Imports Lazy → Fichiers"
echo ""

LAZY_IMPORTS=$(grep -E "const [A-Z][a-zA-Z0-9]+ = lazy\(\(\) => import\(" src/routes.tsx)

IMPORTS_BROKEN=()

while IFS= read -r line; do
    # Extraire le nom du composant
    COMPONENT=$(echo "$line" | grep -oE "const [A-Z][a-zA-Z0-9]+" | sed 's/const //')

    # Extraire le chemin d'import
    IMPORT_PATH=$(echo "$line" | grep -oE "import\('[^']+'\)" | sed "s/import('//g" | sed "s/')//g")

    # Construire le chemin complet du fichier
    FILE_PATH="src/${IMPORT_PATH}.tsx"

    # Vérifier si le fichier existe
    if [ ! -f "$FILE_PATH" ]; then
        IMPORTS_BROKEN+=("$COMPONENT → $FILE_PATH")
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done <<< "$LAZY_IMPORTS"

if [ ${#IMPORTS_BROKEN[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les imports lazy pointent vers des fichiers existants${NC}"
else
    echo -e "${RED}❌ ${#IMPORTS_BROKEN[@]} import(s) lazy cassé(s) :${NC}"
    for import in "${IMPORTS_BROKEN[@]}"; do
        echo -e "   ${RED}→${NC} $import"
    done
fi

echo ""

# 3. Lister pages orphelines (warning seulement)
echo "📋 Vérification 3/3 : Pages Orphelines"
echo ""

PAGES=$(find src/pages -type f -name "*.tsx" | sort)

ORPHAN_PAGES=()

while IFS= read -r page; do
    # Convertir le chemin absolu en chemin relatif depuis src/
    RELATIVE_PATH=$(echo "$page" | sed 's|^src/||' | sed 's|\.tsx$||')

    # Vérifier si ce chemin est référencé dans routes.tsx
    if ! grep -q "import('./pages/${RELATIVE_PATH#pages/}')" src/routes.tsx && \
       ! grep -q "import('$RELATIVE_PATH')" src/routes.tsx; then
        ORPHAN_PAGES+=("$page")
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
done <<< "$PAGES"

if [ ${#ORPHAN_PAGES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Toutes les pages sont référencées dans routes.tsx${NC}"
else
    echo -e "${YELLOW}⚠️  ${#ORPHAN_PAGES[@]} page(s) orpheline(s) détectée(s) :${NC}"
    for page in "${ORPHAN_PAGES[@]}"; do
        echo -e "   ${YELLOW}→${NC} $page"
    done
    echo ""
    echo -e "${YELLOW}   (Pages développées mais non exposées - peut être volontaire)${NC}"
fi

echo ""
echo "====================================="
echo "📊 Résumé"
echo "====================================="

if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune incohérence détectée${NC}"
    echo ""
    exit 0
elif [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNING_COUNT warning(s)${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERROR_COUNT erreur(s) détectée(s)${NC}"
    if [ $WARNING_COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNING_COUNT warning(s)${NC}"
    fi
    echo ""
    echo "Veuillez corriger les erreurs avant de committer."
    exit 1
fi
