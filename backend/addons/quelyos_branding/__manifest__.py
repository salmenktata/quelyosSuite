# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Branding',
    'version': '19.0.1.0.0',
    'category': 'Quelyos',
    'summary': 'Debranding complet d\'Odoo avec le branding Quelyos',
    'description': """
        Module de Branding Quelyos
        ===========================
        Ce module supprime complètement le branding Odoo et le remplace par
        le branding Quelyos sur toutes les interfaces:

        Fonctionnalités:
        ----------------
        - Page de connexion personnalisée avec design Quelyos
        - Interface backend brandée (navbar, menus, formulaires)
        - Favicon et logos personnalisés
        - Palette de couleurs et typographie Quelyos
        - Interface POS brandée
        - E-commerce brandé (website_sale)
        - Templates d'emails brandés
        - Suppression de toutes les références Odoo
        - Support multi-langue (fr_FR, ar_TN, en_US)

        Compatible avec Odoo 19.0 Community et Enterprise.
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        # Dépendances minimales
        'base',                 # Base Odoo
        'web',                  # Interface backend
        # Toutes les autres dépendances sont optionnelles
        # Installer website, website_sale, point_of_sale, mail selon les besoins
    ],
    'data': [
        # Module Category (charger en tout premier pour que d'autres modules puissent l'utiliser)
        'data/module_category.xml',

        # Sécurité
        'security/ir.model.access.csv',

        # Données de configuration
        'data/branding_data.xml',
        'data/remove_odoo_menus.xml',
        'data/hide_enterprise_menus.xml',

        # Assets (bundles CSS/JS) - Maintenant définis dans la clé 'assets' ci-dessous
        # 'views/assets_templates.xml',  # Désactivé - Odoo 18.0 utilise la clé 'assets' dans le manifest

        # Templates backend
        'views/webclient_templates.xml',
        # 'views/backend_templates.xml',  # Désactivé - templates n'existent plus dans Odoo 18.0

        # Login & Auth
        'views/login_templates.xml',

        # Settings view
        'views/res_config_settings_views.xml',

        # Vues de masquage des fonctionnalités Enterprise
        # 'views/hide_enterprise_views.xml',  # DÉSACTIVÉ - Causait erreur "View types not defined tree"

        # Les templates ci-dessous sont commentés car ils dépendent de modules optionnels
        # Décommentez-les après avoir installé les modules correspondants

        # # Portal (nécessite: portal)
        # 'views/portal_templates.xml',

        # Templates website (nécessite: website, website_sale)
        # 'templates/website/layout.xml',
        # 'templates/website/header.xml',
        # 'templates/website/footer.xml',

        # Templates POS (nécessite: point_of_sale)
        # 'templates/pos/pos_templates.xml',
        # 'templates/pos/pos_receipt.xml',

        # Templates mail (module mail installé)
        # 'templates/mail/mail_notification_layout.xml',
        # 'templates/mail/signature.xml',

        # Templates reports (PDF)
        # 'templates/reports/external_layout.xml',
        # 'templates/reports/report_invoice.xml',
    ],
    'assets': {
        # Backend Assets - Chargés dans l'interface backend
        'web.assets_backend': [
            # JavaScript error handler (LOAD FIRST to catch ResizeObserver errors)
            'quelyos_branding/static/src/js/error_handler.js',

            # Variables CSS en premier
            'quelyos_branding/static/src/scss/_variables.scss',

            # Styles principaux
            'quelyos_branding/static/src/scss/quelyos_branding.scss',
            'quelyos_branding/static/src/scss/_backend.scss',
            'quelyos_branding/static/src/scss/_login.scss',

            # Masquage des fonctionnalités Enterprise
            'quelyos_branding/static/src/scss/_hide_enterprise.scss',

            # JavaScript de debranding
            'quelyos_branding/static/src/js/remove_odoo_branding.js',
            'quelyos_branding/static/src/js/hide_enterprise_features.js',
        ],

        # Frontend Assets - Chargés sur le site web public
        'web.assets_frontend': [
            'quelyos_branding/static/src/scss/_variables.scss',
            'quelyos_branding/static/src/scss/_website.scss',
        ],

        # Common Assets - Chargés partout (backend + frontend + POS)
        'web.assets_common': [
            'quelyos_branding/static/src/scss/_variables.scss',
        ],

        # POS Assets - Activé pour le branding POS
        'point_of_sale.assets': [
            'quelyos_branding/static/src/scss/_variables.scss',
            'quelyos_branding/static/src/scss/_pos.scss',
        ],

        # Report Assets - PDF styling
        'web.report_assets_common': [
            'quelyos_branding/static/src/scss/_variables.scss',
            'quelyos_branding/static/src/scss/_reports.scss',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'sequence': 1,  # Charger tôt
}
