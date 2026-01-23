# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Core',
    'version': '19.0.1.0.0',
    'category': 'Hidden',
    'summary': 'Quelyos ERP Core Infrastructure',
    'description': """
        Quelyos Core Module
        ===================
        Module fondamental fournissant l'infrastructure commune pour tous
        les modules Quelyos:

        Fonctionnalités:
        ----------------
        - Catégorie de module Quelyos
        - Configuration organisationnelle centralisée
        - Paramètres d'identité de l'entreprise
        - Infrastructure partagée pour tous les modules Quelyos

        Ce module doit être installé en premier avant tout autre module Quelyos.

        Compatible avec Odoo 19.0 Community et Enterprise.
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'web',
    ],
    'data': [
        # 1. Module Category (FIRST - noupdate=0 for foundational data)
        'data/module_category.xml',

        # 2. Core Configuration (noupdate=1 for defaults)
        'data/core_config.xml',

        # 3. Views
        'views/res_config_settings_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'sequence': 0,  # Load FIRST (before all other Quelyos modules)
}
