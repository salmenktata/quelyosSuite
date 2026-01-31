# -*- coding: utf-8 -*-
"""
Échéanciers Multi-dates - Quelyos Native
Adapted from OCA account-payment/account_payment_term_multi_day
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class AccountPaymentTerm(models.Model):
    _inherit = 'account.payment.term'
    
    x_multi_day_type = fields.Selection([
        ('fixed', 'Jour(s) fixe(s) du mois'),
        ('range', 'Plage de jours'),
    ], string='Type multi-jours')
    
    x_multi_day_list = fields.Char(string='Jours du mois', help="Ex: 5,15,25 pour 3 échéances")
