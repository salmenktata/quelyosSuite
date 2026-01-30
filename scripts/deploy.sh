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
echo -e "${YELLOW}[3/8] Création des dossiers...${NC}"
mkdir -p nginx/ssl
mkdir -p nginx/certbot/www
mkdir -p nginx/certbot/conf
mkdir -p backups
mkdir -p odoo_logs
echo -e "${GREEN}✓ Dossiers créés${NC}\n"

# ----------------------------------------------
# 4. Build des images Docker
# ----------------------------------------------
echo -e "${YELLOW}[4/8] Construction des images Docker...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache
echo -e "${GREEN}✓ Images construites${NC}\n"

# ----------------------------------------------
# 5. Démarrage des services (HTTP uniquement pour Certbot)
# ----------------------------------------------
echo -e "${YELLOW}[5/8] Démarrage des services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}✓ Services démarrés${NC}\n"

# Attendre que Nginx soit prêt
echo -e "${YELLOW}Attente du démarrage de Nginx (15s)...${NC}"
sleep 15

# ----------------------------------------------
# 6. Génération automatique SSL (Let's Encrypt)
# ----------------------------------------------
echo -e "${YELLOW}[6/8] Configuration SSL Let's Encrypt...${NC}"

if [ -f "nginx/ssl/fullchain.pem" ] && [ -f "nginx/ssl/privkey.pem" ]; then
    echo -e "${GREEN}✓ Certificats SSL existants détectés${NC}\n"
else
    echo -e "${YELLOW}Génération des certificats SSL pour ${DOMAIN}...${NC}"

    # Obtenir le certificat avec Certbot
    docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email ${LETSENCRYPT_EMAIL} \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d ${DOMAIN} \
        -d www.${DOMAIN} || {
            echo -e "${RED}⚠ Échec génération SSL - vérifiez que le domaine pointe vers ce serveur${NC}"
            echo -e "${YELLOW}Continuant sans SSL...${NC}"
        }

    # Créer les liens symboliques si les certificats ont été générés
    if [ -d "nginx/certbot/conf/live/${DOMAIN}" ]; then
        ln -sf $(pwd)/nginx/certbot/conf/live/${DOMAIN}/fullchain.pem nginx/ssl/fullchain.pem
        ln -sf $(pwd)/nginx/certbot/conf/live/${DOMAIN}/privkey.pem nginx/ssl/privkey.pem
        echo -e "${GREEN}✓ Certificats SSL configurés${NC}"

        # Redémarrer Nginx pour charger les certificats
        docker-compose -f docker-compose.prod.yml restart nginx
        echo -e "${GREEN}✓ Nginx redémarré avec SSL${NC}\n"
    fi
fi

# Attendre la stabilisation
echo -e "${YELLOW}Attente de la stabilisation (15s)...${NC}"
sleep 15

# ----------------------------------------------
# 7. Vérification du statut
# ----------------------------------------------
echo -e "${YELLOW}[7/8] Vérification du statut...${NC}\n"
docker-compose -f docker-compose.prod.yml ps

# ----------------------------------------------
# 8. Healthchecks
# ----------------------------------------------
echo -e "${YELLOW}[8/8] Healthchecks...${NC}"

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
echo -e "  1. Vérifier les logs pour détecter d'éventuelles erreurs"
echo -e "  2. Configurer les sauvegardes automatiques avec: ./scripts/backup-db.sh"
echo -e "  3. Configurer Stripe dans .env.production (si non fait)"

echo ""
