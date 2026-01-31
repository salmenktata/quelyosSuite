#!/bin/bash
# Vérification isolation Odoo - Détection violations règles
# Usage: ./scripts/check-odoo-isolation.sh

set -e

MODULES_PATH="odoo-backend/addons/quelyos_*"
EXIT_CODE=0

echo "🔍 AUDIT ISOLATION ODOO - Quelyos Modules"
echo "=========================================="
echo ""

# 1. SQL Direct (WARNING)
echo "1️⃣  SQL Direct (.cr.execute) - WARNING"
SQL_COUNT=$(grep -r "\.cr\.execute" ${MODULES_PATH}/models/*.py 2>/dev/null | wc -l | tr -d ' ')
if [ "$SQL_COUNT" -gt 0 ]; then
    echo "   ⚠️  $SQL_COUNT occurrences trouvées"
    echo "   Fichiers concernés:"
    grep -l "\.cr\.execute" ${MODULES_PATH}/models/*.py 2>/dev/null | sed 's/^/      - /'
    echo "   Recommandation: Utiliser ORM Odoo si possible"
else
    echo "   ✅ Aucune utilisation SQL direct"
fi
echo ""

# 2. Overrides CRUD sans super() (CRITIQUE)
echo "2️⃣  Overrides CRUD sans super() - CRITIQUE"
CRITICAL_FILES=()
for file in $(find ${MODULES_PATH}/models -name "*.py" -type f 2>/dev/null); do
    # Vérifier si c'est un héritage (pas _name)
    if grep -q "_inherit = " "$file" 2>/dev/null; then
        # Vérifier s'il y a des overrides CRUD
        if grep -qE "def (write|create|unlink)\(" "$file" 2>/dev/null; then
            # Vérifier si super() est appelé
            if ! grep -q "super(" "$file" 2>/dev/null; then
                CRITICAL_FILES+=("$file")
            fi
        fi
    fi
done

if [ ${#CRITICAL_FILES[@]} -gt 0 ]; then
    echo "   ❌ ${#CRITICAL_FILES[@]} fichiers CRITIQUES sans super()"
    for f in "${CRITICAL_FILES[@]}"; do
        echo "      - $f"
    done
    EXIT_CODE=1
else
    echo "   ✅ Tous les overrides CRUD appellent super()"
fi
echo ""

# 3. Champs sans préfixe (MOYEN)
echo "3️⃣  Champs sans préfixe dans héritages - MOYEN"
NO_PREFIX_COUNT=0
for file in ${MODULES_PATH}/models/*.py; do
    if grep -q "_inherit = " "$file" 2>/dev/null; then
        fields=$(grep -E "^\s+[a-z_]+\s*=\s*fields\." "$file" 2>/dev/null | \
                 grep -v "x_\|tenant_id\|quelyos_\|_compute\|_inverse\|_search" | \
                 wc -l | tr -d ' ')
        if [ "$fields" -gt 0 ]; then
            NO_PREFIX_COUNT=$((NO_PREFIX_COUNT + fields))
        fi
    fi
done

if [ "$NO_PREFIX_COUNT" -gt 0 ]; then
    echo "   ⚠️  $NO_PREFIX_COUNT champs sans préfixe x_"
    echo "   Risque: Collision avec futurs champs Odoo"
    echo "   Recommandation: Renommer → x_nom_champ"
else
    echo "   ✅ Tous les champs ont un préfixe"
fi
echo ""

# 4. Dépendances OCA (INFO)
echo "4️⃣  Dépendances OCA - INFO"
OCA_DEPS=$(grep -rh "# OCA\|'stock_inventory'\|'stock_warehouse_calendar'" ${MODULES_PATH}/__manifest__.py 2>/dev/null | wc -l | tr -d ' ')
if [ "$OCA_DEPS" -gt 0 ]; then
    echo "   ℹ️  Dépendances OCA détectées"
    grep -rh "'stock_inventory'\|'stock_warehouse_calendar'\|'stock_inventory_lockdown'" ${MODULES_PATH}/__manifest__.py 2>/dev/null | \
        sed "s/^/      /" || true
    echo "   Roadmap: Migration vers quelyos_stock_advanced"
else
    echo "   ✅ Aucune dépendance OCA"
fi
echo ""

# 5. auto_install=True (INTERDIT sauf orchestrateur)
echo "5️⃣  auto_install=True hors orchestrateur - INTERDIT"
AUTO_INSTALL=$(grep -l "auto_install.*True" ${MODULES_PATH}/__manifest__.py 2>/dev/null | grep -v "quelyos_core" || true)
if [ -n "$AUTO_INSTALL" ]; then
    echo "   ❌ auto_install=True détecté dans:"
    echo "$AUTO_INSTALL" | sed 's/^/      - /'
    EXIT_CODE=1
else
    echo "   ✅ Pas de auto_install=True hors orchestrateur"
fi
echo ""

# Résumé
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ AUDIT PASSÉ - Isolation Odoo respectée"
else
    echo "❌ AUDIT ÉCHOUÉ - Violations critiques détectées"
fi
echo ""

exit $EXIT_CODE
