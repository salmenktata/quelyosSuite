# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Stock Advanced',
    'version': '19.0.1.0.0',
    'category': 'Inventory/Inventory',
    'summary': 'Fonctionnalités Stock Avancées Quelyos (wrapper OCA)',
    'description': """
Quelyos Stock Advanced
======================

Module wrapper qui intègre les fonctionnalités OCA Stock dans l'écosystème Quelyos.

Fonctionnalités Incluses:
--------------------------
- Raisons de changement de quantité (stock_change_qty_reason)
- Inventaires améliorés (stock_inventory)
- Verrouillage d'emplacements (stock_location_lockdown)
- Estimation de la demande (stock_demand_estimate)

API REST:
---------
- /api/stock/change-reasons - Liste des raisons de changement
- /api/stock/adjust-with-reason - Ajustement avec raison
- /api/stock/inventories-oca - Liste des inventaires OCA
- /api/stock/location-locks - Liste des emplacements verrouillés
- /api/stock/location/<id>/lock - Verrouiller/déverrouiller emplacement

Architecture:
-------------
Ce module wrapper permet de :
1. Garder les modules OCA séparés et maintenables
2. Ajouter des personnalisations Quelyos par-dessus
3. Exposer une API REST unifiée pour le frontend

Modules OCA Requis:
-------------------
- stock_change_qty_reason (19.0)
- stock_inventory (19.0)
- stock_location_lockdown (19.0)
- stock_demand_estimate (19.0)

Note: Les modules OCA 18.0 ont été adaptés pour Odoo 19.0.
Voir docs/OCA_PATCHES_19.md pour détails.
    """,
    'author': 'Quelyos Development Team',
    'website': 'https://github.com/salmenktata/quelyosSuite',
    'license': 'LGPL-3',
    'depends': [
        'stock',
        'quelyos_api',
        'stock_change_qty_reason',
        'stock_inventory',
        'stock_location_lockdown',
        'stock_demand_estimate',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/oca_dashboard_views.xml',
        'views/oca_module_info_views.xml',
        'views/oca_modules_wizard_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
