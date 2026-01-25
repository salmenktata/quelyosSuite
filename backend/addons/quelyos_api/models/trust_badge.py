# -*- coding: utf-8 -*-
from odoo import models, fields, api

class TrustBadge(models.Model):
    _name = 'quelyos.trust.badge'
    _description = 'Trust Badges Footer'
    _order = 'sequence, id'

    # Identification
    name = fields.Char('Nom interne', required=True)
    sequence = fields.Integer('Ordre affichage', default=10)
    active = fields.Boolean('Actif', default=True)

    # Contenu
    title = fields.Char('Titre', required=True, size=50, translate=True)
    subtitle = fields.Char('Sous-titre', size=100, translate=True)

    icon = fields.Selection([
        ('creditcard', 'Carte de crédit'),
        ('delivery', 'Livraison'),
        ('shield', 'Bouclier (sécurité)'),
        ('support', 'Support'),
    ], string='Icône', default='creditcard', required=True)
