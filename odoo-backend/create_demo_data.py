#!/usr/bin/env python3
"""
Script pour créer des données de démonstration dans Odoo
"""

import xmlrpc.client

# Configuration
url = "http://localhost:8069"
db = "quelyos"
username = "admin"
password = "admin"

# Connexion
common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, password, {})
models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

print(f"✅ Connecté en tant que user ID: {uid}")

# Créer des catégories
print("\n📁 Création des catégories...")
categories = [
    {"name": "Vêtements de Sport"},
    {"name": "Chaussures"},
    {"name": "Équipements"},
    {"name": "Accessoires"},
]

cat_ids = {}
for cat in categories:
    existing = models.execute_kw(db, uid, password,
        'product.category', 'search',
        [[('name', '=', cat['name'])]])

    if existing:
        cat_ids[cat['name']] = existing[0]
        print(f"   ✓ {cat['name']} (existe déjà)")
    else:
        cat_id = models.execute_kw(db, uid, password,
            'product.category', 'create', [cat])
        cat_ids[cat['name']] = cat_id
        print(f"   ✓ {cat['name']} (créée)")

# Créer des produits
print("\n📦 Création des produits...")
products = [
    {
        "name": "T-Shirt de Sport Nike",
        "list_price": 29.99,
        "categ_id": cat_ids.get("Vêtements de Sport"),
        "type": "consu",
        "description_sale": "T-shirt confortable et respirant, idéal pour vos séances de sport.",
        "sale_ok": True,
        "purchase_ok": True,
    },
    {
        "name": "Chaussures de Running Adidas",
        "list_price": 89.99,
        "categ_id": cat_ids.get("Chaussures"),
        "type": "consu",
        "description_sale": "Chaussures légères avec amorti optimal pour la course à pied.",
        "sale_ok": True,
        "purchase_ok": True,
    },
    {
        "name": "Ballon de Football",
        "list_price": 19.99,
        "categ_id": cat_ids.get("Équipements"),
        "type": "consu",
        "description_sale": "Ballon officiel taille 5, parfait pour l'entraînement et les matchs.",
        "sale_ok": True,
        "purchase_ok": True,
    },
    {
        "name": "Gourde Sport 750ml",
        "list_price": 12.99,
        "categ_id": cat_ids.get("Accessoires"),
        "type": "consu",
        "description_sale": "Gourde isotherme en acier inoxydable, garde vos boissons au frais.",
        "sale_ok": True,
        "purchase_ok": True,
    },
    {
        "name": "Short de Compression",
        "list_price": 34.99,
        "categ_id": cat_ids.get("Vêtements de Sport"),
        "type": "consu",
        "description_sale": "Short technique avec technologie de compression pour améliorer les performances.",
        "sale_ok": True,
        "purchase_ok": True,
    },
]

product_ids = []
for prod in products:
    existing = models.execute_kw(db, uid, password,
        'product.template', 'search',
        [[('name', '=', prod['name'])]])

    if existing:
        product_ids.append(existing[0])
        print(f"   ✓ {prod['name']} (existe déjà)")
    else:
        prod_id = models.execute_kw(db, uid, password,
            'product.template', 'create', [prod])
        product_ids.append(prod_id)
        print(f"   ✓ {prod['name']} (créé)")

print("\n✅ Données de démonstration créées avec succès!")
print(f"   - {len(categories)} catégories")
print(f"   - {len(products)} produits")
print("\n💡 Note: Les stocks doivent être mis à jour via l'interface Odoo ou le backoffice")
