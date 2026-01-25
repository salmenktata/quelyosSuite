#!/bin/bash

# Script de vérification du statut des services Quelyos ERP

SESSION_NAME="quelyos"

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour vérifier si un port est utilisé
check_port() {
    local port=$1
    lsof -ti:$port > /dev/null 2>&1
}

# Fonction pour afficher le statut d'un service
service_status() {
    local service_name=$1
    local port=$2
    local url=$3

    if check_port $port; then
        echo -e "   ${GREEN}●${NC} ${service_name} (${GREEN}actif${NC}) - ${url}"
    else
        echo -e "   ${RED}●${NC} ${service_name} (${RED}arrêté${NC}) - ${url}"
    fi
}

# Fonction pour afficher le statut Docker
docker_status() {
    local container_name=$1
    local display_name=$2

    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "^${container_name}$"; then
        local status=$(docker ps --filter "name=${container_name}" --format "{{.Status}}")
        echo -e "   ${GREEN}●${NC} ${display_name} (${GREEN}${status}${NC})"
    else
        echo -e "   ${RED}●${NC} ${display_name} (${RED}arrêté${NC})"
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📊 Quelyos ERP - Statut des services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Statut de la session tmux
echo -e "${BLUE}🖥️  Session tmux :${NC}"
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "   ${GREEN}●${NC} Session '$SESSION_NAME' (${GREEN}active${NC})"

    # Compter les fenêtres
    local window_count=$(tmux list-windows -t $SESSION_NAME 2>/dev/null | wc -l | tr -d ' ')
    echo -e "   ${BLUE}→${NC} Fenêtres actives : $window_count"
else
    echo -e "   ${RED}●${NC} Session '$SESSION_NAME' (${RED}inactive${NC})"
fi
echo ""

# Statut des conteneurs Docker
echo -e "${BLUE}🐳 Conteneurs Docker :${NC}"
if docker info &> /dev/null; then
    docker_status "quelyos-odoo" "Odoo 19"
    docker_status "quelyos-db" "PostgreSQL 15"
else
    echo -e "   ${RED}●${NC} Docker Desktop (${RED}non démarré${NC})"
fi
echo ""

# Statut des services web
echo -e "${BLUE}🌐 Services web :${NC}"
service_status "Backend Odoo    " 8069 "http://localhost:8069"
service_status "Backoffice      " 5175 "http://localhost:5175"
service_status "Frontend        " 3000 "http://localhost:3000"
echo ""

# Statut de la base de données
echo -e "${BLUE}💾 Base de données :${NC}"
service_status "PostgreSQL      " 5432 "localhost:5432"
echo ""

# Commandes utiles
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📌 Commandes utiles :${NC}"

if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "   • Se connecter à tmux : ${YELLOW}./attach.sh${NC}"
    echo -e "   • Arrêter les services : ${YELLOW}./stop.sh${NC}"
else
    echo -e "   • Démarrer les services : ${YELLOW}./dev.sh${NC}"
fi

echo ""
