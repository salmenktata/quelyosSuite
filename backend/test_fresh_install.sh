#!/bin/bash
# Script de test d'installation complète des modules Quelyos

set -e

DB_NAME="quelyos_test_$(date +%s)"
echo "=== Test Installation Modules Quelyos ==="
echo "Base de données: $DB_NAME"
echo ""

# Arrêter tout processus Next.js en cours
echo "1. Nettoyage des processus existants..."
pkill -f 'next-server' 2>/dev/null || true
sleep 2

# Créer la base de données
echo "2. Création de la base de données $DB_NAME..."
docker-compose run --rm odoo \
  odoo --addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons \
  -d "$DB_NAME" \
  -i base \
  --load-language=fr_FR \
  --without-demo=False \
  --stop-after-init

echo ""
echo "3. Installation des modules Quelyos..."
docker-compose run --rm odoo \
  odoo --addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons \
  -d "$DB_NAME" \
  -i quelyos_core,quelyos_frontend,quelyos_branding,quelyos_ecommerce \
  --stop-after-init

echo ""
echo "4. Vérification des modules installés..."
docker-compose exec -T db psql -U odoo -d "$DB_NAME" -tAc \
  "SELECT name, state FROM ir_module_module WHERE name LIKE 'quelyos_%' ORDER BY name;" \
  2>&1 | grep -v "^time=" | grep -v "^level="

echo ""
echo "5. Vérification du frontend..."
sleep 5
if ps aux | grep -v grep | grep 'next-server' > /dev/null; then
    echo "✅ Frontend démarré automatiquement!"
    ps aux | grep next-server | grep -v grep
else
    echo "⚠️  Frontend non démarré (normal si systemd non installé)"
    echo "Le fallback npm run dev devrait avoir démarré..."
fi

echo ""
echo "=== Test terminé ==="
echo "Base de données créée: $DB_NAME"
echo "Pour accéder: http://localhost:8069"
echo "  - Base: $DB_NAME"
echo "  - Login: admin"
echo "  - Pass: admin"
echo ""
echo "Frontend: http://localhost:3000"
echo ""
