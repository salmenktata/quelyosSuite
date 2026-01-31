# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Maintenance (GMAO)',
    'version': '19.0.1.0.0',
    'category': 'Maintenance',
    'summary': 'Gestion Maintenance Assistée par Ordinateur',
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'mail',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/maintenance_sequence.xml',
        # 'views/maintenance_equipment_views.xml',  # TEMPORAIREMENT DÉSACTIVÉ (fichier manquant)
        # 'views/maintenance_request_views.xml',    # TEMPORAIREMENT DÉSACTIVÉ (fichier manquant)
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
