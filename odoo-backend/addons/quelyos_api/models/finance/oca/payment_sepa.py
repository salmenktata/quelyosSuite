# -*- coding: utf-8 -*-
"""
Ordres Paiement SEPA - Quelyos Native
Adapted from OCA account-payment/account_payment_order
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api
import base64

_logger = logging.getLogger(__name__)


class QuelyosSEPAPaymentOrder(models.Model):
    """Ordre de Paiement SEPA"""
    
    _name = 'quelyos.finance.sepa_payment_order'
    _description = 'Ordre Paiement SEPA Quelyos'
    _order = 'date_planned desc'
    
    tenant_id = fields.Many2one('quelyos.tenant', required=True)
    name = fields.Char(string='Référence', required=True, default='/')
    date_planned = fields.Date(string='Date exécution prévue', required=True)
    
    payment_mode = fields.Selection([
        ('sepa_credit_transfer', 'Virement SEPA (SCT)'),
        ('sepa_direct_debit', 'Prélèvement SEPA (SDD)'),
    ], string='Mode paiement', required=True)
    
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('confirmed', 'Confirmé'),
        ('sent', 'Envoyé banque'),
        ('done', 'Terminé'),
    ], default='draft')
    
    line_ids = fields.One2many('quelyos.finance.sepa_payment_order_line', 'order_id', string='Lignes')
    
    # Fichier SEPA XML
    sepa_file = fields.Binary(string='Fichier SEPA XML', readonly=True, attachment=True)
    sepa_filename = fields.Char(string='Nom fichier', readonly=True)
    
    total_amount = fields.Monetary(string='Montant total', compute='_compute_total', currency_field='currency_id', store=True)
    currency_id = fields.Many2one('res.currency', default=lambda self: self.env.company.currency_id)
    
    @api.depends('line_ids.amount')
    def _compute_total(self):
        for record in self:
            record.total_amount = sum(line.amount for line in record.line_ids)
    
    def generate_sepa_file(self):
        """Génère le fichier SEPA XML (pain.001.001.03 ou pain.008.001.02)"""
        self.ensure_one()
        
        # Simplified SEPA XML (en production, utiliser library iso20022)
        xml_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>{self.name}</MsgId>
      <CreDtTm>{fields.Datetime.now().isoformat()}</CreDtTm>
      <NbOfTxs>{len(self.line_ids)}</NbOfTxs>
      <CtrlSum>{self.total_amount}</CtrlSum>
    </GrpHdr>
  </CstmrCdtTrfInitn>
</Document>'''
        
        xml_bytes = xml_content.encode('utf-8')
        xml_b64 = base64.b64encode(xml_bytes)
        
        filename = f"SEPA_{self.name}_{self.date_planned.strftime('%Y%m%d')}.xml"
        
        self.write({
            'sepa_file': xml_b64,
            'sepa_filename': filename,
        })
        
        return {'success': True, 'filename': filename}


class QuelyosSEPAPaymentOrderLine(models.Model):
    """Ligne d'Ordre de Paiement SEPA"""
    
    _name = 'quelyos.finance.sepa_payment_order_line'
    _description = 'Ligne Ordre SEPA'
    
    order_id = fields.Many2one('quelyos.finance.sepa_payment_order', required=True, ondelete='cascade')
    tenant_id = fields.Many2one('quelyos.tenant', related='order_id.tenant_id', store=True)
    
    partner_id = fields.Many2one('res.partner', string='Bénéficiaire', required=True)
    partner_bank_id = fields.Many2one('res.partner.bank', string='Compte bancaire')
    
    amount = fields.Monetary(string='Montant', required=True, currency_field='currency_id')
    currency_id = fields.Many2one('res.currency', related='order_id.currency_id')
    
    communication = fields.Char(string='Communication')
    invoice_id = fields.Many2one('account.move', string='Facture liée')
