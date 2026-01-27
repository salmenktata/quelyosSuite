# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Stock Advanced',
    'version': '19.0.2.1.0',
    'category': 'Inventory/Inventory',
    'summary': 'Fonctionnalités Stock Avancées Quelyos (natif)',
    'description': """
Quelyos Stock Advanced
======================

Module Stock natif Quelyos avec fonctionnalités avancées de gestion d'inventaire.

Fonctionnalités:
----------------
- **Raisons de changement** : Tracer les motifs d'ajustements de stock (casse, vol, inventaire, etc.)
- **Inventaires** : Workflow complet de comptage physique avec validation
- **Verrouillage d'emplacements** : Bloquer temporairement des emplacements (maintenance, réorganisation)
- **API REST** : Endpoints pour le backoffice Quelyos

API REST:
---------
- GET/POST /api/stock/change-reasons - Gestion des raisons de changement
- GET/POST /api/stock/inventories - Gestion des inventaires
- GET/POST /api/stock/location-locks - Gestion des verrouillages d'emplacements

Modèles:
--------
- quelyos.stock.change.reason - Raisons de changement de stock
- quelyos.stock.inventory - Entêtes d'inventaire
- quelyos.stock.inventory.line - Lignes d'inventaire
- quelyos.stock.location.lock - Verrouillage temporaire d'emplacements

Architecture:
-------------
Module 100% natif Quelyos, sans dépendances externes.
Conçu pour s'intégrer parfaitement avec le backoffice React/Vite.
    """,
    'author': 'Quelyos Development Team',
    'website': 'https://github.com/salmenktata/quelyosSuite',
    'license': 'LGPL-3',
    'depends': [
        'stock',
        'quelyos_api',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/seed_data.xml',
        'views/quelyos_stock_change_reason_views.xml',
        'views/quelyos_stock_inventory_views.xml',
        'views/quelyos_stock_location_lock_views.xml',
        'views/oca_dashboard_views.xml',
        'views/oca_module_info_views.xml',
        'views/oca_modules_wizard_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
