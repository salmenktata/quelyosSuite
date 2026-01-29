#!/bin/bash

# Script de démarrage global pour Quelyos ERP
# Usage: ./scripts/dev-start.sh [all|backend|backoffice|vitrine|ecommerce]

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ports
BACKEND_PORT=8069
BACKOFFICE_PORT=5175
VITRINE_PORT=3000
ECOMMERCE_PORT=3001
SUPERADMIN_PORT=5176

# Répertoire racine
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Quelyos ERP - Démarrage Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Fonction pour vérifier si un port est utilisé
check_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port ($name) déjà utilisé${NC}"
        return 1
    fi
    return 0
}

# Fonction pour attendre qu'un service soit prêt
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=${3:-30}

    echo -e "${BLUE}⏳ Attente de $name...${NC}"
    for i in $(seq 1 $max_attempts); do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $name prêt${NC}"
            return 0
        fi
        sleep 1
    done
    echo -e "${RED}❌ Timeout: $name non disponible${NC}"
    return 1
}

# Fonction pour corriger les menus Odoo (Settings et Apps invisibles)
fix_odoo_menus() {
    echo -e "${BLUE}🔧 Application des corrections de menus Odoo...${NC}"

    docker exec quelyos-db psql -U odoo -d quelyos -q <<'SQL' 2>/dev/null
-- Assurer que l'admin a les groupes nécessaires
INSERT INTO res_groups_users_rel (gid, uid)
SELECT 2, 2 WHERE NOT EXISTS (SELECT 1 FROM res_groups_users_rel WHERE gid = 2 AND uid = 2);
INSERT INTO res_groups_users_rel (gid, uid)
SELECT 7, 2 WHERE NOT EXISTS (SELECT 1 FROM res_groups_users_rel WHERE gid = 7 AND uid = 2);

-- Mettre Settings et Apps au début pour visibilité
UPDATE ir_ui_menu SET sequence = 1 WHERE id = 1 AND name->>'en_US' = 'Settings';
UPDATE ir_ui_menu SET sequence = 2 WHERE id = 15 AND name->>'en_US' = 'Apps';
SQL

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Menus Odoo corrigés${NC}"
    else
        echo -e "${YELLOW}⚠️  Correction des menus ignorée (DB peut-être vide)${NC}"
    fi
}

# Fonction pour démarrer le backend
start_backend() {
    echo -e "\n${BLUE}🚀 Démarrage Backend Odoo${NC}"

    if ! check_port $BACKEND_PORT "Backend Odoo"; then
        echo -e "${YELLOW}Le backend semble déjà démarré${NC}"
        # Appliquer les corrections même si déjà démarré
        fix_odoo_menus
        return 0
    fi

    cd "$ROOT_DIR/odoo-backend"
    docker-compose up -d
    wait_for_service "http://localhost:$BACKEND_PORT/web/health" "Odoo"

    # Appliquer les corrections de menus automatiquement
    fix_odoo_menus

    echo -e "${GREEN}✅ Backend Odoo : http://localhost:$BACKEND_PORT${NC}"
}

# Fonction pour démarrer le backoffice
start_backoffice() {
    echo -e "\n${BLUE}🚀 Démarrage Backoffice (Port $BACKOFFICE_PORT)${NC}"

    # Nettoyer le port si occupé
    if lsof -ti:$BACKOFFICE_PORT >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $BACKOFFICE_PORT occupé, nettoyage...${NC}"
        lsof -ti:$BACKOFFICE_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    cd "$ROOT_DIR/dashboard-client"
    npm run dev > /tmp/quelyos-backoffice.log 2>&1 &
    echo $! > /tmp/quelyos-backoffice.pid
    wait_for_service "http://localhost:$BACKOFFICE_PORT" "Backoffice" 15
    echo -e "${GREEN}✅ Backoffice : http://localhost:$BACKOFFICE_PORT${NC}"
}

