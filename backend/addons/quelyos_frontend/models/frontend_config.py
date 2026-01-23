# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import ValidationError


class FrontendConfig(models.Model):
    """Configuration centralisée pour les applications frontend Quelyos."""
    _name = 'quelyos.frontend.config'
    _description = 'Configuration Frontend Quelyos'

    name = fields.Char(
        'Nom Configuration',
        required=True,
        default='Configuration Frontend'
    )

    # === URLs et Connexion ===
    frontend_url = fields.Char(
        'URL Frontend',
        required=True,
        default='http://localhost:3000',
        help='URL de l\'application Next.js'
    )

    backend_url = fields.Char(
        'URL Backend',
        required=True,
        default='http://localhost:8069',
        help='URL du backend Odoo'
    )

    api_proxy_path = fields.Char(
        'Chemin Proxy API',
        default='/api/odoo',
        help='Chemin du proxy API dans Next.js'
    )

    # === Webhooks ===
    webhook_secret = fields.Char(
        'Webhook Secret',
        required=True,
        default='change_me_in_production',
        help='Secret partagé pour authentifier les webhooks'
    )

    webhook_enabled = fields.Boolean(
        'Activer Webhooks',
        default=True
    )

    webhook_endpoint = fields.Char(
        'Endpoint Webhook',
        default='/api/webhooks/odoo',
        help='Endpoint dans Next.js pour recevoir les webhooks'
    )

    webhook_stock_change = fields.Boolean(
        'Webhook Changement Stock',
        default=True
    )

    webhook_order_confirmed = fields.Boolean(
        'Webhook Commande Confirmée',
        default=True
    )

    webhook_product_updated = fields.Boolean(
        'Webhook Produit Mis à Jour',
        default=True
    )

    # === Feature Flags ===
    enable_wishlist = fields.Boolean(
        'Activer Wishlist',
        default=True
    )

    enable_comparison = fields.Boolean(
        'Activer Comparateur',
        default=True
    )

    enable_reviews = fields.Boolean(
        'Activer Avis Produits',
        default=True
    )

    enable_guest_checkout = fields.Boolean(
        'Autoriser Achat Invité',
        default=False,
        help='Permet aux visiteurs de commander sans créer de compte'
    )

    # === Configuration API ===
    products_per_page = fields.Integer(
        'Produits par Page',
        default=24,
        help='Nombre de produits affichés par page'
    )

    api_timeout = fields.Integer(
        'Timeout API (secondes)',
        default=30
    )

    # === URLs des Assets (Branding) ===
    logo_url = fields.Char(
        'URL Logo Principal',
        default='/quelyos_branding/static/src/img/logo/quelyos_logo.svg',
        help='URL du logo principal pour le frontend'
    )

    favicon_url = fields.Char(
        'URL Favicon',
        default='/quelyos_branding/static/src/img/favicon/favicon.ico'
    )

    # === Couleurs de Marque ===
    primary_color = fields.Char(
        'Couleur Principale',
        default='#01613a',
        help='Couleur primaire du thème (hex)'
    )

    secondary_color = fields.Char(
        'Couleur Secondaire',
        default='#c9c18f',
        help='Couleur secondaire du thème (hex)'
    )

    # === Singleton Pattern ===
    @api.model
    def get_config(self):
        """Récupère la configuration active (singleton)."""
        config = self.search([], limit=1)
        if not config:
            config = self.create({})
        return {
            'frontend_url': config.frontend_url,
            'backend_url': config.backend_url,
            'enable_wishlist': config.enable_wishlist,
            'enable_comparison': config.enable_comparison,
            'enable_reviews': config.enable_reviews,
            'enable_guest_checkout': config.enable_guest_checkout,
            'products_per_page': config.products_per_page,
            'logo_url': config.logo_url,
            'primary_color': config.primary_color,
            'secondary_color': config.secondary_color,
        }

    # === Validations ===
    @api.constrains('primary_color', 'secondary_color')
    def _check_color_format(self):
        """Valide le format hexadécimal des couleurs."""
        import re
        hex_pattern = r'^#[0-9A-Fa-f]{6}$'
        for record in self:
            if record.primary_color and not re.match(hex_pattern, record.primary_color):
                raise ValidationError("Couleur principale invalide (format: #RRGGBB)")
            if record.secondary_color and not re.match(hex_pattern, record.secondary_color):
                raise ValidationError("Couleur secondaire invalide (format: #RRGGBB)")

    @api.constrains('frontend_url', 'backend_url')
    def _check_url_format(self):
        """Valide le format des URLs."""
        import re
        url_pattern = r'^https?://.+'
        for record in self:
            if record.frontend_url and not re.match(url_pattern, record.frontend_url):
                raise ValidationError("URL Frontend invalide (doit commencer par http:// ou https://)")
            if record.backend_url and not re.match(url_pattern, record.backend_url):
                raise ValidationError("URL Backend invalide (doit commencer par http:// ou https://)")

    @api.constrains('products_per_page')
    def _check_products_per_page(self):
        """Valide le nombre de produits par page."""
        for record in self:
            if record.products_per_page < 1 or record.products_per_page > 100:
                raise ValidationError("Le nombre de produits par page doit être entre 1 et 100")
