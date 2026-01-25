#!/bin/bash
# Vérifie que tous les champs du modèle existent en DB

MODEL_FILE=$1
TABLE_NAME=$2

if [ -z "$MODEL_FILE" ] || [ -z "$TABLE_NAME" ]; then
    echo "Usage: $0 <model_file.py> <table_name>"
    echo ""
    echo "Example:"
    echo "  $0 addons/quelyos_api/models/stock_quant.py product_template"
    exit 1
fi

if [ ! -f "$MODEL_FILE" ]; then
    echo "❌ File not found: $MODEL_FILE"
    exit 1
fi

echo "🔍 Extracting fields from $MODEL_FILE..."
FIELDS=$(grep -E '^\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*fields\.' "$MODEL_FILE" | sed -E 's/^[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*)[[:space:]]*=.*/\1/' | sort | uniq)

if [ -z "$FIELDS" ]; then
    echo "⚠️  No fields found in $MODEL_FILE"
    exit 0
fi

echo "🔍 Checking database table '$TABLE_NAME'..."
echo ""

MISSING_COUNT=0
OK_COUNT=0

for field in $FIELDS; do
    EXISTS=$(docker exec quelyos-db psql -U odoo -d quelyos -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = '$TABLE_NAME' AND column_name = '$field';" 2>/dev/null | xargs)
    if [ -z "$EXISTS" ]; then
        echo "❌ MISSING: $field"
        ((MISSING_COUNT++))
    else
        echo "✅ OK: $field"
        ((OK_COUNT++))
    fi
done

echo ""
echo "📊 Summary:"
echo "  ✅ Existing fields: $OK_COUNT"
echo "  ❌ Missing fields: $MISSING_COUNT"

if [ $MISSING_COUNT -gt 0 ]; then
    echo ""
    echo "⚠️  $MISSING_COUNT field(s) missing in database!"
    echo "💡 Run: cd backend && ./upgrade.sh quelyos_api"
    exit 1
fi

echo ""
echo "✅ All fields exist in database!"
exit 0
