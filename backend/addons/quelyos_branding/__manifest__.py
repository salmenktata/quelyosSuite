# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Branding',
    'version': '19.0.1.0.0',
    'category': 'Technical/Branding',
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
        # Sécurité
        'security/ir.model.access.csv',

        # Données de configuration (charger en premier)
        'data/branding_data.xml',
        'data/remove_odoo_menus.xml',

        # Assets (bundles CSS/JS) - Maintenant définis dans la clé 'assets' ci-dessous
        # 'views/assets_templates.xml',  # Désactivé - Odoo 18.0 utilise la clé 'assets' dans le manifest

        # Templates backend
        'views/webclient_templates.xml',
        # 'views/backend_templates.xml',  # Désactivé - templates n'existent plus dans Odoo 18.0

        # Login & Auth
        'views/login_templates.xml',

        # Les templates ci-dessous sont commentés car ils dépendent de modules optionnels
        # Décommentez-les après avoir installé les modules correspondants

        # # Portal (nécessite: portal)
        # 'views/portal_templates.xml',

        # # Templates website (nécessite: website, website_sale)
        # 'templates/website/layout.xml',
        # 'templates/website/header.xml',
        # 'templates/website/footer.xml',

        # # Templates POS (nécessite: point_of_sale)
        # 'templates/pos/pos_templates.xml',
        # 'templates/pos/pos_receipt.xml',

        # # Templates mail (nécessite: mail)
        # 'templates/mail/mail_notification_layout.xml',
        # 'templates/mail/signature.xml',
    ],
    'assets': {
        # Backend Assets - Chargés dans l'interface backend
        'web.assets_backend': [
            # Variables CSS en premier
            'quelyos_branding/static/src/scss/_variables.scss',

            # Styles principaux
            'quelyos_branding/static/src/scss/quelyos_branding.scss',
            'quelyos_branding/static/src/scss/_backend.scss',
            'quelyos_branding/static/src/scss/_login.scss',

            # JavaScript de debranding
            'quelyos_branding/static/src/js/remove_odoo_branding.js',
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

        # POS Assets - Désactivé temporairement (point_of_sale pas installé)
        # Décommentez après l'installation du module point_of_sale
        # 'point_of_sale.assets': [
        #     'static/src/scss/_variables.scss',
        #     'static/src/scss/_pos.scss',
        # ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'sequence': 1,  # Charger tôt
}
