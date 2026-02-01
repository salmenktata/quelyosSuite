# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Core',
    'version': '19.0.1.5.0',
    'category': 'Quelyos/Core',
    'summary': 'Module orchestrateur - Installation automatique Quelyos Suite',
    'description': """
        Module Orchestrateur Quelyos Core
        ==================================

        Ce module minimal sert d'orchestrateur pour l'installation automatique
        de la suite complète Quelyos.

        Rôle :
        ------
        - auto_install=True : S'installe automatiquement lors de la création
          d'une nouvelle base de données Odoo 19
        - Dépend de quelyos_api : Déclenche l'installation complète de la suite
        - Aucune fonctionnalité propre : Module purement technique

        Conformité :
        ------------
        - Conforme à ODOO_ISOLATION_RULES.md
        - Seul module Quelyos autorisé avec auto_install=True
        - Ne modifie aucun comportement Odoo core
        - Installation/désinstallation propre sans impact

        Architecture :
        --------------
        quelyos_core (orchestrateur, auto_install=True)
            └─> quelyos_api (suite complète)
                └─> 14 modules Odoo Community
                └─> 2 modules OCA (stock_inventory, stock_warehouse_calendar)
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'quelyos_api',  # Déclenche installation suite complète
    ],
    'data': [
        'data/installer_config_data.xml',  # Config modules optionnels + désactivation tours Odoo
        'data/config_data.xml',             # Configuration système additionnelle
        'data/module_category_data.xml',    # Catégories modules Quelyos
    ],
    'post_init_hook': 'post_init_hook',  # Configuration automatique après installation
    'installable': True,
    'application': False,  # Pas une application visible
    'auto_install': True,  # ✅ INSTALLATION AUTOMATIQUE (seul module autorisé)
}