# Fonction pour démarrer le site vitrine
start_vitrine() {
    echo -e "\n${BLUE}🚀 Démarrage Site Vitrine (Port $VITRINE_PORT)${NC}"

    # Nettoyer le port si occupé
    if lsof -ti:$VITRINE_PORT >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $VITRINE_PORT occupé, nettoyage...${NC}"
        lsof -ti:$VITRINE_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    cd "$ROOT_DIR/vitrine-quelyos"
    npm run dev > /tmp/quelyos-vitrine.log 2>&1 &
    echo $! > /tmp/quelyos-vitrine.pid
    wait_for_service "http://localhost:$VITRINE_PORT" "Site Vitrine" 15
    echo -e "${GREEN}✅ Site Vitrine : http://localhost:$VITRINE_PORT${NC}"
}

# Fonction pour démarrer la boutique e-commerce
start_ecommerce() {
    echo -e "\n${BLUE}🚀 Démarrage Boutique E-commerce (Port $ECOMMERCE_PORT)${NC}"

    # Nettoyer le port si occupé
    if lsof -ti:$ECOMMERCE_PORT >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $ECOMMERCE_PORT occupé, nettoyage...${NC}"
        lsof -ti:$ECOMMERCE_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    cd "$ROOT_DIR/vitrine-client"
    npm run dev > /tmp/quelyos-ecommerce.log 2>&1 &
    echo $! > /tmp/quelyos-ecommerce.pid
    wait_for_service "http://localhost:$ECOMMERCE_PORT" "E-commerce" 15
    echo -e "${GREEN}✅ E-commerce : http://localhost:$ECOMMERCE_PORT${NC}"
}

# Fonction pour démarrer le super admin
start_superadmin() {
    echo -e "\n${BLUE}🚀 Démarrage Super Admin Client (Port $SUPERADMIN_PORT)${NC}"

    # Nettoyer le port si occupé
    if lsof -ti:$SUPERADMIN_PORT >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $SUPERADMIN_PORT occupé, nettoyage...${NC}"
        lsof -ti:$SUPERADMIN_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    cd "$ROOT_DIR/super-admin-client"
    npm run dev > /tmp/quelyos-superadmin.log 2>&1 &
    echo $! > /tmp/quelyos-superadmin.pid
    wait_for_service "http://localhost:$SUPERADMIN_PORT" "Super Admin" 15
    echo -e "${GREEN}✅ Super Admin : http://localhost:$SUPERADMIN_PORT${NC}"
}

# Parsing des arguments
MODE="${1:-all}"

case $MODE in
    all)
        start_backend
        start_backoffice
        start_vitrine
        start_ecommerce
        start_superadmin
        ;;
    backend)
        start_backend
        ;;
    backoffice)
        start_backoffice
        ;;
    vitrine)
        start_vitrine
        ;;
    ecommerce)
        start_ecommerce
        ;;
    superadmin)
        start_superadmin
        ;;
    *)
        echo -e "${RED}Usage: $0 [all|backend|backoffice|vitrine|ecommerce|superadmin]${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Services démarrés avec succès${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📋 Services actifs :"
echo -e "  • Backend Odoo    : ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo -e "  • Backoffice      : ${GREEN}http://localhost:$BACKOFFICE_PORT${NC}"
echo -e "  • Site Vitrine    : ${GREEN}http://localhost:$VITRINE_PORT${NC}"
echo -e "  • E-commerce      : ${GREEN}http://localhost:$ECOMMERCE_PORT${NC}"
echo -e "  • Super Admin     : ${GREEN}http://localhost:$SUPERADMIN_PORT${NC}"
echo ""
echo -e "📝 Logs disponibles :"
echo -e "  • tail -f /tmp/quelyos-backoffice.log"
echo -e "  • tail -f /tmp/quelyos-vitrine.log"
echo -e "  • tail -f /tmp/quelyos-ecommerce.log"
echo -e "  • tail -f /tmp/quelyos-superadmin.log"
echo -e "  • docker-compose logs -f (Backend)"
echo ""
