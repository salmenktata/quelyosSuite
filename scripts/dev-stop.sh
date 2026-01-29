#!/bin/bash

# Script d'arrêt global pour Quelyos ERP
# Usage: ./scripts/dev-stop.sh [all|backend|backoffice|vitrine|ecommerce]

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
echo -e "${BLUE}  Quelyos ERP - Arrêt Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Fonction pour arrêter un service par port
stop_service_by_port() {
    local port=$1
    local name=$2

    echo -e "${BLUE}🛑 Arrêt $name (port $port)...${NC}"

    if lsof -ti:$port >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ $name arrêté${NC}"
    else
        echo -e "${YELLOW}⚠️  $name n'était pas démarré${NC}"
    fi
}

# Fonction pour arrêter un service par PID
stop_service_by_pid() {
    local pidfile=$1
    local name=$2

    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if ps -p $pid > /dev/null 2>&1; then
            kill -9 $pid 2>/dev/null || true
            echo -e "${GREEN}✅ $name arrêté (PID: $pid)${NC}"
        fi
        rm -f "$pidfile"
    fi
}

# Fonction pour arrêter le backend
stop_backend() {
    echo -e "\n${BLUE}🛑 Arrêt Backend Odoo${NC}"
    cd "$ROOT_DIR/odoo-backend"
    docker-compose down
    echo -e "${GREEN}✅ Backend Odoo arrêté${NC}"
}

# Fonction pour arrêter le backoffice
stop_backoffice() {
    stop_service_by_pid "/tmp/quelyos-backoffice.pid" "Backoffice"
    stop_service_by_port $BACKOFFICE_PORT "Backoffice"
    rm -f /tmp/quelyos-backoffice.log
}

# Fonction pour arrêter le site vitrine
stop_vitrine() {
    stop_service_by_pid "/tmp/quelyos-vitrine.pid" "Site Vitrine"
    stop_service_by_port $VITRINE_PORT "Site Vitrine"
    rm -f /tmp/quelyos-vitrine.log
}

# Fonction pour arrêter la boutique e-commerce
stop_ecommerce() {
    stop_service_by_pid "/tmp/quelyos-ecommerce.pid" "E-commerce"
    stop_service_by_port $ECOMMERCE_PORT "E-commerce"
    rm -f /tmp/quelyos-ecommerce.log
}

# Fonction pour arrêter le super admin
stop_superadmin() {
    stop_service_by_pid "/tmp/quelyos-superadmin.pid" "Super Admin"
    stop_service_by_port $SUPERADMIN_PORT "Super Admin"
    rm -f /tmp/quelyos-superadmin.log
}

# Parsing des arguments
MODE="${1:-all}"

case $MODE in
    all)
        stop_superadmin
        stop_ecommerce
        stop_vitrine
        stop_backoffice
        stop_backend
        ;;
    backend)
        stop_backend
        ;;
    backoffice)
        stop_backoffice
        ;;
    vitrine)
        stop_vitrine
        ;;
    ecommerce)
        stop_ecommerce
        ;;
    superadmin)
        stop_superadmin
        ;;
    *)
        echo -e "${RED}Usage: $0 [all|backend|backoffice|vitrine|ecommerce|superadmin]${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Services arrêtés avec succès${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
