#!/bin/bash

# ==============================================
# Quelyos ERP - Déploiement Production
# ==============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Quelyos ERP - Déploiement Production${NC}"
echo -e "${GREEN}========================================${NC}\n"

# ----------------------------------------------
# 1. Vérifications préalables
# ----------------------------------------------
echo -e "${YELLOW}[1/6] Vérifications préalables...${NC}"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi

# Vérifier que .env.production existe
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fichier .env.production introuvable${NC}"
    echo -e "${YELLOW}Copier .env.production.example vers .env.production et remplir les valeurs${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Vérifications OK${NC}\n"

# ----------------------------------------------
# 2. Charger les variables d'environnement
# ----------------------------------------------
echo -e "${YELLOW}[2/6] Chargement des variables d'environnement...${NC}"
export $(cat .env.production | grep -v '^#' | xargs)
echo -e "${GREEN}✓ Variables chargées${NC}\n"

# ----------------------------------------------
# 3. Créer les dossiers nécessaires
# ----------------------------------------------
echo -e "${YELLOW}[3/6] Création des dossiers...${NC}"
mkdir -p nginx/ssl
mkdir -p nginx/certbot/www
mkdir -p nginx/certbot/conf
mkdir -p backups
mkdir -p odoo_logs
echo -e "${GREEN}✓ Dossiers créés${NC}\n"

# ----------------------------------------------
# 4. Build des images Docker
# ----------------------------------------------
echo -e "${YELLOW}[4/6] Construction des images Docker...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache
echo -e "${GREEN}✓ Images construites${NC}\n"

# ----------------------------------------------
# 5. Démarrage des services
# ----------------------------------------------
echo -e "${YELLOW}[5/6] Démarrage des services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}✓ Services démarrés${NC}\n"

# Attendre que les services soient prêts
echo -e "${YELLOW}Attente du démarrage complet des services (30s)...${NC}"
sleep 30

# ----------------------------------------------
# 6. Vérification du statut
# ----------------------------------------------
echo -e "${YELLOW}[6/6] Vérification du statut...${NC}\n"
docker-compose -f docker-compose.prod.yml ps

# ----------------------------------------------
# Healthchecks
# ----------------------------------------------
echo -e "\n${YELLOW}Healthchecks:${NC}"

# Frontend
if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo -e "${GREEN}✓ Frontend: OK${NC}"
else
    echo -e "${RED}✗ Frontend: KO${NC}"
fi

# Backoffice
if curl -f http://localhost:80/health &> /dev/null; then
    echo -e "${GREEN}✓ Backoffice: OK${NC}"
else
    echo -e "${RED}✗ Backoffice: KO${NC}"
fi

# Odoo
if curl -f http://localhost:8069/web/health &> /dev/null; then
    echo -e "${GREEN}✓ Odoo: OK${NC}"
else
    echo -e "${RED}✗ Odoo: KO${NC}"
fi

# ----------------------------------------------
# Informations
# ----------------------------------------------
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Déploiement terminé !${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Accès aux services:${NC}"
echo -e "  • Frontend:   https://${DOMAIN}"
echo -e "  • Backoffice: https://${DOMAIN}/admin"
echo -e "  • API Odoo:   https://${DOMAIN}/api"
echo -e "  • Odoo Admin: https://${DOMAIN}/web"

echo -e "\n${YELLOW}Commandes utiles:${NC}"
echo -e "  • Logs:       docker-compose -f docker-compose.prod.yml logs -f"
echo -e "  • Restart:    docker-compose -f docker-compose.prod.yml restart"
echo -e "  • Stop:       docker-compose -f docker-compose.prod.yml down"
echo -e "  • Status:     docker-compose -f docker-compose.prod.yml ps"

echo -e "\n${YELLOW}Prochaines étapes:${NC}"
echo -e "  1. Configurer SSL avec: ./ssl-init.sh"
echo -e "  2. Vérifier les logs pour détecter d'éventuelles erreurs"
echo -e "  3. Configurer les sauvegardes automatiques avec: ./backup.sh"

echo ""
