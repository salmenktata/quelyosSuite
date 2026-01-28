#!/bin/bash
# Script pour configurer les certificats SSL wildcard avec Let's Encrypt
# Utilise DNS-01 challenge (nécessite accès DNS API)

set -e

DOMAIN="quelyos.shop"
EMAIL="admin@quelyos.com"
CERT_DIR="/etc/nginx/ssl/wildcard.${DOMAIN}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Configuration SSL Wildcard pour *.${DOMAIN}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

# Vérifier si certbot est installé
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installation de certbot...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install certbot
    else
        apt-get update && apt-get install -y certbot
    fi
fi

# Créer le répertoire pour les certificats
mkdir -p ${CERT_DIR}

echo ""
echo -e "${YELLOW}IMPORTANT: Les certificats wildcard nécessitent une validation DNS.${NC}"
echo ""
echo "Options disponibles:"
echo "  1. Cloudflare DNS (recommandé si vous utilisez Cloudflare)"
echo "  2. OVH DNS"
echo "  3. Manuel (vous devrez ajouter un enregistrement TXT)"
echo ""

read -p "Choisissez une option (1/2/3): " DNS_OPTION

case $DNS_OPTION in
    1)
        # Cloudflare
        echo -e "${GREEN}Configuration Cloudflare DNS...${NC}"

        if [ ! -f ~/.secrets/cloudflare.ini ]; then
            echo -e "${YELLOW}Créez le fichier ~/.secrets/cloudflare.ini avec:${NC}"
            echo "dns_cloudflare_api_token = VOTRE_API_TOKEN"
            exit 1
        fi

        certbot certonly \
            --dns-cloudflare \
            --dns-cloudflare-credentials ~/.secrets/cloudflare.ini \
            -d "${DOMAIN}" \
            -d "*.${DOMAIN}" \
            --email ${EMAIL} \
            --agree-tos \
            --non-interactive
        ;;
    2)
        # OVH
        echo -e "${GREEN}Configuration OVH DNS...${NC}"

        if [ ! -f ~/.secrets/ovh.ini ]; then
            echo -e "${YELLOW}Créez le fichier ~/.secrets/ovh.ini avec:${NC}"
            echo "dns_ovh_endpoint = ovh-eu"
            echo "dns_ovh_application_key = VOTRE_APP_KEY"
            echo "dns_ovh_application_secret = VOTRE_APP_SECRET"
            echo "dns_ovh_consumer_key = VOTRE_CONSUMER_KEY"
            exit 1
        fi

        certbot certonly \
            --dns-ovh \
            --dns-ovh-credentials ~/.secrets/ovh.ini \
            -d "${DOMAIN}" \
            -d "*.${DOMAIN}" \
            --email ${EMAIL} \
            --agree-tos \
            --non-interactive
        ;;
    3)
        # Manuel
        echo -e "${GREEN}Validation manuelle DNS...${NC}"
        echo -e "${YELLOW}Vous devrez ajouter un enregistrement TXT DNS.${NC}"

        certbot certonly \
            --manual \
            --preferred-challenges dns \
            -d "${DOMAIN}" \
            -d "*.${DOMAIN}" \
            --email ${EMAIL} \
            --agree-tos
        ;;
    *)
        echo -e "${RED}Option invalide${NC}"
        exit 1
        ;;
esac

# Copier les certificats vers le répertoire nginx
LETSENCRYPT_LIVE="/etc/letsencrypt/live/${DOMAIN}"

if [ -d "${LETSENCRYPT_LIVE}" ]; then
    echo -e "${GREEN}Copie des certificats vers ${CERT_DIR}...${NC}"
    cp -L ${LETSENCRYPT_LIVE}/fullchain.pem ${CERT_DIR}/
    cp -L ${LETSENCRYPT_LIVE}/privkey.pem ${CERT_DIR}/
    chmod 600 ${CERT_DIR}/privkey.pem

    echo ""
    echo -e "${GREEN}✓ Certificats installés avec succès !${NC}"
    echo ""
    echo "Fichiers créés:"
    echo "  - ${CERT_DIR}/fullchain.pem"
    echo "  - ${CERT_DIR}/privkey.pem"
    echo ""
    echo "Rechargez nginx: nginx -s reload"
else
    echo -e "${RED}Erreur: Certificats non trouvés dans ${LETSENCRYPT_LIVE}${NC}"
    exit 1
fi

# Configurer le renouvellement automatique
echo ""
echo -e "${GREEN}Configuration du renouvellement automatique...${NC}"

# Créer le script de post-renouvellement
cat > /etc/letsencrypt/renewal-hooks/deploy/copy-wildcard-certs.sh << 'EOF'
#!/bin/bash
DOMAIN="quelyos.shop"
CERT_DIR="/etc/nginx/ssl/wildcard.${DOMAIN}"

cp -L /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${CERT_DIR}/
cp -L /etc/letsencrypt/live/${DOMAIN}/privkey.pem ${CERT_DIR}/
chmod 600 ${CERT_DIR}/privkey.pem
nginx -s reload
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/copy-wildcard-certs.sh

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Configuration terminée !${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Les certificats seront automatiquement renouvelés par certbot."
echo "Vérifiez avec: certbot certificates"
