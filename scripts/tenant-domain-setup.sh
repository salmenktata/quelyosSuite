#!/bin/bash
# Script pour configurer un domaine custom pour un tenant
# Usage: ./tenant-domain-setup.sh <tenant_code> <custom_domain>

set -e

TENANT_CODE=$1
CUSTOM_DOMAIN=$2
NGINX_TENANT_DIR="/etc/nginx/conf.d/tenants"
CERT_DIR="/etc/nginx/ssl/tenants/${CUSTOM_DOMAIN}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$TENANT_CODE" ] || [ -z "$CUSTOM_DOMAIN" ]; then
    echo -e "${RED}Usage: $0 <tenant_code> <custom_domain>${NC}"
    echo "Exemple: $0 maboutique shop.exemple.com"
    exit 1
fi

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Configuration domaine custom pour tenant: ${TENANT_CODE}${NC}"
echo -e "${GREEN}   Domaine: ${CUSTOM_DOMAIN}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

# 1. Générer le certificat SSL pour le domaine custom
echo -e "${YELLOW}Étape 1: Génération du certificat SSL...${NC}"

mkdir -p ${CERT_DIR}

certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d ${CUSTOM_DOMAIN} \
    --email admin@quelyos.com \
    --agree-tos \
    --non-interactive

# Copier les certificats
cp -L /etc/letsencrypt/live/${CUSTOM_DOMAIN}/fullchain.pem ${CERT_DIR}/
cp -L /etc/letsencrypt/live/${CUSTOM_DOMAIN}/privkey.pem ${CERT_DIR}/
chmod 600 ${CERT_DIR}/privkey.pem

# 2. Générer la configuration nginx pour ce domaine
echo -e "${YELLOW}Étape 2: Génération de la configuration nginx...${NC}"

cat > ${NGINX_TENANT_DIR}/tenant-${TENANT_CODE}-custom.conf << EOF
# Configuration nginx pour le domaine custom: ${CUSTOM_DOMAIN}
# Tenant: ${TENANT_CODE}
# Généré automatiquement le $(date)

server {
    listen 443 ssl http2;
    server_name ${CUSTOM_DOMAIN};

    # SSL Certificate
    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Frontend E-commerce
    location / {
        limit_req zone=general burst=20 nodelay;

        proxy_pass http://ecommerce_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Header tenant fixe pour ce domaine
        proxy_set_header X-Tenant-Code ${TENANT_CODE};
        proxy_set_header X-Tenant-Domain \$host;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API Backend
    location /api/ {
        limit_req zone=api_limit burst=5 nodelay;

        proxy_pass http://odoo;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header X-Tenant-Code ${TENANT_CODE};

        proxy_hide_header Server;
        add_header Server "nginx" always;

        add_header Access-Control-Allow-Origin \$http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Tenant-Code" always;
        add_header Access-Control-Allow-Credentials "true" always;

        if (\$request_method = 'OPTIONS') {
            return 204;
        }

        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Static assets
    location /_next/static/ {
        proxy_pass http://ecommerce_frontend;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # Images
    location /images/ {
        proxy_pass http://odoo/web/image/;
        proxy_set_header X-Tenant-Code ${TENANT_CODE};
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK - Custom Domain for ${TENANT_CODE}\n";
        add_header Content-Type text/plain;
    }
}

# HTTP Redirect
server {
    listen 80;
    server_name ${CUSTOM_DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

# 3. Tester et recharger nginx
echo -e "${YELLOW}Étape 3: Test et rechargement nginx...${NC}"

nginx -t

if [ $? -eq 0 ]; then
    nginx -s reload
    echo -e "${GREEN}✓ Configuration nginx rechargée avec succès !${NC}"
else
    echo -e "${RED}Erreur dans la configuration nginx${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Configuration terminée !${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Le domaine ${CUSTOM_DOMAIN} est maintenant configuré pour le tenant ${TENANT_CODE}."
echo ""
echo "N'oubliez pas de configurer le DNS chez le client:"
echo "  ${CUSTOM_DOMAIN} -> CNAME -> quelyos.shop"
echo "  ou"
echo "  ${CUSTOM_DOMAIN} -> A -> [IP_SERVEUR]"
echo ""
echo "Pour vérifier: curl -I https://${CUSTOM_DOMAIN}"
