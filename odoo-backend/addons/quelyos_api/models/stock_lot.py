# -*- coding: utf-8 -*-
from odoo import models, fields, api
from datetime import datetime, timedelta


class StockLot(models.Model):
    _inherit = 'stock.lot'

    days_until_expiry = fields.Integer(
        string='Jours avant expiration',
        compute='_compute_expiry_status',
        help='Nombre de jours restants avant la date d\'expiration'
    )

    days_until_alert = fields.Integer(
        string='Jours avant alerte',
        compute='_compute_expiry_status',
        help='Nombre de jours restants avant la date d\'alerte'
    )

    days_until_removal = fields.Integer(
        string='Jours avant retrait',
        compute='_compute_expiry_status',
        help='Nombre de jours restants avant la date de retrait'
    )

    days_until_best_before = fields.Integer(
        string='Jours avant DLUO',
        compute='_compute_expiry_status',
        help='Nombre de jours restants avant la date de consommation optimale'
    )

    expiry_status = fields.Selection([
        ('ok', 'OK'),
        ('alert', 'Alerte'),
        ('removal', 'À retirer'),
        ('expired', 'Expiré'),
    ], string='Statut expiration', compute='_compute_expiry_status')

    is_expired = fields.Boolean(
        string='Expiré',
        compute='_compute_expiry_status',
        help='Le lot est expiré et ne doit plus être utilisé'
    )

    is_near_expiry = fields.Boolean(
        string='Proche expiration',
        compute='_compute_expiry_status',
        help='Le lot approche de sa date d\'expiration (alerte déclenchée)'
    )

    @api.depends('expiration_date', 'alert_date', 'removal_date', 'use_date')
    def _compute_expiry_status(self):
        """
        Calcule le statut d'expiration et les jours restants.

        Statuts :
        - expired : expiration_date dépassée
        - removal : removal_date dépassée (retirer du stock)
        - alert : alert_date dépassée (alerte)
        - ok : aucune date dépassée
        """
        today = datetime.now().date()

        for lot in self:
            # Calculer jours restants
            if lot.expiration_date:
                delta = (lot.expiration_date - today).days
                lot.days_until_expiry = delta
                lot.is_expired = delta < 0
            else:
                lot.days_until_expiry = 9999
                lot.is_expired = False

            if lot.alert_date:
                lot.days_until_alert = (lot.alert_date - today).days
                lot.is_near_expiry = (lot.alert_date - today).days <= 0
            else:
                lot.days_until_alert = 9999
                lot.is_near_expiry = False

            if lot.removal_date:
                lot.days_until_removal = (lot.removal_date - today).days
            else:
                lot.days_until_removal = 9999

            if lot.use_date:
                lot.days_until_best_before = (lot.use_date - today).days
            else:
                lot.days_until_best_before = 9999

            # Déterminer statut global
            if lot.expiration_date and lot.is_expired:
                lot.expiry_status = 'expired'
            elif lot.removal_date and lot.days_until_removal <= 0:
                lot.expiry_status = 'removal'
            elif lot.alert_date and lot.is_near_expiry:
                lot.expiry_status = 'alert'
            else:
                lot.expiry_status = 'ok'
