#!/usr/bin/env python3
"""
Script pour créer un produit avec variants dans Odoo
"""

import xmlrpc.client

# Configuration
url = 'http://localhost:8069'
db = 'quelyos_fresh'
username = 'admin'
password = 'admin'

# Connexion
common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, password, {})

if not uid:
    print("❌ Échec de connexion")
    exit(1)

print(f"✅ Connecté en tant que user ID: {uid}")

# API
models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

# 1. Créer ou récupérer les attributs
print("\n📋 Création des attributs...")

# Attribut Couleur
color_attr_id = models.execute_kw(db, uid, password,
    'product.attribute', 'search',
    [[['name', '=', 'Couleur']]], {'limit': 1})

if not color_attr_id:
    color_attr_id = models.execute_kw(db, uid, password,
        'product.attribute', 'create', [{
            'name': 'Couleur',
            'display_type': 'color',
        }])
    print(f"  ✅ Attribut Couleur créé (ID: {color_attr_id})")
else:
    color_attr_id = color_attr_id[0]
    print(f"  ✓ Attribut Couleur existe déjà (ID: {color_attr_id})")

# Attribut Taille
size_attr_id = models.execute_kw(db, uid, password,
    'product.attribute', 'search',
    [[['name', '=', 'Taille']]], {'limit': 1})

if not size_attr_id:
    size_attr_id = models.execute_kw(db, uid, password,
        'product.attribute', 'create', [{
            'name': 'Taille',
            'display_type': 'radio',
        }])
    print(f"  ✅ Attribut Taille créé (ID: {size_attr_id})")
else:
    size_attr_id = size_attr_id[0]
    print(f"  ✓ Attribut Taille existe déjà (ID: {size_attr_id})")

# 2. Créer les valeurs d'attributs
print("\n🎨 Création des valeurs...")

# Couleurs
colors = [
    {'name': 'Rouge', 'html_color': '#FF0000'},
    {'name': 'Bleu', 'html_color': '#0000FF'},
    {'name': 'Vert', 'html_color': '#00FF00'},
]

color_value_ids = []
for color in colors:
    val_id = models.execute_kw(db, uid, password,
        'product.attribute.value', 'search',
        [[['attribute_id', '=', color_attr_id], ['name', '=', color['name']]]], {'limit': 1})

    if not val_id:
        val_id = models.execute_kw(db, uid, password,
            'product.attribute.value', 'create', [{
                'name': color['name'],
                'attribute_id': color_attr_id,
                'html_color': color['html_color'],
            }])
        print(f"  ✅ Valeur {color['name']} créée")
    else:
        val_id = val_id[0]
        print(f"  ✓ Valeur {color['name']} existe")

    color_value_ids.append(val_id)

# Tailles
sizes = ['S', 'M', 'L', 'XL']
size_value_ids = []
for size in sizes:
    val_id = models.execute_kw(db, uid, password,
        'product.attribute.value', 'search',
        [[['attribute_id', '=', size_attr_id], ['name', '=', size]]], {'limit': 1})

    if not val_id:
        val_id = models.execute_kw(db, uid, password,
            'product.attribute.value', 'create', [{
                'name': size,
                'attribute_id': size_attr_id,
            }])
        print(f"  ✅ Valeur {size} créée")
    else:
        val_id = val_id[0]
        print(f"  ✓ Valeur {size} existe")

    size_value_ids.append(val_id)

# 3. Créer le produit avec variants
print("\n📦 Création du produit avec variants...")

# Récupérer la catégorie Office
category_id = models.execute_kw(db, uid, password,
    'product.category', 'search',
    [[['name', '=', 'Office']]], {'limit': 1})

if not category_id:
    category_id = [1]  # Catégorie par défaut
else:
    category_id = category_id

product_data = {
    'name': 'T-Shirt Sport Premium',
    'type': 'consu',  # Type: Goods (produit consommable/stockable)
    'categ_id': category_id[0] if category_id else 1,
    'list_price': 29.99,
    'standard_price': 15.00,
    'description_sale': 'T-shirt de sport haute qualité disponible en plusieurs couleurs et tailles',
    'is_featured': True,
    'is_new': True,
    'sale_ok': True,
    'purchase_ok': True,
    # Attributs avec variants
    'attribute_line_ids': [
        (0, 0, {
            'attribute_id': color_attr_id,
            'value_ids': [(6, 0, color_value_ids[:3])],  # Rouge, Bleu, Vert
        }),
        (0, 0, {
            'attribute_id': size_attr_id,
            'value_ids': [(6, 0, size_value_ids)],  # S, M, L, XL
        }),
    ],
}

# Vérifier si le produit existe déjà
existing = models.execute_kw(db, uid, password,
    'product.template', 'search',
    [[['name', '=', product_data['name']]]], {'limit': 1})

if existing:
    product_id = existing[0]
    print(f"  ⚠️  Produit existe déjà (ID: {product_id}), mise à jour...")
    models.execute_kw(db, uid, password,
        'product.template', 'write',
        [[product_id], product_data])
else:
    product_id = models.execute_kw(db, uid, password,
        'product.template', 'create', [product_data])
    print(f"  ✅ Produit créé (ID: {product_id})")

# 4. Vérifier les variants créés
print("\n🔍 Vérification des variants...")
product = models.execute_kw(db, uid, password,
    'product.template', 'read',
    [[product_id]], {'fields': ['name', 'product_variant_count', 'product_variant_ids']})

if product:
    p = product[0]
    print(f"  Produit: {p['name']}")
    print(f"  Nombre de variants: {p['product_variant_count']}")

    if p['product_variant_ids']:
        variants = models.execute_kw(db, uid, password,
            'product.product', 'read',
            [p['product_variant_ids']], {'fields': ['display_name', 'lst_price', 'qty_available']})

        print(f"\n  Variants générés ({len(variants)}):")
        for v in variants[:5]:  # Afficher max 5
            print(f"    - {v['display_name']}: {v['lst_price']}€ (Stock: {v['qty_available']})")

        if len(variants) > 5:
            print(f"    ... et {len(variants) - 5} autres")

print("\n✅ Script terminé avec succès !")
print(f"\n🌐 Testez l'API:")
print(f"   curl -X POST http://localhost:8069/api/ecommerce/products/{product_id} \\")
print(f"     -H 'Content-Type: application/json' \\")
print(f"     -d '{{\"jsonrpc\": \"2.0\", \"method\": \"call\", \"params\": {{}}, \"id\": 1}}' | jq")
