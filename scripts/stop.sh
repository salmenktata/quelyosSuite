#!/bin/bash

# Script d'arrêt global pour Quelyos ERP
# Arrête tous les processus de développement

set -e

SESSION_NAME="quelyos"

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🛑 Quelyos ERP - Arrêt des services de développement${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier si la session tmux existe
if ! tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Aucune session '$SESSION_NAME' active${NC}"
    echo ""

    # Vérifier et arrêter Docker si nécessaire
    if docker ps --filter "name=quelyos" --format "{{.Names}}" 2>/dev/null | grep -q "quelyos"; then
        echo -e "${BLUE}[Docker]${NC} Arrêt des conteneurs Odoo..."
        cd backend && docker-compose down
        echo -e "${GREEN}✓${NC} Conteneurs Docker arrêtés"
    else
        echo -e "${YELLOW}💡 Aucun conteneur Docker 'quelyos' en cours d'exécution${NC}"
    fi

    exit 0
fi

echo -e "${BLUE}[1/2]${NC} Arrêt de la session tmux '$SESSION_NAME'..."

# Envoyer Ctrl+C à toutes les fenêtres pour arrêter les processus proprement
tmux send-keys -t $SESSION_NAME:backend C-c 2>/dev/null || true
tmux send-keys -t $SESSION_NAME:backoffice C-c 2>/dev/null || true
tmux send-keys -t $SESSION_NAME:frontend C-c 2>/dev/null || true
tmux send-keys -t $SESSION_NAME:monitoring C-c 2>/dev/null || true

# Attendre un peu pour laisser les processus se terminer proprement
sleep 2

# Tuer la session tmux
tmux kill-session -t $SESSION_NAME 2>/dev/null || true

echo -e "${GREEN}✓${NC} Session tmux arrêtée"
echo ""

# Arrêter Docker
echo -e "${BLUE}[2/2]${NC} Arrêt des conteneurs Docker..."
if docker ps --filter "name=quelyos" --format "{{.Names}}" 2>/dev/null | grep -q "quelyos"; then
    cd backend && docker-compose down
    echo -e "${GREEN}✓${NC} Conteneurs Docker arrêtés"
else
    echo -e "${YELLOW}💡 Aucun conteneur Docker 'quelyos' en cours d'exécution${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ Tous les services ont été arrêtés${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}💡 Pour redémarrer :${NC} ${YELLOW}./dev.sh${NC}"
echo ""
