#!/usr/bin/env python3
"""
Script pour vérifier les valeurs valides du champ type
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

# Récupérer un produit existant
products = models.execute_kw(db, uid, password,
    'product.template', 'search_read',
    [[]], {'fields': ['name', 'type'], 'limit': 5})

print("\nProduits existants:")
for p in products:
    print(f"  - {p['name']}: type = '{p['type']}'")

# Récupérer les informations sur le champ type
fields_info = models.execute_kw(db, uid, password,
    'product.template', 'fields_get',
    [['type']], {'attributes': ['type', 'selection', 'string']})

print("\nInformations sur le champ 'type':")
print(fields_info)
