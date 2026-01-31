#!/bin/bash
# Génère rapport détaillé champs à migrer par modèle
# Usage: ./scripts/generate-migration-report.sh

MODULES_PATH="odoo-backend/addons/quelyos_*"
OUTPUT_FILE=".claude/MIGRATION_FIELDS_INVENTORY.txt"

echo "📋 Inventaire Champs à Migrer - $(date '+%Y-%m-%d %H:%M')" > "$OUTPUT_FILE"
echo "=========================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

TOTAL_FIELDS=0
TOTAL_MODELS=0

for file in ${MODULES_PATH}/models/*.py; do
    # Vérifier si c'est un héritage
    if grep -q "_inherit = " "$file" 2>/dev/null; then
        model=$(grep "_inherit = " "$file" | head -1 | cut -d "'" -f 2)
        
        # Lister champs sans préfixe
        fields=$(grep -E "^\s+[a-z_]+\s*=\s*fields\." "$file" 2>/dev/null | \
                 grep -v "x_\|tenant_id\|quelyos_\|_compute\|_inverse\|_search\|_constraint" | \
                 sed 's/^\s*//' | cut -d '=' -f 1 | tr -d ' ')
        
        if [ -n "$fields" ]; then
            count=$(echo "$fields" | wc -l | tr -d ' ')
            TOTAL_FIELDS=$((TOTAL_FIELDS + count))
            TOTAL_MODELS=$((TOTAL_MODELS + 1))
            
            echo "Modèle: $model" >> "$OUTPUT_FILE"
            echo "Fichier: $file" >> "$OUTPUT_FILE"
            echo "Champs ($count):" >> "$OUTPUT_FILE"
            echo "$fields" | while read field; do
                echo "  - $field → x_$field" >> "$OUTPUT_FILE"
            done
            echo "" >> "$OUTPUT_FILE"
        fi
    fi
done

echo "=========================================================" >> "$OUTPUT_FILE"
echo "TOTAL: $TOTAL_FIELDS champs dans $TOTAL_MODELS modèles" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

cat "$OUTPUT_FILE"
echo ""
echo "✅ Rapport sauvegardé: $OUTPUT_FILE"
