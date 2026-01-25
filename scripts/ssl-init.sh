#!/bin/bash

# ==============================================
# Quelyos ERP - Initialisation SSL Let's Encrypt
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Initialisation SSL Let's Encrypt${NC}"
echo -e "${GREEN}========================================${NC}\n"

# ----------------------------------------------
# Charger les variables d'environnement
# ----------------------------------------------
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Fichier .env.production introuvable${NC}"
    exit 1
fi

export $(cat .env.production | grep -v '^#' | xargs)

# Vérifier les variables nécessaires
if [ -z "$DOMAIN" ] || [ -z "$LETSENCRYPT_EMAIL" ]; then
    echo -e "${RED}❌ Variables DOMAIN et LETSENCRYPT_EMAIL requises dans .env.production${NC}"
    exit 1
fi

echo -e "${YELLOW}Domaine: ${DOMAIN}${NC}"
echo -e "${YELLOW}Email: ${LETSENCRYPT_EMAIL}${NC}\n"

# ----------------------------------------------
# Mode de déploiement
# ----------------------------------------------
echo -e "${YELLOW}Choisissez le mode:${NC}"
echo "1) Staging (test, certificats non valides)"
echo "2) Production (certificats valides)"
read -p "Votre choix [1/2]: " mode

if [ "$mode" == "1" ]; then
    STAGING_ARG="--staging"
    echo -e "${YELLOW}Mode: Staging (test)${NC}\n"
else
    STAGING_ARG=""
    echo -e "${YELLOW}Mode: Production${NC}\n"
fi

# ----------------------------------------------
# Créer les dossiers nécessaires
# ----------------------------------------------
echo -e "${YELLOW}Création des dossiers...${NC}"
mkdir -p nginx/certbot/www
mkdir -p nginx/certbot/conf
echo -e "${GREEN}✓ Dossiers créés${NC}\n"

# ----------------------------------------------
# Obtenir le certificat
# ----------------------------------------------
echo -e "${YELLOW}Obtention du certificat SSL...${NC}"
echo -e "${YELLOW}Cela peut prendre quelques minutes...${NC}\n"

docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $LETSENCRYPT_EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_ARG \
    -d $DOMAIN \
    -d www.$DOMAIN

# ----------------------------------------------
# Copier les certificats pour Nginx
# ----------------------------------------------
echo -e "\n${YELLOW}Configuration des certificats pour Nginx...${NC}"

# Créer des liens symboliques vers les certificats
if [ -d "nginx/certbot/conf/live/$DOMAIN" ]; then
    ln -sf ../certbot/conf/live/$DOMAIN/fullchain.pem nginx/ssl/fullchain.pem
    ln -sf ../certbot/conf/live/$DOMAIN/privkey.pem nginx/ssl/privkey.pem
    echo -e "${GREEN}✓ Certificats configurés${NC}\n"
else
    echo -e "${RED}❌ Certificats non trouvés${NC}"
    exit 1
fi

# ----------------------------------------------
# Redémarrer Nginx
# ----------------------------------------------
echo -e "${YELLOW}Redémarrage de Nginx...${NC}"
docker-compose -f docker-compose.prod.yml restart nginx
echo -e "${GREEN}✓ Nginx redémarré${NC}\n"

# ----------------------------------------------
# Test SSL
# ----------------------------------------------
echo -e "${YELLOW}Test du certificat SSL...${NC}"
sleep 5

if curl -sI https://$DOMAIN | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    echo -e "${GREEN}✓ SSL fonctionne correctement${NC}\n"
else
    echo -e "${YELLOW}⚠ Impossible de tester SSL (le site n'est peut-être pas encore accessible)${NC}\n"
fi

# ----------------------------------------------
# Informations
# ----------------------------------------------
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SSL configuré avec succès !${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Informations:${NC}"
echo -e "  • Domaine: https://$DOMAIN"
echo -e "  • Expiration: Dans 90 jours"
echo -e "  • Renouvellement: Automatique (via Certbot)"

echo -e "\n${YELLOW}Vérifier le certificat:${NC}"
echo -e "  openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null"

echo -e "\n${YELLOW}Forcer le renouvellement:${NC}"
echo -e "  docker-compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal"

echo ""
