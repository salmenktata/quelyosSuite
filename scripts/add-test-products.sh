#!/bin/bash
# Script pour ajouter des produits de test via l'API Odoo

set -e

API_URL="${1:-https://api.quelyos.com}"
DB_NAME="${2:-quelyos}"

echo "=== Ajout de produits de test via API Odoo ==="
echo "API URL: $API_URL"
echo "Database: $DB_NAME"
echo

# Note: Ce script nécessite des credentials admin
# Pour l'instant, je vais créer la structure et vous devrez
# exécuter manuellement avec les credentials

cat > /tmp/odoo_products.py <<'PYTHON'
import xmlrpc.client
import sys

# Configuration
url = sys.argv[1] if len(sys.argv) > 1 else "https://api.quelyos.com"
db = sys.argv[2] if len(sys.argv) > 2 else "quelyos"
username = sys.argv[3] if len(sys.argv) > 3 else "admin"
password = sys.argv[4] if len(sys.argv) > 4 else "admin"

# Connexion
common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, password, {})

if not uid:
    print("❌ Authentification échouée")
    sys.exit(1)

print(f"✓ Connecté avec UID: {uid}")

# API Models
models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

# Créer catégorie
category_id = models.execute_kw(db, uid, password, 'product.category', 'create', [{
    'name': 'Électronique Test'
}])
print(f"✓ Catégorie créée (ID: {category_id})")

# Créer produits
products = [
    {
        'name': 'Ordinateur Portable HP 15"',
        'list_price': 899.99,
        'standard_price': 650.00,
        'default_code': 'LAPTOP-HP-001',
        'type': 'product',
        'categ_id': category_id,
        'description': 'Ordinateur portable professionnel',
        'sale_ok': True,
    },
    {
        'name': 'Souris Sans Fil Logitech',
        'list_price': 29.99,
        'standard_price': 15.00,
        'default_code': 'MOUSE-LOG-001',
        'type': 'product',
        'categ_id': category_id,
        'description': 'Souris ergonomique sans fil',
        'sale_ok': True,
    },
    {
        'name': 'Clavier Mécanique RGB',
        'list_price': 89.99,
        'standard_price': 45.00,
        'default_code': 'KEY-MECH-001',
        'type': 'product',
        'categ_id': category_id,
        'description': 'Clavier mécanique gaming avec RGB',
        'sale_ok': True,
    },
    {
        'name': 'Écran 27" 4K',
        'list_price': 399.99,
        'standard_price': 250.00,
        'default_code': 'SCREEN-4K-001',
        'type': 'product',
        'categ_id': category_id,
        'description': 'Écran 4K 27 pouces IPS',
        'sale_ok': True,
    },
    {
        'name': 'Casque Audio Bluetooth',
        'list_price': 149.99,
        'standard_price': 80.00,
        'default_code': 'HEADSET-BT-001',
        'type': 'product',
        'categ_id': category_id,
        'description': 'Casque sans fil avec réduction de bruit',
        'sale_ok': True,
    },
]

for product_data in products:
    product_id = models.execute_kw(db, uid, password, 'product.template', 'create', [product_data])
    print(f"✓ Produit créé: {product_data['name']} (ID: {product_id})")

print(f"\n✅ {len(products)} produits créés avec succès")
PYTHON

echo "Script Python créé dans /tmp/odoo_products.py"
echo ""
echo "Pour exécuter avec credentials admin:"
echo "python3 /tmp/odoo_products.py $API_URL $DB_NAME admin VOTRE_MOT_DE_PASSE"
