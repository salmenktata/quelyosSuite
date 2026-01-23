# Module Quelyos Core

Module fondamental pour la plateforme Quelyos ERP.

## Description

Ce module fournit l'infrastructure de base pour tous les modules Quelyos :

- **Catégorie de module** : Définit la catégorie "Quelyos" dans laquelle tous les modules Quelyos sont organisés
- **Configuration organisationnelle** : Paramètres d'identité de l'entreprise (nom, URLs, email de contact)
- **Infrastructure partagée** : Base commune pour tous les modules Quelyos

## Installation

Ce module doit être installé **en premier** avant tous les autres modules Quelyos.

```bash
odoo-bin -d votre_db -i quelyos_core
```

## Configuration

Accessible via : **Paramètres → Technique → Paramètres système**

Ou via : **Paramètres → Général → Quelyos**

### Paramètres disponibles

- **Nom de l'entreprise** : Nom de votre organisation
- **Site web** : URL de votre site web
- **Support** : URL de votre page de support
- **Documentation** : URL de votre documentation
- **Email de contact** : Email de contact principal

## Dépendances

- `base` : Module de base Odoo
- `web` : Interface web Odoo

## Modules Dépendants

Les modules suivants dépendent de `quelyos_core` :

- `quelyos_frontend` : Frontend Next.js avec configuration
- `quelyos_branding` : Branding et personnalisation UI
- `quelyos_ecommerce` : E-commerce API et fonctionnalités

## Développement

### Structure

```
quelyos_core/
├── __init__.py
├── __manifest__.py
├── README.md
├── data/
│   ├── module_category.xml    # Catégorie Quelyos
│   └── core_config.xml        # Configuration par défaut
├── models/
│   ├── __init__.py
│   └── res_config_settings.py # Interface de configuration
├── views/
│   └── res_config_settings_views.xml
└── tests/
    ├── __init__.py
    └── test_core_config.py
```

### Tests

```bash
odoo-bin -d test_db -i quelyos_core --test-enable --stop-after-init
```

## Licence

LGPL-3

## Auteur

Quelyos - https://quelyos.com
