#!/bin/bash

# Script d'audit : Trouver pages orphelines non référencées dans routes.tsx
# Usage: ./scripts/audit-orphan-pages.sh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔍 Audit Pages Orphelines - Fichiers non référencés"
echo "===================================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_PAGES=0
REFERENCED_PAGES=0
ORPHAN_PAGES=0

# Rapport
REPORT_FILE="$PROJECT_ROOT/audit-reports/orphan-pages-audit-$(date +%Y%m%d-%H%M%S).csv"
mkdir -p "$PROJECT_ROOT/audit-reports"

echo "File Path,Referenced in routes.tsx,Status" > "$REPORT_FILE"

echo "📋 Recherche de tous les fichiers .tsx dans src/pages/..."
echo ""

# Trouver tous les fichiers .tsx dans src/pages/
PAGES=$(find src/pages -type f -name "*.tsx" | sort)

while IFS= read -r page; do
    TOTAL_PAGES=$((TOTAL_PAGES + 1))

    # Convertir le chemin absolu en chemin relatif depuis src/
    RELATIVE_PATH=$(echo "$page" | sed 's|^src/||' | sed 's|\.tsx$||')

    # Vérifier si ce chemin est référencé dans routes.tsx
    if grep -q "import('./pages/${RELATIVE_PATH#pages/}')" src/routes.tsx || \
       grep -q "import('$RELATIVE_PATH')" src/routes.tsx; then
        REFERENCED="✅"
        STATUS="REFERENCED"
        REFERENCED_PAGES=$((REFERENCED_PAGES + 1))
        echo -e "${GREEN}✅${NC} $page"
    else
        REFERENCED="❌"
        STATUS="ORPHAN"
        ORPHAN_PAGES=$((ORPHAN_PAGES + 1))
        echo -e "${YELLOW}⚠️${NC}  $page → ${YELLOW}Non référencé dans routes.tsx${NC}"
    fi

    # Écrire dans le rapport CSV
    echo "$page,$REFERENCED,$STATUS" >> "$REPORT_FILE"

done <<< "$PAGES"

echo ""
echo "===================================================="
echo "📊 Résumé Audit Pages Orphelines"
echo "===================================================="
echo "Total pages .tsx       : $TOTAL_PAGES"
echo -e "Pages référencées      : ${GREEN}$REFERENCED_PAGES${NC}"
echo -e "Pages orphelines       : ${YELLOW}$ORPHAN_PAGES${NC}"
echo ""
echo "📄 Rapport généré : $REPORT_FILE"
echo ""

if [ $ORPHAN_PAGES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $ORPHAN_PAGES page(s) orpheline(s) détectée(s)${NC}"
    echo "   (Pages développées mais non exposées dans le routing)"
    exit 0  # Warning seulement, pas d'erreur
else
    echo -e "${GREEN}✅ Toutes les pages sont référencées dans routes.tsx${NC}"
    exit 0
fi
