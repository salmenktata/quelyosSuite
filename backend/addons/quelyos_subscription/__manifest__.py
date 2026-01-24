# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Subscription',
    'version': '19.0.1.0.13',
    'category': 'Sales/Subscription',
    'summary': 'Gestion des abonnements SaaS Quelyos',
    'description': """
        Module de gestion des abonnements pour Quelyos ERP en mode SaaS.

        Fonctionnalités:
        - Plans d'abonnement (Starter, Pro, Enterprise)
        - Gestion des abonnements clients
        - Système de quotas et limitations
        - Intégration Stripe Subscriptions
        - Webhooks Stripe
        - API REST pour frontend/backoffice
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'sale',
        'product',
        'account',
        'mail',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/subscription_plan_data.xml',
        'views/subscription_views.xml',
        'views/subscription_plan_views.xml',
        'views/menu_views.xml',
    ],
    'demo': [
        'data/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}
