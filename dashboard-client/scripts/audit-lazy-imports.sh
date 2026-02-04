#!/bin/bash

# Script d'audit : Détecter imports lazy cassés dans routes.tsx
# Usage: ./scripts/audit-lazy-imports.sh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔍 Audit Lazy Imports - Détection fichiers manquants"
echo "===================================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_IMPORTS=0
IMPORTS_OK=0
IMPORTS_BROKEN=0

# Rapport
REPORT_FILE="$PROJECT_ROOT/audit-reports/lazy-imports-audit-$(date +%Y%m%d-%H%M%S).csv"
mkdir -p "$PROJECT_ROOT/audit-reports"

echo "Component,Import Path,File Exists,Status" > "$REPORT_FILE"

echo "📋 Extraction des imports lazy depuis routes.tsx..."
echo ""

# Extraire tous les imports lazy
LAZY_IMPORTS=$(grep -E "const [A-Z][a-zA-Z0-9]+ = lazy\(\(\) => import\(" src/routes.tsx)

while IFS= read -r line; do
    TOTAL_IMPORTS=$((TOTAL_IMPORTS + 1))

    # Extraire le nom du composant
    COMPONENT=$(echo "$line" | grep -oE "const [A-Z][a-zA-Z0-9]+" | sed 's/const //')

    # Extraire le chemin d'import
    IMPORT_PATH=$(echo "$line" | grep -oE "import\('[^']+'\)" | sed "s/import('//g" | sed "s/')//g")

    # Construire le chemin complet du fichier
    FILE_PATH="src/${IMPORT_PATH}.tsx"

    # Vérifier si le fichier existe
    if [ -f "$FILE_PATH" ]; then
        FILE_EXISTS="✅"
        STATUS="OK"
        IMPORTS_OK=$((IMPORTS_OK + 1))
        echo -e "${GREEN}✅${NC} $COMPONENT → $FILE_PATH"
    else
        FILE_EXISTS="❌"
        STATUS="BROKEN"
        IMPORTS_BROKEN=$((IMPORTS_BROKEN + 1))
        echo -e "${RED}❌${NC} $COMPONENT → ${RED}Fichier manquant${NC} ($FILE_PATH)"
    fi

    # Écrire dans le rapport CSV
    echo "$COMPONENT,$IMPORT_PATH,$FILE_EXISTS,$STATUS" >> "$REPORT_FILE"

done <<< "$LAZY_IMPORTS"

echo ""
echo "===================================================="
echo "📊 Résumé Audit Lazy Imports"
echo "===================================================="
echo "Total imports lazy     : $TOTAL_IMPORTS"
echo -e "Imports OK             : ${GREEN}$IMPORTS_OK${NC}"
echo -e "Imports cassés         : ${RED}$IMPORTS_BROKEN${NC}"
echo ""
echo "📄 Rapport généré : $REPORT_FILE"
echo ""

if [ $IMPORTS_BROKEN -gt 0 ]; then
    echo -e "${RED}❌ $IMPORTS_BROKEN import(s) cassé(s) détecté(s)${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tous les imports lazy pointent vers des fichiers existants${NC}"
    exit 0
fi
