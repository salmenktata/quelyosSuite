# -*- coding: utf-8 -*-
"""
Extension mailing.trace pour tracking détaillé.

Odoo 19 natif fournit mailing.trace avec :
- opened : bool (email ouvert)
- clicked : bool (email cliqué)
- bounced : bool (email bounce)

On ajoute :
- open_date : datetime première ouverture
- open_count : int nombre ouvertures
- click_date : datetime premier clic
- click_count : int nombre clics
- last_interaction_date : datetime dernière interaction
"""

from odoo import models, fields, api


class MailingTrace(models.Model):
    _inherit = 'mailing.trace'

    # Tracking ouvertures détaillé
    open_date = fields.Datetime(
        string='Date Première Ouverture',
        help='Date et heure de la première ouverture email'
    )
    open_count = fields.Integer(
        string='Nombre Ouvertures',
        default=0,
        help='Nombre total ouvertures (tracking pixel)'
    )
    
    # Tracking clics détaillé
    click_date = fields.Datetime(
        string='Date Premier Clic',
        help='Date et heure du premier clic sur un lien'
    )
    click_count = fields.Integer(
        string='Nombre Clics',
        default=0,
        help='Nombre total clics tous liens confondus'
    )
    
    # Métadonnées engagement
    last_interaction_date = fields.Datetime(
        string='Dernière Interaction',
        compute='_compute_last_interaction',
        store=True,
        help='Date dernière ouverture ou clic'
    )
    
    engagement_score = fields.Float(
        string='Score Engagement',
        compute='_compute_engagement_score',
        store=True,
        help='Score 0-100 basé sur ouvertures et clics'
    )
    
    #     # Relations liens cliqués
    #     link_click_ids = fields.One2many(
    #         'quelyos.link.tracker.click',
    #         'trace_id',
    #         string='Clics Liens',
    #         help='Détail clics par lien'
    #     )

    @api.depends('open_date', 'click_date')
    def _compute_last_interaction(self):
        """Calcule date dernière interaction (ouverture ou clic)."""
        for trace in self:
            dates = [d for d in [trace.open_date, trace.click_date] if d]
            trace.last_interaction_date = max(dates) if dates else False

    @api.depends('open_count', 'click_count')
    def _compute_engagement_score(self):
        """
        Score engagement 0-100 :
        - Ouverture = +20 points (max 40 pour 2+ ouvertures)
        - Clic = +30 points (max 60 pour 2+ clics)
        """
        for trace in self:
            score = 0
            # Ouvertures : 20 points première, +10 par ouverture suivante (max 40)
            if trace.open_count > 0:
                score += min(20 + (trace.open_count - 1) * 10, 40)
            # Clics : 30 points premier, +15 par clic suivant (max 60)
            if trace.click_count > 0:
                score += min(30 + (trace.click_count - 1) * 15, 60)
            
            trace.engagement_score = min(score, 100)

    def track_open(self):
        """Enregistre une ouverture email (appelé par pixel tracking)."""
        self.ensure_one()
        if not self.open_date:
            self.open_date = fields.Datetime.now()
        self.open_count += 1
        self.opened = True  # Flag natif Odoo
        return True

    def track_click(self, link_id=None):
        """Enregistre un clic sur lien (appelé par redirecteur)."""
        self.ensure_one()
        if not self.click_date:
            self.click_date = fields.Datetime.now()
        self.click_count += 1
        self.clicked = True  # Flag natif Odoo
        
        # Enregistrer clic détaillé si link_id fourni
        if link_id:
            self.env['quelyos.link.tracker.click'].create({
                'trace_id': self.id,
                'link_id': link_id,
                'click_date': fields.Datetime.now(),
            })
        
        return True
