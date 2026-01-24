#!/usr/bin/env python3
"""
Script pour ajouter du stock aux variants du T-Shirt
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

# Récupérer le produit T-Shirt
product_id = models.execute_kw(db, uid, password,
    'product.template', 'search',
    [[['name', '=', 'T-Shirt Sport Premium']]], {'limit': 1})

if not product_id:
    print("❌ Produit T-Shirt Sport Premium non trouvé")
    exit(1)

product_id = product_id[0]
print(f"✅ Produit trouvé (ID: {product_id})")

# Récupérer tous les variants
product = models.execute_kw(db, uid, password,
    'product.template', 'read',
    [[product_id]], {'fields': ['product_variant_ids']})

variant_ids = product[0]['product_variant_ids']
print(f"✅ {len(variant_ids)} variants trouvés")

# Récupérer les détails des variants
variants = models.execute_kw(db, uid, password,
    'product.product', 'read',
    [variant_ids], {'fields': ['id', 'display_name']})

# Ajouter du stock différent pour chaque variant
print("\n📦 Ajout de stock aux variants...")

stock_levels = [15, 20, 10, 5, 12, 25, 8, 3, 0, 18, 22, 6]  # 0 pour Vert/S pour tester "rupture"

# Récupérer l'emplacement de stock par défaut
location_id = models.execute_kw(db, uid, password,
    'stock.location', 'search',
    [[['usage', '=', 'internal']]], {'limit': 1})

if not location_id:
    print("❌ Emplacement de stock non trouvé")
    exit(1)

location_id = location_id[0]

for i, variant in enumerate(variants):
    qty = stock_levels[i] if i < len(stock_levels) else 10

    # Mettre à jour la quantité
    # Note: Dans Odoo, pour mettre à jour le stock, il faut créer un ajustement d'inventaire
    try:
        # Méthode 1: Utiliser stock.quant pour mettre à jour directement
        quant_ids = models.execute_kw(db, uid, password,
            'stock.quant', 'search',
            [[['product_id', '=', variant['id']], ['location_id', '=', location_id]]], {'limit': 1})

        if quant_ids:
            # Mettre à jour le quant existant
            models.execute_kw(db, uid, password,
                'stock.quant', 'write',
                [[quant_ids[0]], {'quantity': qty}])
        else:
            # Créer un nouveau quant
            models.execute_kw(db, uid, password,
                'stock.quant', 'create',
                [{
                    'product_id': variant['id'],
                    'location_id': location_id,
                    'quantity': qty,
                }])

        status = "✅" if qty > 0 else "⚠️ "
        print(f"  {status} {variant['display_name']}: {qty} unités")
    except Exception as e:
        print(f"  ❌ Erreur pour {variant['display_name']}: {e}")

print("\n✅ Stock ajouté avec succès !")
print(f"\n🌐 Vérifiez maintenant:")
print(f"   http://localhost:3000/products")
print(f"\n   Vous devriez voir les boutons de sélection de variants !")
print(f"   - Les variants en stock seront cliquables")
print(f"   - Le variant 'Vert S' sera barré (rupture de stock)")
