# -*- coding: utf-8 -*-
"""
Module Orchestrateur Quelyos Core

Ce module est un simple déclencheur pour l'installation automatique
de quelyos_api (la suite complète Quelyos).

Rôle : auto_install=True permet d'installer automatiquement quelyos_api
lors de l'initialisation d'une nouvelle base de données Odoo 19.
"""
from .hooks import post_init_hook
