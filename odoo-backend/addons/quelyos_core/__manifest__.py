# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Core',
    'version': '19.0.1.0.0',
    'category': 'Quelyos',
    'summary': 'Module de base Quelyos - Installe les prérequis',
    'description': """
        Quelyos Core
        ============
        Module fondamental qui installe automatiquement tous les prérequis
        nécessaires pour le projet Quelyos :

        - Gestion des ventes (sale_management)
        - Gestion des programmes de fidélité et promotions (loyalty)
        - Gestion du stock (stock)
        - Gestion des contacts (contacts)
        - Gestion des livraisons (delivery)

        Ce module doit être installé en premier avant quelyos_api.
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'sale_management',
        'loyalty',
        'stock',
        'contacts',
        'delivery',
    ],
    'data': [
        'data/config_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'sequence': 1,
}
