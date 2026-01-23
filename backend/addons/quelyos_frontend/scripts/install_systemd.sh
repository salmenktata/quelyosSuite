#!/bin/bash
# Installe le service systemd pour le frontend Next.js

set -e

FRONTEND_PATH="${1:-/opt/odoo/addons/quelyos_frontend/frontend}"
SERVICE_NAME="quelyos-frontend"
SYSTEMD_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# Vérifier sudo
if [ "$EUID" -ne 0 ]; then
    echo "Ce script nécessite sudo"
    exit 1
fi

# Créer le fichier service
cat > "$SYSTEMD_FILE" <<EOF
[Unit]
Description=Quelyos Frontend Next.js
After=network.target postgresql.service

[Service]
Type=simple
User=odoo
WorkingDirectory=${FRONTEND_PATH}
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=quelyos-frontend

[Install]
WantedBy=multi-user.target
EOF

echo "Service systemd créé: $SYSTEMD_FILE"

# Recharger systemd
systemctl daemon-reload

# Activer le service
systemctl enable "$SERVICE_NAME"

# Démarrer le service
systemctl start "$SERVICE_NAME"

echo "Service $SERVICE_NAME démarré et activé"
echo "Status: systemctl status $SERVICE_NAME"
echo "Logs: journalctl -u $SERVICE_NAME -f"
