# -*- coding: utf-8 -*-
{
    'name': 'Quelyos API',
    'version': '19.0.1.0.20',
    'category': 'Website',
    'summary': 'API REST pour frontend e-commerce et backoffice',
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'sale_management',
        'stock',
        'website',
        'website_sale',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/subscription_sequence.xml',
        'data/ir_cron_stock_alerts.xml',
        'data/ir_cron_abandoned_cart.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
