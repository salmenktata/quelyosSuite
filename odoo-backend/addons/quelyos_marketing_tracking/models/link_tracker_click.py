# -*- coding: utf-8 -*-
"""
Tracking détaillé clics liens emails.

Enregistre chaque clic individuel avec :
- Lien cliqué
- Destinataire (via mailing.trace)
- Date/heure clic
- User-agent navigateur
"""

from odoo import models, fields


class LinkTrackerClick(models.Model):
    _name = 'quelyos.link.tracker.click'
    _description = 'Clic Lien Email Marketing'
    _order = 'click_date desc'

    trace_id = fields.Many2one(
        'mailing.trace',
        string='Trace Email',
        required=True,
        ondelete='cascade',
        help='Trace email associée (destinataire)'
    )
    
    link_id = fields.Many2one(
        'link.tracker',
        string='Lien Cliqué',
        required=True,
        ondelete='cascade',
        help='Lien cliqué (natif Odoo link.tracker)'
    )
    
    click_date = fields.Datetime(
        string='Date Clic',
        required=True,
        default=fields.Datetime.now,
        help='Date et heure du clic'
    )
    
    # Métadonnées techniques
    user_agent = fields.Char(
        string='User-Agent',
        help='Navigateur utilisé pour le clic'
    )
    
    ip_address = fields.Char(
        string='Adresse IP',
        help='IP origine du clic (anonymisée)'
    )
    
    # Champs calculés pour reporting
    campaign_id = fields.Many2one(
        'mailing.mailing',
        string='Campagne',
        related='trace_id.mass_mailing_id',
        store=True,
        help='Campagne marketing associée'
    )
    
    contact_email = fields.Char(
        string='Email Contact',
        related='trace_id.email',
        store=True,
        help='Email destinataire'
    )
    
    link_url = fields.Char(
        string='URL Lien',
        related='link_id.url',
        store=True,
        help='URL complète du lien'
    )
