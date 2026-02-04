{
    'name': 'Quelyos Finance',
    'version': '19.0.1.2.13',
    'category': 'Quelyos/Finance',
    'summary': 'Module Finance pour Quelyos ERP - Gestion trésorerie, budgets, portefeuilles',
    'description': """
        Module Finance Quelyos
        ======================
        - Gestion des catégories (revenus/dépenses)
        - Gestion des portefeuilles de comptes
        - Gestion des flux de paiement
        - Budgets et suivi
        - Alertes de trésorerie
        - API REST pour dashboard frontend
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'account',
        'mail',
        'quelyos_api',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/mail_template_cash_alert.xml',
        'data/ir_cron_cash_alerts.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
