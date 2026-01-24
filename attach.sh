#!/bin/bash

# Script pour se connecter à la session tmux Quelyos ERP

SESSION_NAME="quelyos"

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si la session existe
if ! tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "${RED}❌ Aucune session '$SESSION_NAME' active${NC}"
    echo -e "${YELLOW}💡 Démarrez d'abord les services avec :${NC} ${GREEN}./dev.sh${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📺 Connexion à la session tmux '$SESSION_NAME'${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}⌨️  Raccourcis tmux :${NC}"
echo -e "   • Changer de fenêtre  : ${YELLOW}Ctrl+b${NC} puis ${YELLOW}0/1/2/3${NC}"
echo -e "   • Détacher (quitter)  : ${YELLOW}Ctrl+b${NC} puis ${YELLOW}d${NC}"
echo -e "   • Scroll mode         : ${YELLOW}Ctrl+b${NC} puis ${YELLOW}[${NC} (q pour quitter)"
echo -e "   • Aide complète       : ${YELLOW}Ctrl+b${NC} puis ${YELLOW}?${NC}"
echo ""
echo -e "${YELLOW}💡 Fenêtres disponibles :${NC}"
echo -e "   ${GREEN}0${NC} : backend    (Docker Odoo)"
echo -e "   ${GREEN}1${NC} : backoffice (React + Vite)"
echo -e "   ${GREEN}2${NC} : frontend   (Next.js)"
echo -e "   ${GREEN}3${NC} : monitoring (Statut)"
echo ""
echo -e "${BLUE}Connexion dans 2 secondes...${NC}"
sleep 2

# Se connecter à la session tmux
tmux attach -t $SESSION_NAME
