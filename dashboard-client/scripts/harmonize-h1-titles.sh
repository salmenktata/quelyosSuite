#!/bin/bash

# ======================================================================
# Script : Harmonisation Titres H1 - Store & Finance
# ======================================================================
# Objectif : Standardiser tous les h1 sur text-3xl font-bold
# Justification : Meilleure hiérarchie visuelle (30px vs 24px)
# Cible : ~81 fichiers (47 Finance + 34 Store)
# ======================================================================

set -e  # Exit on error

# Couleurs pour logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
FINANCE_COUNT=0
STORE_COUNT=0
TOTAL_FILES=0

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}🎨 Harmonisation Titres H1 : text-2xl → text-3xl${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Fonction de backup
backup_files() {
    echo -e "${YELLOW}📦 Création backup...${NC}"
    BACKUP_DIR="./backups/h1-harmonization-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup Finance
    if [ -d "src/pages/finance" ]; then
        cp -R src/pages/finance "$BACKUP_DIR/finance"
        echo -e "  ✅ Backup Finance → $BACKUP_DIR/finance"
    fi

    # Backup Store
    if [ -d "src/pages/store" ]; then
        cp -R src/pages/store "$BACKUP_DIR/store"
        echo -e "  ✅ Backup Store → $BACKUP_DIR/store"
    fi

    echo ""
}

# Fonction de remplacement
harmonize_h1() {
    local module=$1
    local path=$2

    echo -e "${BLUE}🔄 Harmonisation module ${module}...${NC}"

    # Pattern 1 : text-2xl font-bold text-gray-900 dark:text-white
    # Pattern 2 : text-xl sm:text-2xl → text-2xl sm:text-3xl

    # Comptage avant modification
    local before_count=$(grep -r "text-2xl font-bold text-gray-900 dark:text-white" "$path" 2>/dev/null | wc -l | tr -d ' ')
    local responsive_count=$(grep -r "text-xl sm:text-2xl font-bold" "$path" 2>/dev/null | wc -l | tr -d ' ')

    echo -e "  📊 Avant : ${before_count} occurrences text-2xl, ${responsive_count} occurrences responsive"

    # Remplacement Pattern 1 : text-2xl → text-3xl (h1 uniquement)
    find "$path" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
        's/<h1 className="text-2xl font-bold text-gray-900 dark:text-white"/<h1 className="text-3xl font-bold text-gray-900 dark:text-white"/g' {} \;

    # Remplacement Pattern 2 : responsive text-xl sm:text-2xl → text-2xl sm:text-3xl
    find "$path" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
        's/<h1 className="text-xl sm:text-2xl font-bold/<h1 className="text-2xl sm:text-3xl font-bold/g' {} \;

    # Comptage après modification
    local after_count=$(grep -r "text-3xl font-bold text-gray-900 dark:text-white" "$path" 2>/dev/null | wc -l | tr -d ' ')
    local responsive_after=$(grep -r "text-2xl sm:text-3xl font-bold" "$path" 2>/dev/null | wc -l | tr -d ' ')

    echo -e "  📊 Après : ${after_count} occurrences text-3xl, ${responsive_after} occurrences responsive"

    # Calcul delta
    local delta=$((after_count - before_count))
    echo -e "  ${GREEN}✅ ${delta} titres harmonisés${NC}"
    echo ""

    # Retourner le nombre de fichiers modifiés
    if [ "$module" = "Finance" ]; then
        FINANCE_COUNT=$delta
    else
        STORE_COUNT=$delta
    fi
}

# Vérification préalable
check_patterns() {
    echo -e "${YELLOW}🔍 Analyse préalable des patterns...${NC}"
    echo ""

    # Finance
    local finance_h1=$(grep -r "<h1.*text-2xl" src/pages/finance 2>/dev/null | wc -l | tr -d ' ')
    local finance_h1_3xl=$(grep -r "<h1.*text-3xl" src/pages/finance 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  📁 Finance : ${finance_h1} h1 en text-2xl, ${finance_h1_3xl} h1 en text-3xl"

    # Store
    local store_h1=$(grep -r "<h1.*text-2xl" src/pages/store 2>/dev/null | wc -l | tr -d ' ')
    local store_h1_3xl=$(grep -r "<h1.*text-3xl" src/pages/store 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  📁 Store : ${store_h1} h1 en text-2xl, ${store_h1_3xl} h1 en text-3xl"

    echo ""
    echo -e "  ${YELLOW}⚠️  Cible : 100% des h1 en text-3xl${NC}"
    echo ""
}

# Validation post-modification
validate_changes() {
    echo -e "${BLUE}✅ Validation des modifications...${NC}"
    echo ""

    # Vérifier qu'il ne reste plus de text-2xl sur h1
    local remaining_finance=$(grep -r "<h1.*text-2xl" src/pages/finance 2>/dev/null | wc -l | tr -d ' ')
    local remaining_store=$(grep -r "<h1.*text-2xl" src/pages/store 2>/dev/null | wc -l | tr -d ' ')

    if [ "$remaining_finance" -eq 0 ] && [ "$remaining_store" -eq 0 ]; then
        echo -e "  ${GREEN}✅ Succès : Aucun h1 text-2xl restant${NC}"
    else
        echo -e "  ${RED}❌ Attention : ${remaining_finance} h1 text-2xl restants dans Finance${NC}"
        echo -e "  ${RED}❌ Attention : ${remaining_store} h1 text-2xl restants dans Store${NC}"
        echo ""
        echo -e "  ${YELLOW}Fichiers concernés :${NC}"
        grep -r "<h1.*text-2xl" src/pages/finance src/pages/store 2>/dev/null | head -n 10
    fi

    echo ""
}

# Liste des fichiers modifiés
list_modified_files() {
    echo -e "${BLUE}📝 Fichiers modifiés :${NC}"
    echo ""

    # Utiliser git pour voir les fichiers modifiés
    if git status --short src/pages/finance src/pages/store 2>/dev/null | grep -q "M"; then
        git status --short src/pages/finance src/pages/store | grep "M" | while read -r status file; do
            echo -e "  ${GREEN}M${NC} $file"
        done
    else
        echo -e "  ${YELLOW}Aucune modification détectée${NC}"
    fi

    echo ""
}

# Main execution
main() {
    # Vérifier qu'on est dans le bon répertoire
    if [ ! -d "src/pages/finance" ] || [ ! -d "src/pages/store" ]; then
        echo -e "${RED}❌ Erreur : Ce script doit être exécuté depuis dashboard-client/${NC}"
        exit 1
    fi

    # Étape 1 : Analyse préalable
    check_patterns

    # Étape 2 : Confirmation utilisateur
    read -p "🚀 Continuer avec l'harmonisation ? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠️  Opération annulée${NC}"
        exit 0
    fi
    echo ""

    # Étape 3 : Backup
    backup_files

    # Étape 4 : Harmonisation Finance
    harmonize_h1 "Finance" "src/pages/finance"

    # Étape 5 : Harmonisation Store
    harmonize_h1 "Store" "src/pages/store"

    # Étape 6 : Validation
    validate_changes

    # Étape 7 : Liste des fichiers modifiés
    list_modified_files

    # Résumé final
    TOTAL_FILES=$((FINANCE_COUNT + STORE_COUNT))
    echo -e "${BLUE}======================================================================${NC}"
    echo -e "${GREEN}✅ Harmonisation terminée avec succès !${NC}"
    echo -e "${BLUE}======================================================================${NC}"
    echo ""
    echo -e "  📊 Finance : ${FINANCE_COUNT} titres harmonisés"
    echo -e "  📊 Store : ${STORE_COUNT} titres harmonisés"
    echo -e "  📊 Total : ${TOTAL_FILES} titres harmonisés"
    echo ""
    echo -e "${YELLOW}📋 Prochaines étapes :${NC}"
    echo -e "  1. Vérifier visuellement les pages modifiées"
    echo -e "  2. Tester light mode ET dark mode"
    echo -e "  3. Vérifier responsive (mobile/tablet/desktop)"
    echo -e "  4. Lancer : npm run dev --filter=dashboard-client"
    echo -e "  5. Si OK : git add . && git commit -m 'style: harmonize h1 titles to text-3xl'"
    echo ""
}

# Exécution
main
