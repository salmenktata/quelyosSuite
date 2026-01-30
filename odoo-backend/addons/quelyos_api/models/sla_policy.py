# -*- coding: utf-8 -*-
"""
Modèle SLA Policy - Politiques de niveau de service pour tickets
"""
from odoo import models, fields, api


class SLAPolicy(models.Model):
    _name = 'quelyos.sla.policy'
    _description = 'Politique SLA Support'
    _order = 'priority_level desc, sequence'

    name = fields.Char('Nom', required=True)
    active = fields.Boolean('Actif', default=True)
    sequence = fields.Integer('Séquence', default=10)

    # Critères d'application
    priority_level = fields.Selection([
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ], string='Priorité', required=True)

    category = fields.Selection([
        ('all', 'Toutes catégories'),
        ('order', 'Problème commande'),
        ('product', 'Problème produit'),
        ('delivery', 'Problème livraison'),
        ('return', 'Demande retour'),
        ('refund', 'Demande remboursement'),
        ('payment', 'Problème paiement'),
        ('account', 'Problème compte'),
        ('technical', 'Support technique'),
        ('billing', 'Facturation/Abonnement'),
        ('feature_request', 'Demande fonctionnalité'),
        ('bug', 'Signalement bug'),
        ('question', 'Question générale'),
        ('other', 'Autre'),
    ], string='Catégorie', default='all')

    # Temps cibles (en heures)
    target_first_response = fields.Float(
        'Temps cible première réponse (h)',
        required=True,
        default=24.0,
        help='Temps maximum pour la première réponse du staff'
    )

    target_resolution = fields.Float(
        'Temps cible résolution (h)',
        required=True,
        default=72.0,
        help='Temps maximum pour résoudre le ticket'
    )

    # Seuils d'alerte
    warning_threshold = fields.Integer(
        'Seuil alerte (%)',
        default=80,
        help='Pourcentage du temps écoulé avant alerte (ex: 80% = alerte à 80% du temps écoulé)'
    )

    # Métadonnées
    company_id = fields.Many2one('res.company', string='Tenant', ondelete='cascade')
    create_uid = fields.Many2one('res.users', string='Créé par', readonly=True)
    create_date = fields.Datetime('Créé le', readonly=True)

    def to_dict(self):
        """Retourne dict pour API"""
        return {
            'id': self.id,
            'name': self.name,
            'priority_level': self.priority_level,
            'category': self.category,
            'target_first_response': self.target_first_response,
            'target_resolution': self.target_resolution,
            'warning_threshold': self.warning_threshold,
            'active': self.active,
        }

    @api.model
    def get_policy_for_ticket(self, priority, category):
        """Récupère la politique SLA applicable pour une priorité/catégorie"""
        # Recherche exacte priorité + catégorie
        policy = self.search([
            ('active', '=', True),
            ('priority_level', '=', priority),
            ('category', '=', category),
        ], limit=1)

        if not policy:
            # Recherche priorité + toutes catégories
            policy = self.search([
                ('active', '=', True),
                ('priority_level', '=', priority),
                ('category', '=', 'all'),
            ], limit=1)

        return policy
