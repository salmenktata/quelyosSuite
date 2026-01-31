# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Marketing Tracking',
    'version': '19.0.1.0.0',
    'category': 'Marketing',
    'summary': 'Tracking avancé emails marketing - ouvertures et clics par destinataire',
    'description': """
Tracking Avancé Marketing
=========================

Fonctionnalités :
- Suivi détaillé ouvertures par destinataire (qui, quand)
- Suivi détaillé clics par destinataire (qui, quand, quel lien)
- Historique complet interactions email
- Heatmap liens cliqués
- Identification destinataires engagés/inactifs
- API REST pour dashboard frontend

Exploitation :
- Étend mailing.mailing natif Odoo 19
- Utilise mail.mail.statistics (natif)
- Ajoute tracking granulaire liens
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'mail',
        'mass_mailing',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/tracking_config.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
