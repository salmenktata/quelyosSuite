#!/bin/bash
# Reset Odoo 19 - Installation vierge + quelyos_api
# Usage: ./reset.sh

set -e

echo "=== Reset Odoo 19 ==="

# Arrêter les conteneurs
echo "Arrêt des conteneurs..."
docker-compose down -v 2>/dev/null || true

# Supprimer les volumes orphelins
echo "Nettoyage des volumes..."
docker volume rm backend_postgres_data backend_odoo_data backend_odoo_config 2>/dev/null || true

# Supprimer les conteneurs orphelins
docker rm -f quelyos-db quelyos-odoo 2>/dev/null || true

# Démarrer
echo "Démarrage Odoo 19..."
docker-compose up -d

# Attendre que Odoo soit prêt
echo "Attente du démarrage (15s)..."
sleep 15

# Installer quelyos_api
echo ""
echo "=== Installation quelyos_api ==="
docker-compose exec -T odoo odoo -d quelyos -i quelyos_api --db_host=db --db_user=odoo --db_password=odoo --stop-after-init

# Redémarrer Odoo
echo ""
echo "Redémarrage Odoo..."
docker-compose restart odoo
sleep 5

# Vérifier le statut
echo ""
echo "=== Statut ==="
docker-compose ps

echo ""
echo "=== Modules installés ==="
docker exec quelyos-db psql -U odoo -d quelyos -c "SELECT name, state FROM ir_module_module WHERE name LIKE 'quelyos%' OR name IN ('sale_management', 'stock', 'contacts', 'delivery');" 2>/dev/null

echo ""
echo "Odoo 19 disponible sur: http://localhost:8069"
echo "Credentials: admin / admin"
