#!/bin/bash

# Script d'audit : Vérifier cohérence menu → routes → fichiers
# Usage: ./scripts/audit-menu-routes.sh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔍 Audit Navigation Dashboard - Menu → Routes → Fichiers"
echo "========================================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_PATHS=0
ROUTES_OK=0
ROUTES_MISSING=0
FILES_OK=0
FILES_MISSING=0

# Rapport CSV
REPORT_FILE="$PROJECT_ROOT/audit-reports/menu-routes-audit-$(date +%Y%m%d-%H%M%S).csv"
mkdir -p "$PROJECT_ROOT/audit-reports"

echo "Path,Has Route,File Exists,Status" > "$REPORT_FILE"

# Extraire tous les paths du menu (modules.ts)
echo "📋 Extraction des paths depuis config/modules.ts..."
MENU_PATHS=$(grep -E "path: " src/config/modules.ts | grep -oE "path: '[^']+'" | sed "s/path: '//g" | sed "s/'//g" | sort -u)

TOTAL_PATHS_MENU=$(echo "$MENU_PATHS" | wc -l | tr -d ' ')
echo "✅ ${TOTAL_PATHS_MENU} paths trouvés dans le menu"
echo ""

echo "🔎 Vérification de chaque path..."
echo ""

while IFS= read -r path; do
    TOTAL_PATHS=$((TOTAL_PATHS + 1))

    # Vérifier si le path a une route dans routes.tsx
    if grep -q "path=\"$path\"" src/routes.tsx; then
        HAS_ROUTE="✅"
        ROUTES_OK=$((ROUTES_OK + 1))

        # Extraire le composant associé (recherche lazy import)
        COMPONENT=$(grep -A 5 "path=\"$path\"" src/routes.tsx | grep -oE "element=\{<[^>]+><[^>]+>(<[^>]+>)?<([A-Z][a-zA-Z0-9]*)" | sed 's/.*<\([A-Z][a-zA-Z0-9]*\)$/\1/' | head -1)

        # Chercher l'import lazy correspondant
        if [ -n "$COMPONENT" ]; then
            IMPORT_LINE=$(grep -E "const $COMPONENT = lazy\(\(\) => import\(" src/routes.tsx || echo "")

            if [ -n "$IMPORT_LINE" ]; then
                # Extraire le chemin du fichier
                FILE_PATH=$(echo "$IMPORT_LINE" | grep -oE "import\('[^']+'\)" | sed "s/import('//g" | sed "s/')//g")
                FILE_PATH="src/${FILE_PATH}.tsx"

                # Vérifier si le fichier existe
                if [ -f "$FILE_PATH" ]; then
                    FILE_EXISTS="✅"
                    FILES_OK=$((FILES_OK + 1))
                    STATUS="OK"
                    echo -e "${GREEN}✅${NC} $path → Route OK → Fichier OK ($FILE_PATH)"
                else
                    FILE_EXISTS="❌"
                    FILES_MISSING=$((FILES_MISSING + 1))
                    STATUS="FILE_MISSING"
                    echo -e "${RED}❌${NC} $path → Route OK → ${RED}Fichier manquant${NC} ($FILE_PATH)"
                fi
            else
                FILE_EXISTS="⚠️"
                STATUS="NO_LAZY_IMPORT"
                echo -e "${YELLOW}⚠️${NC} $path → Route OK → ${YELLOW}Pas d'import lazy détecté${NC}"
            fi
        else
            FILE_EXISTS="⚠️"
            STATUS="NO_COMPONENT"
            echo -e "${YELLOW}⚠️${NC} $path → Route OK → ${YELLOW}Composant non détecté${NC}"
        fi
    else
        HAS_ROUTE="❌"
        FILE_EXISTS="N/A"
        STATUS="ROUTE_MISSING"
        ROUTES_MISSING=$((ROUTES_MISSING + 1))
        echo -e "${RED}❌${NC} $path → ${RED}Route manquante${NC}"
    fi

    # Écrire dans le rapport CSV
    echo "$path,$HAS_ROUTE,$FILE_EXISTS,$STATUS" >> "$REPORT_FILE"

done <<< "$MENU_PATHS"

echo ""
echo "========================================================"
echo "📊 Résumé Audit"
echo "========================================================"
echo "Total paths menu       : $TOTAL_PATHS"
echo -e "Routes OK              : ${GREEN}$ROUTES_OK${NC}"
echo -e "Routes manquantes      : ${RED}$ROUTES_MISSING${NC}"
echo -e "Fichiers OK            : ${GREEN}$FILES_OK${NC}"
echo -e "Fichiers manquants     : ${RED}$FILES_MISSING${NC}"
echo ""
echo "📄 Rapport généré : $REPORT_FILE"
echo ""

if [ $ROUTES_MISSING -gt 0 ] || [ $FILES_MISSING -gt 0 ]; then
    echo -e "${RED}❌ Incohérences détectées${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Aucune incohérence détectée${NC}"
    exit 0
fi
