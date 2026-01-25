#!/bin/bash

# Script de démarrage global pour Quelyos ERP
# Utilise tmux pour gérer tous les processus de développement

set -e

SESSION_NAME="quelyos"

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🚀 Quelyos ERP - Démarrage des services de développement${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier si tmux est installé
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}❌ tmux n'est pas installé${NC}"
    echo -e "${YELLOW}📦 Installation via Homebrew...${NC}"
    brew install tmux
fi

# Vérifier si Docker est en cours d'exécution
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas en cours d'exécution${NC}"
    echo -e "${YELLOW}💡 Veuillez démarrer Docker Desktop et réessayer${NC}"
    exit 1
fi

# Vérifier si la session tmux existe déjà
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Une session '$SESSION_NAME' existe déjà${NC}"
    echo -e "${YELLOW}💡 Utilisez './stop.sh' pour arrêter les services ou './attach.sh' pour vous y connecter${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Création de la session tmux '$SESSION_NAME'..."
echo ""

# Créer une nouvelle session tmux détachée
tmux new-session -d -s $SESSION_NAME -n backend

# Fenêtre 1: Backend (Docker)
echo -e "${BLUE}[1/3]${NC} Démarrage du backend Odoo (Docker)..."
tmux send-keys -t $SESSION_NAME:backend "cd backend && docker-compose up" C-m

# Fenêtre 2: Backoffice
echo -e "${BLUE}[2/3]${NC} Démarrage du backoffice (React + Vite)..."
tmux new-window -t $SESSION_NAME -n backoffice
tmux send-keys -t $SESSION_NAME:backoffice "cd backoffice && npm run dev" C-m

# Fenêtre 3: Frontend
echo -e "${BLUE}[3/3]${NC} Démarrage du frontend (Next.js)..."
tmux new-window -t $SESSION_NAME -n frontend
tmux send-keys -t $SESSION_NAME:frontend "cd frontend && npm run dev" C-m

# Fenêtre 4: Monitoring (optionnel)
tmux new-window -t $SESSION_NAME -n monitoring
tmux send-keys -t $SESSION_NAME:monitoring "echo -e '${BLUE}=== Quelyos ERP - Monitoring ===${NC}'" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo ''" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo 'Services démarrés :'" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo '  • Backend Odoo     : http://localhost:8069'" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo '  • Backoffice       : http://localhost:5175'" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo '  • Frontend         : http://localhost:3000'" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo ''" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo 'Commandes tmux utiles :'" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo '  • Changer de fenêtre : Ctrl+b puis 0/1/2/3'" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo '  • Détacher session   : Ctrl+b puis d'" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo '  • Arrêter tout       : ./stop.sh'" C-m
tmux send-keys -t $SESSION_NAME:monitoring "echo ''" C-m
tmux send-keys -t $SESSION_NAME:monitoring "watch -n 5 ./status.sh" C-m

# Sélectionner la fenêtre monitoring par défaut
tmux select-window -t $SESSION_NAME:monitoring

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ Services démarrés avec succès !${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 URLs des services :${NC}"
echo -e "   • Backend Odoo     : ${GREEN}http://localhost:8069${NC}"
echo -e "   • Backoffice       : ${GREEN}http://localhost:5175${NC}"
echo -e "   • Frontend         : ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}📺 Gérer la session tmux :${NC}"
echo -e "   • Se connecter     : ${YELLOW}./attach.sh${NC} ou ${YELLOW}tmux attach -t quelyos${NC}"
echo -e "   • Voir le statut   : ${YELLOW}./status.sh${NC}"
echo -e "   • Arrêter tout     : ${YELLOW}./stop.sh${NC}"
echo ""
echo -e "${BLUE}⌨️  Raccourcis tmux (après ./attach.sh) :${NC}"
echo -e "   • Changer fenêtre  : ${YELLOW}Ctrl+b${NC} puis ${YELLOW}0/1/2/3${NC}"
echo -e "   • Détacher         : ${YELLOW}Ctrl+b${NC} puis ${YELLOW}d${NC}"
echo -e "   • Scroll mode      : ${YELLOW}Ctrl+b${NC} puis ${YELLOW}[${NC} (q pour quitter)"
echo ""
echo -e "${YELLOW}💡 Les services tournent en arrière-plan. Fermez le terminal sans problème !${NC}"
echo ""
