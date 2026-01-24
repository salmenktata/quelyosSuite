# -*- coding: utf-8 -*-
{
    'name': 'Quelyos E-commerce API',
    'version': '19.0.3.0.0',
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
        'mail',  # Pour cms.page (mail.thread)
        'sale',
        'sale_management',
        'stock',
        'portal',
        'payment',
        'delivery',
        'product',
        'quelyos_core',  # Configuration de base
    ],
    'sequence': 10,  # Après tous les modules Quelyos
    'data': [
        'security/ir.model.access.csv',
        'data/ecommerce_config.xml',
        'data/cms_data.xml',  # Menus et pages CMS par défaut
        # 'data/email_templates.xml',  # TODO: Fix XML validation for Odoo 19
        # 'data/email_template_cart_abandoned.xml',  # TODO: Fix XML validation for Odoo 19
        # 'data/email_template_stock_alert.xml',  # TODO: Fix XML validation for Odoo 19
        # 'data/email_template_contact.xml',  # TODO: Fix XML validation for Odoo 19
        # 'data/cron_abandoned_cart.xml',  # TODO: Fix XML validation for Odoo 19
        # 'data/cron_stock_alert.xml',  # TODO: Fix XML validation for Odoo 19
        # 'data/cron_stock_reservation.xml',  # TODO: Fix XML validation for Odoo 19
        'views/ecommerce_config_views.xml',
        'views/product_views.xml',
        'views/sale_order_views.xml',
        'views/wishlist_views.xml',
        'views/analytics_views.xml',
        'views/review_views.xml',
        'views/coupon_views.xml',
        'views/seo_metadata_views.xml',
        'views/redis_config_views.xml',
        # CMS Views
        'views/cms_menu_views.xml',
        'views/cms_page_views.xml',
        'views/cms_block_views.xml',
        'views/menu.xml',  # Charger EN DERNIER après toutes les actions
    ],
    'demo': [
        'data/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
