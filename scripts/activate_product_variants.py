#!/usr/bin/env python3
"""
Script pour activer les variantes de produits dans Odoo
Usage: docker-compose exec odoo odoo shell -d quelyos < activate_product_variants.py
"""

# Activer les variantes de produits
# Dans Odoo 18.0, c'est géré par le paramètre de configuration

# 1. Vérifier si le module 'product' est installé
product_module = env['ir.module.module'].search([('name', '=', 'product')])
if product_module and product_module.state == 'installed':
    print("✅ Module 'product' est installé")
else:
    print("❌ Module 'product' n'est pas installé")

# 2. Vérifier si le module 'sale' est installé (pour les variantes dans ventes)
sale_module = env['ir.module.module'].search([('name', '=', 'sale')])
if sale_module and sale_module.state == 'installed':
    print("✅ Module 'sale' est installé")
else:
    print("⚠️  Module 'sale' n'est pas installé")

# 3. Activer les variantes dans les paramètres
# Note: Dans Odoo 18.0, les variantes sont activées par défaut si le module product est installé
# Il n'y a plus de flag spécifique à activer comme dans les versions précédentes

# 4. Créer un exemple d'attribut (optionnel)
print("\n📋 Création d'un exemple d'attribut 'Couleur'...")

# Vérifier si l'attribut existe déjà
color_attr = env['product.attribute'].search([('name', '=', 'Couleur')], limit=1)

if not color_attr:
    # Créer l'attribut Couleur
    color_attr = env['product.attribute'].create({
        'name': 'Couleur',
        'sequence': 1,
        'create_variant': 'always',  # Créer une variante pour chaque valeur
    })
    print(f"✅ Attribut 'Couleur' créé (ID: {color_attr.id})")

    # Créer des valeurs pour l'attribut
    colors = ['Rouge', 'Bleu', 'Vert', 'Noir', 'Blanc']
    for color in colors:
        env['product.attribute.value'].create({
            'name': color,
            'attribute_id': color_attr.id,
        })
    print(f"✅ {len(colors)} valeurs de couleur créées")
else:
    print(f"ℹ️  Attribut 'Couleur' existe déjà (ID: {color_attr.id})")

# 5. Créer un exemple d'attribut Taille (optionnel)
print("\n📋 Création d'un exemple d'attribut 'Taille'...")

size_attr = env['product.attribute'].search([('name', '=', 'Taille')], limit=1)

if not size_attr:
    size_attr = env['product.attribute'].create({
        'name': 'Taille',
        'sequence': 2,
        'create_variant': 'always',
    })
    print(f"✅ Attribut 'Taille' créé (ID: {size_attr.id})")

    sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    for size in sizes:
        env['product.attribute.value'].create({
            'name': size,
            'attribute_id': size_attr.id,
        })
    print(f"✅ {len(sizes)} valeurs de taille créées")
else:
    print(f"ℹ️  Attribut 'Taille' existe déjà (ID: {size_attr.id})")

# Valider les changements
env.cr.commit()

print("\n" + "="*50)
print("✅ Configuration des variantes de produits terminée!")
print("="*50)
print("\n📝 Prochaines étapes:")
print("1. Allez dans Inventaire → Produits → Produits")
print("2. Créez ou ouvrez un produit")
print("3. Onglet 'Attributs & Variantes'")
print("4. Ajoutez les attributs Couleur et/ou Taille")
print("5. Les variantes seront créées automatiquement")
print("\n💡 Astuce: Vous pouvez configurer les prix et stocks par variante")
