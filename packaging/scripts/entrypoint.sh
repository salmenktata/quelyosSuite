#!/bin/bash
# ============================================================================
# Quelyos ERP - Entrypoint Script
# ============================================================================
# Script de démarrage principal de l'image Docker all-in-one
# ============================================================================

set -e

echo "=================================================="
echo "  Quelyos ERP - Initialisation"
echo "=================================================="
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Configuration par défaut
# ============================================================================
export QUELYOS_DB_USER="${QUELYOS_DB_USER:-quelyos}"
export QUELYOS_DB_PASSWORD="${QUELYOS_DB_PASSWORD:-quelyos2026}"
export QUELYOS_DB_NAME="${QUELYOS_DB_NAME:-quelyos}"
export QUELYOS_ADMIN_EMAIL="${QUELYOS_ADMIN_EMAIL:-admin@quelyos.local}"
export QUELYOS_ADMIN_PASSWORD="${QUELYOS_ADMIN_PASSWORD:-admin}"
export QUELYOS_PORT="${QUELYOS_PORT:-80}"

# ============================================================================
# Création des répertoires de logs
# ============================================================================
echo -e "${BLUE}[INFO]${NC} Création des répertoires de logs..."
mkdir -p /var/log/quelyos/{odoo,nginx,supervisor}
chown -R odoo:odoo /var/log/quelyos/odoo

# ============================================================================
# Vérification premier démarrage
# ============================================================================
FIRST_RUN_FLAG="/var/lib/quelyos/.initialized"

if [ ! -f "$FIRST_RUN_FLAG" ]; then
    echo -e "${YELLOW}[FIRST RUN]${NC} Première installation détectée"
    echo ""

    # ------------------------------------------------------------------------
    # Initialisation PostgreSQL
    # ------------------------------------------------------------------------
    echo -e "${BLUE}[INFO]${NC} Initialisation de PostgreSQL..."

    # Copier cluster si volume vide
    if [ ! -f "/var/lib/quelyos/postgresql/PG_VERSION" ]; then
        echo -e "${BLUE}[INFO]${NC} Copie du cluster PostgreSQL initial..."
        cp -R /var/lib/postgresql/14/main/* /var/lib/quelyos/postgresql/
        chown -R postgres:postgres /var/lib/quelyos/postgresql
    fi

    # Démarrer PostgreSQL temporairement
    echo -e "${BLUE}[INFO]${NC} Démarrage temporaire de PostgreSQL..."
    su - postgres -c "/usr/lib/postgresql/14/bin/pg_ctl -D /var/lib/quelyos/postgresql -l /var/log/quelyos/postgresql-init.log start"

    # Attendre que PostgreSQL soit prêt
    echo -e "${BLUE}[INFO]${NC} Attente de PostgreSQL..."
    /usr/local/bin/wait-for-postgres.sh

    # Initialiser la base de données
    echo -e "${BLUE}[INFO]${NC} Initialisation de la base de données Quelyos..."
    /usr/local/bin/init-db.sh

    # Arrêter PostgreSQL temporaire
    echo -e "${BLUE}[INFO]${NC} Arrêt de PostgreSQL temporaire..."
    su - postgres -c "/usr/lib/postgresql/14/bin/pg_ctl -D /var/lib/quelyos/postgresql stop -m fast"

    # Marquer comme initialisé
    echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$FIRST_RUN_FLAG"

    echo ""
    echo -e "${GREEN}[SUCCESS]${NC} Initialisation terminée avec succès !"
    echo ""
    echo "=================================================="
    echo "  Quelyos ERP - Informations de connexion"
    echo "=================================================="
    echo ""
    echo -e "  ${GREEN}✓${NC} URL Boutique:    http://localhost:${QUELYOS_PORT}/"
    echo -e "  ${GREEN}✓${NC} URL Backoffice:  http://localhost:${QUELYOS_PORT}/admin"
    echo ""
    echo -e "  ${BLUE}Admin:${NC}"
    echo -e "    Email:     ${QUELYOS_ADMIN_EMAIL}"
    echo -e "    Password:  ${QUELYOS_ADMIN_PASSWORD}"
    echo ""
    echo "=================================================="
    echo ""
else
    echo -e "${GREEN}[INFO]${NC} Instance Quelyos déjà initialisée"
    echo -e "${BLUE}[INFO]${NC} Date d'initialisation: $(cat $FIRST_RUN_FLAG)"
    echo ""
fi

# ============================================================================
# Configurer PostgreSQL pour utiliser le volume
# ============================================================================
echo -e "${BLUE}[INFO]${NC} Configuration de PostgreSQL..."
sed -i "s|/var/lib/postgresql/14/main|/var/lib/quelyos/postgresql|g" /etc/postgresql/14/main/postgresql.conf || true

# ============================================================================
# Configurer Odoo
# ============================================================================
echo -e "${BLUE}[INFO]${NC} Configuration de Odoo..."
cat > /etc/odoo/odoo.conf <<EOF
[options]
admin_passwd = ${QUELYOS_ADMIN_PASSWORD}
db_host = 127.0.0.1
db_port = 5432
db_user = ${QUELYOS_DB_USER}
db_password = ${QUELYOS_DB_PASSWORD}
dbfilter = ^${QUELYOS_DB_NAME}$
data_dir = /var/lib/quelyos/odoo
logfile = /var/log/quelyos/odoo/odoo.log
log_level = info
workers = 2
max_cron_threads = 1
limit_time_real = 600
limit_time_cpu = 300
without_demo = all
EOF

chown odoo:odoo /etc/odoo/odoo.conf
chmod 640 /etc/odoo/odoo.conf

# ============================================================================
# Démarrer tous les services via Supervisord
# ============================================================================
echo -e "${GREEN}[INFO]${NC} Démarrage de Quelyos ERP..."
echo ""

# Exécuter la commande passée en argument (par défaut: supervisord)
exec "$@"
