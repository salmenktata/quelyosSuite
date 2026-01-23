# -*- coding: utf-8 -*-
{
    'name': 'Quelyos Frontend',
    'version': '19.0.1.0.0',
    'category': 'Quelyos',
    'summary': 'Frontend Next.js avec déploiement automatisé',
    'description': """
        Module Frontend Quelyos
        =======================
        - Code source Next.js complet
        - Configuration frontend centralisée
        - Déploiement automatisé (Node.js, npm install, build)
        - Service systemd pour production
        - Génération automatique de .env.local

        Prérequis: Node.js >= 18.0

        Installation:
        -------------
        Lors de l'installation du module:
        1. Vérification Node.js >= 18
        2. Génération .env.local depuis config Odoo
        3. npm install des dépendances (~300 MB)
        4. npm run build (compilation Next.js)
        5. Installation service systemd (si sudo disponible)

        Note: L'installation peut prendre 5-10 minutes.
    """,
    'author': 'Quelyos',
    'website': 'https://quelyos.com',
    'license': 'LGPL-3',
    'depends': ['quelyos_core'],
    'data': [
        'security/ir.model.access.csv',
        'data/frontend_config.xml',
        'views/frontend_config_views.xml',
        'views/menu.xml',
    ],
    'external_dependencies': {
        'bin': ['node', 'npm'],  # Vérifie que Node.js est installé
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'sequence': 1,
    'post_init_hook': '_post_install_frontend',
}
