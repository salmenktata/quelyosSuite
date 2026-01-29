# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Core Orchestrator',
    'version': '19.0.3.4.0',
    'category': 'Quelyos/Foundation',
    'summary': 'Orchestrateur principal Quelyos Suite - Installation automatique complète',
    'description': """
        Quelyos Core Orchestrator - 100% Autonome
        ==========================================
        Module orchestrateur de la suite Quelyos qui automatise l'installation complète de l'ERP.

        **Installation en 1 clic** : Tous les modules requis sont installés automatiquement.

        Modules Odoo Standard installés (Core Odoo 19 uniquement) :
        -----------------------------------------------------------
        - Gestion des ventes (sale_management, crm, delivery, payment, loyalty)
        - Gestion du stock (stock)
        - Gestion des contacts (contacts)
        - Site web et e-commerce (website, website_sale)
        - Comptabilité de base (account)
        - Produits et catalogue (product)
        - Email marketing (mass_mailing)

        Modules Quelyos natifs (zéro dépendance OCA/tierce) :
        -----------------------------------------------------
        - **quelyos_api** : Infrastructure multi-tenant et API REST (TOUJOURS)
        - **quelyos_stock_advanced** : Inventaire avancé (remplace 3 modules OCA)
        - **quelyos_finance** : Gestion trésorerie et budgets (par défaut OUI)
        - **quelyos_sms_tn** : Notifications SMS Tunisie (par défaut OUI)

        Isolation Complète :
        -------------------
        Quelyos Suite ne dépend QUE du core Odoo 19 standard. Aucune dépendance OCA ou tierce.
        Garantit la pérennité, évite les régressions lors de mises à jour, simplifie la maintenance.

        Configuration :
        --------------
        Modifier les paramètres système dans Paramètres > Technique > Paramètres > Paramètres système :
        - quelyos.install_stock_advanced
        - quelyos.install_finance
        - quelyos.install_sms_tn

        Architecture :
        --------------
        Ce module utilise le mécanisme natif de dépendances Odoo + post_init_hook pour garantir
        un ordre d'installation correct, une configuration système optimale, et l'isolation complète.
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        # Odoo Standard Core
        'base',
        'web',
        'mail',
        'website',
        'website_sale',
        # Odoo Standard Commerce
        'sale_management',
        'product',
        'account',
        'crm',
        'delivery',
        'payment',
        'loyalty',
        # Odoo Standard Inventory
        'stock',
        'contacts',
        # Odoo Standard Marketing
        'mass_mailing',
        # Quelyos Core Infrastructure
        'quelyos_api',  # Infrastructure multi-tenant et API REST (OBLIGATOIRE)
        # ISOLATION COMPLÈTE : Aucune dépendance OCA/tierce
        # Fonctionnalités stock avancées fournies par quelyos_stock_advanced
    ],
    'data': [
        'data/module_category_data.xml',
        'data/config_data.xml',
        'data/installer_config_data.xml',
    ],
    'post_init_hook': 'post_init_hook',
    'installable': True,
    'application': True,
    'auto_install': False,
    'sequence': 1,
}
