# -*- coding: utf-8 -*-
"""
Modèle Template Support - Réponses pré-écrites
"""
from odoo import models, fields, api


class SupportTemplate(models.Model):
    _name = 'quelyos.support.template'
    _description = 'Template de réponse support'
    _order = 'sequence, name'

    name = fields.Char(string='Nom', required=True)
    content = fields.Html(string='Contenu', required=True)
    category = fields.Selection([
        ('technical', 'Technique'),
        ('billing', 'Facturation'),
        ('account', 'Compte'),
        ('product', 'Produit'),
        ('shipping', 'Livraison'),
        ('other', 'Autre'),
    ], string='Catégorie', default='other')
    active = fields.Boolean(string='Actif', default=True)
    sequence = fields.Integer(string='Séquence', default=10)

    # Champs de métadonnées
    company_id = fields.Many2one('res.company', string='Tenant', ondelete='cascade')
    create_uid = fields.Many2one('res.users', string='Créé par', readonly=True)
    write_uid = fields.Many2one('res.users', string='Modifié par', readonly=True)
    create_date = fields.Datetime(string='Créé le', readonly=True)
    write_date = fields.Datetime(string='Modifié le', readonly=True)

    def to_dict(self):
        """Retourne dict pour API"""
        return {
            'id': self.id,
            'name': self.name,
            'content': self.content,
            'category': self.category,
            'active': self.active,
            'sequence': self.sequence,
            'created_at': self.create_date.isoformat() if self.create_date else None,
        }
