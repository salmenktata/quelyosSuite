# -*- coding: utf-8 -*-
from odoo import models, fields, api

class CheckoutConfig(models.Model):
    _name = 'quelyos.checkout.config'
    _description = 'Configuration du processus de checkout'

    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, ondelete='cascade', index=True)

    # Étape 1 - Panier
    step1_label = fields.Char(string='Libellé Étape 1', default='Panier')
    step1_message = fields.Text(string='Message Étape 1', help='Message affiché au-dessus du panier')
    step1_icon = fields.Char(string='Icône Étape 1', default='🛒')

    # Étape 2 - Livraison
    step2_label = fields.Char(string='Libellé Étape 2', default='Livraison')
    step2_message = fields.Text(string='Message Étape 2', help='Message affiché au-dessus du formulaire de livraison')
    step2_icon = fields.Char(string='Icône Étape 2', default='📦')
    step2_active = fields.Boolean(string='Étape 2 Active', default=True, help='Désactiver pour passer directement au paiement')

    # Étape 3 - Paiement
    step3_label = fields.Char(string='Libellé Étape 3', default='Paiement')
    step3_message = fields.Text(string='Message Étape 3', help='Message affiché au-dessus des méthodes de paiement')
    step3_icon = fields.Char(string='Icône Étape 3', default='💳')

    # Étape 4 - Confirmation
    step4_label = fields.Char(string='Libellé Étape 4', default='Confirmation')
    step4_message = fields.Text(string='Message Étape 4', help='Message de remerciement après commande')
    step4_icon = fields.Char(string='Icône Étape 4', default='✓')

    # Configuration générale
    show_progress_bar = fields.Boolean(string='Afficher barre de progression', default=True)
    allow_guest_checkout = fields.Boolean(string='Autoriser commande invité', default=False, help='Permettre aux visiteurs de commander sans compte')
    require_phone = fields.Boolean(string='Téléphone requis', default=True)
    require_company = fields.Boolean(string='Entreprise requise', default=False)

    _sql_constraints = [
        ('tenant_unique', 'unique(tenant_id)', 'Une seule configuration checkout par tenant')
    ]

    @api.model
    def get_config_for_tenant(self, tenant_id):
        """Récupérer ou créer la configuration pour un tenant"""
        config = self.search([('tenant_id', '=', tenant_id)], limit=1)
        if not config:
            config = self.create({'tenant_id': tenant_id})
        return config
