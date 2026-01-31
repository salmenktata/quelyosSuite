# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Marketing Automation',
    'version': '19.0.1.0.0',
    'category': 'Marketing/Automation',
    'summary': 'Scénarios marketing automatisés - workflows, triggers, actions',
    'description': """
Automation Marketing
====================

Fonctionnalités :
- Workflows marketing automatisés (drip campaigns, nurturing)
- Triggers événementiels (nouvelle inscription, commande, anniversaire)
- Actions configurables (email, SMS, ajout liste, tag, score)
- Conditions de filtrage dynamiques
- Statistiques et tracking participants

Cas d'usage :
- Email bienvenue automatique
- Relances panier abandonné
- Nurturing leads (séquence emails éducatifs)
- Anniversaires clients
- Réactivation clients inactifs
- Upsell/cross-sell post-achat

Exploitation :
- Compatible Odoo 19 Community
- Intégration mass_mailing natif
- Scheduler autonome (cron)
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'mail',
        'mass_mailing',
        'sale_management',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/automation_cron.xml',
        'data/default_workflows.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
