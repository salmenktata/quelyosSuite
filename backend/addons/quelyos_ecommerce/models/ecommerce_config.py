# -*- coding: utf-8 -*-

from odoo import models, fields, api


class EcommerceConfig(models.Model):
    _name = 'ecommerce.config'
    _description = 'Configuration E-commerce'
    _rec_name = 'name'

    name = fields.Char('Nom Configuration', required=True, default='Configuration E-commerce')

    # REMOVED: Champs déplacés vers quelyos.frontend.config
    # - frontend_url → quelyos.frontend.config
    # - webhook_secret → quelyos.frontend.config
    # - webhook_stock_change, webhook_order_confirmed, webhook_product_updated → quelyos.frontend.config
    # - enable_wishlist, enable_comparison, enable_guest_checkout → quelyos.frontend.config
    # - products_per_page → quelyos.frontend.config

    # Configuration catalogue
    show_out_of_stock = fields.Boolean('Afficher produits en rupture', default=True)

    # Configuration panier
    cart_session_duration = fields.Integer('Durée session panier (jours)', default=7)
    min_order_amount = fields.Float('Montant minimum commande', default=0.0)

    # SEO
    default_meta_description = fields.Text('Meta description par défaut')
    enable_auto_slug = fields.Boolean('Génération automatique des slugs', default=True)

    @api.model
    def get_config(self):
        """Récupère la configuration e-commerce uniquement."""
        config = self.search([], limit=1)
        if not config:
            config = self.create({})
        return {
            'show_out_of_stock': config.show_out_of_stock,
            'cart_session_duration': config.cart_session_duration,
            'min_order_amount': config.min_order_amount,
            'default_meta_description': config.default_meta_description,
            'enable_auto_slug': config.enable_auto_slug,
        }

    @api.model
    def get_frontend_config(self):
        """Récupère la configuration frontend."""
        return self.env['quelyos.frontend.config'].get_config()

    @api.model
    def get_full_config(self):
        """Récupère la configuration complète (ecommerce + frontend)."""
        ecommerce_config = self.get_config()
        frontend_config = self.get_frontend_config()
        return {**ecommerce_config, **frontend_config}
