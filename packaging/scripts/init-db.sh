#!/bin/bash
# ============================================================================
# Quelyos ERP - Database Initialization Script
# ============================================================================
# Script d'initialisation de la base de données PostgreSQL et Odoo
# ============================================================================

set -e

echo "[DB INIT] Initialisation de la base de données Quelyos..."

# Variables d'environnement
DB_USER="${QUELYOS_DB_USER:-quelyos}"
DB_PASSWORD="${QUELYOS_DB_PASSWORD:-quelyos2026}"
DB_NAME="${QUELYOS_DB_NAME:-quelyos}"
ADMIN_EMAIL="${QUELYOS_ADMIN_EMAIL:-admin@quelyos.local}"
ADMIN_PASSWORD="${QUELYOS_ADMIN_PASSWORD:-admin}"

# ============================================================================
# Créer utilisateur PostgreSQL
# ============================================================================
echo "[DB INIT] Création de l'utilisateur PostgreSQL '${DB_USER}'..."

su - postgres -c "psql -c \"SELECT 1 FROM pg_user WHERE usename = '${DB_USER}'\" | grep -q 1" || \
su - postgres -c "psql -c \"CREATE USER ${DB_USER} WITH CREATEDB PASSWORD '${DB_PASSWORD}';\""

echo "[DB INIT] ✓ Utilisateur PostgreSQL créé"

# ============================================================================
# Créer base de données
# ============================================================================
echo "[DB INIT] Création de la base de données '${DB_NAME}'..."

su - postgres -c "psql -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}" || \
su - postgres -c "psql -c \"CREATE DATABASE ${DB_NAME} OWNER ${DB_USER} ENCODING 'UTF8' LC_COLLATE='fr_FR.UTF-8' LC_CTYPE='fr_FR.UTF-8' TEMPLATE=template0;\""

echo "[DB INIT] ✓ Base de données créée"

# ============================================================================
# Initialiser Odoo (installation modules de base)
# ============================================================================
echo "[DB INIT] Initialisation d'Odoo..."

# Créer configuration temporaire Odoo
cat > /tmp/odoo-init.conf <<EOF
[options]
admin_passwd = ${ADMIN_PASSWORD}
db_host = 127.0.0.1
db_port = 5432
db_user = ${DB_USER}
db_password = ${DB_PASSWORD}
dbfilter = ^${DB_NAME}$
data_dir = /var/lib/quelyos/odoo
logfile = /var/log/quelyos/odoo/odoo-init.log
log_level = info
without_demo = all
EOF

# Lancer Odoo en mode init (installation des modules de base + quelyos_api)
su - odoo -c "/usr/bin/python3 /opt/odoo/odoo/odoo-bin \
    -c /tmp/odoo-init.conf \
    --addons-path=/opt/odoo/addons/quelyos,/opt/odoo/odoo/addons \
    -d ${DB_NAME} \
    -i base,web,quelyos_api \
    --stop-after-init \
    --load-language=fr_FR"

echo "[DB INIT] ✓ Odoo initialisé"

# ============================================================================
# Créer utilisateur admin
# ============================================================================
echo "[DB INIT] Configuration de l'utilisateur administrateur..."

# Script Python pour configurer l'admin
cat > /tmp/setup_admin.py <<PYTHON
import odoorpc

# Connexion à Odoo
odoo = odoorpc.ODOO('127.0.0.1', port=8069)
odoo.login('${DB_NAME}', 'admin', '${ADMIN_PASSWORD}')

# Obtenir l'utilisateur admin
User = odoo.env['res.users']
admin = User.search([('login', '=', 'admin')])[0]

# Mettre à jour l'email
User.write([admin], {'email': '${ADMIN_EMAIL}'})

print("✓ Utilisateur admin configuré")
PYTHON

# Démarrer Odoo temporairement pour la config
su - odoo -c "/usr/bin/python3 /opt/odoo/odoo/odoo-bin \
    -c /tmp/odoo-init.conf \
    --addons-path=/opt/odoo/addons/quelyos,/opt/odoo/odoo/addons \
    -d ${DB_NAME} &"

ODOO_PID=$!

# Attendre qu'Odoo soit prêt
sleep 10

# Exécuter la configuration
python3 /tmp/setup_admin.py || echo "Warning: Could not configure admin user (Odoo might not be ready)"

# Arrêter Odoo temporaire
kill $ODOO_PID || true
wait $ODOO_PID || true

# Nettoyer
rm -f /tmp/odoo-init.conf /tmp/setup_admin.py

echo "[DB INIT] ✓ Configuration terminée"
echo ""
echo "=================================================="
echo "  Base de données Quelyos initialisée avec succès"
echo "=================================================="
echo ""
echo "  Database:  ${DB_NAME}"
echo "  User:      ${DB_USER}"
echo "  Admin:     ${ADMIN_EMAIL}"
echo ""
