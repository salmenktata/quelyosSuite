# -*- coding: utf-8 -*-
{
    'name': 'Quelyos E-commerce API',
    'version': '19.0.1.0.0',
    'category': 'Quelyos',
    'summary': 'API REST pour e-commerce headless avec Next.js',
    'description': """
        Module e-commerce Quelyos
        ========================

        API REST complète pour frontend headless:
        - Authentification Portal Odoo native
        - Catalogue produits avec filtres avancés
        - Gestion panier et checkout
        - Espace client complet
        - Wishlist et comparateur produits
        - Webhooks temps réel
        - Optimisations SEO (slugs, metadata)

        Compatible avec frontend Next.js 14
    """,
    'author': 'Quelyos',
    'website': 'https://www.quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'web',
        'sale',
        'sale_management',
        'stock',
        'portal',
        'payment',
        'delivery',
        'product',
        'quelyos_branding',
        'quelyos_frontend',  # Configuration frontend
    ],
    'sequence': 10,  # Après tous les modules Quelyos
    'data': [
        'security/ir.model.access.csv',
        'data/ecommerce_config.xml',
        # 'data/email_templates.xml',  # TODO: Fix XML validation for Odoo 19
        'views/ecommerce_config_views.xml',
        'views/product_views.xml',
        'views/sale_order_views.xml',
        'views/menu.xml',  # Charger après les actions de base mais avant les sous-menus
        'views/wishlist_views.xml',
        'views/analytics_views.xml',
        'views/review_views.xml',
        'views/coupon_views.xml',
    ],
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
}
