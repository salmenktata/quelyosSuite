# -*- coding: utf-8 -*-

from odoo import models, fields, api


class EcommerceConfig(models.Model):
    _name = 'ecommerce.config'
    _description = 'Configuration E-commerce'
    _rec_name = 'name'

    name = fields.Char('Nom Configuration', required=True, default='Configuration E-commerce')

    # ========================================
    # BRAND INFORMATION
    # ========================================
    brand_name = fields.Char('Nom de la marque', default='Quelyos')
    brand_slogan = fields.Char('Slogan', default='Boutique en ligne')
    brand_description = fields.Text(
        'Description de la marque',
        default='Votre boutique en ligne de confiance'
    )
    brand_email = fields.Char('Email de contact', default='contact@quelyos.com')
    brand_phone = fields.Char('Téléphone', default='+21600000000')
    brand_whatsapp = fields.Char(
        'Numéro WhatsApp',
        default='21600000000',
        help='Numéro sans le + pour les liens WhatsApp'
    )
    contact_form_recipients = fields.Char(
        'Emails de réception (formulaire contact)',
        default='contact@quelyos.com',
        help='Adresses email qui recevront les messages du formulaire de contact. '
             'Séparez plusieurs adresses par des virgules (ex: contact@quelyos.com, support@quelyos.com)'
    )

    # ========================================
    # SOCIAL MEDIA
    # ========================================
    social_facebook = fields.Char('Facebook URL')
    social_instagram = fields.Char('Instagram URL')
    social_twitter = fields.Char('Twitter/X URL')
    social_youtube = fields.Char('YouTube URL')
    social_linkedin = fields.Char('LinkedIn URL')
    social_tiktok = fields.Char('TikTok URL')

    # ========================================
    # SHIPPING CONFIGURATION
    # ========================================
    free_shipping_threshold = fields.Float(
        'Seuil livraison gratuite',
        default=150.0,
        help='Montant minimum pour bénéficier de la livraison gratuite'
    )
    shipping_days_min = fields.Integer('Délai livraison minimum (jours)', default=2)
    shipping_days_max = fields.Integer('Délai livraison maximum (jours)', default=5)
    express_shipping_days_min = fields.Integer('Délai express minimum (jours)', default=1)
    express_shipping_days_max = fields.Integer('Délai express maximum (jours)', default=2)

    # ========================================
    # RETURNS & WARRANTY
    # ========================================
    return_window_days = fields.Integer(
        'Délai de retour (jours)',
        default=30,
        help='Nombre de jours pour retourner un produit'
    )
    refund_days_min = fields.Integer('Délai remboursement minimum (jours)', default=7)
    refund_days_max = fields.Integer('Délai remboursement maximum (jours)', default=10)
    warranty_years = fields.Integer('Durée garantie (années)', default=2)

    # ========================================
    # CUSTOMER SERVICE
    # ========================================
    cs_hours_start = fields.Integer('Heure ouverture SAV', default=9)
    cs_hours_end = fields.Integer('Heure fermeture SAV', default=18)
    cs_days = fields.Char('Jours ouvrables SAV', default='lundi au vendredi')

    # ========================================
    # CURRENCY
    # ========================================
    default_currency_code = fields.Char('Code devise', default='TND')
    default_currency_symbol = fields.Char('Symbole devise', default='TND')

    # ========================================
    # LOYALTY & PROMOTIONS
    # ========================================
    loyalty_points_ratio = fields.Float(
        'Ratio points fidélité',
        default=1.0,
        help='Points gagnés par unité monétaire dépensée'
    )
    default_discount_percent = fields.Float(
        'Réduction par défaut (%)',
        default=20.0,
        help='Pourcentage de réduction par défaut pour les promotions'
    )

    # ========================================
    # SEO & URLs
    # ========================================
    site_url = fields.Char('URL du site', default='https://quelyos.com')
    site_title = fields.Char('Titre du site', default='Quelyos E-commerce')
    site_description = fields.Text(
        'Description du site',
        default='Boutique en ligne - Découvrez notre sélection de produits de qualité'
    )
    default_meta_description = fields.Text('Meta description par défaut')
    enable_auto_slug = fields.Boolean('Génération automatique des slugs', default=True)

    # ========================================
    # CATALOGUE
    # ========================================
    show_out_of_stock = fields.Boolean('Afficher produits en rupture', default=True)

    # ========================================
    # CART
    # ========================================
    cart_session_duration = fields.Integer('Durée session panier (jours)', default=7)
    min_order_amount = fields.Float('Montant minimum commande', default=0.0)

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
    def get_site_config(self):
        """Récupère la configuration complète du site pour le frontend."""
        config = self.search([], limit=1)
        if not config:
            config = self.create({})

        return {
            'brand': {
                'name': config.brand_name or 'Quelyos',
                'slogan': config.brand_slogan or 'Boutique en ligne',
                'description': config.brand_description or '',
                'email': config.brand_email or '',
                'phone': config.brand_phone or '',
                'phoneFormatted': self._format_phone(config.brand_phone or ''),
                'whatsapp': config.brand_whatsapp or '',
                'contactFormRecipients': config.contact_form_recipients or config.brand_email or '',
            },
            'social': {
                'facebook': config.social_facebook or '',
                'instagram': config.social_instagram or '',
                'twitter': config.social_twitter or '',
                'youtube': config.social_youtube or '',
                'linkedin': config.social_linkedin or '',
                'tiktok': config.social_tiktok or '',
            },
            'shipping': {
                'freeThreshold': config.free_shipping_threshold,
                'standardDaysMin': config.shipping_days_min,
                'standardDaysMax': config.shipping_days_max,
                'expressDaysMin': config.express_shipping_days_min,
                'expressDaysMax': config.express_shipping_days_max,
            },
            'returns': {
                'windowDays': config.return_window_days,
                'refundDaysMin': config.refund_days_min,
                'refundDaysMax': config.refund_days_max,
                'warrantyYears': config.warranty_years,
            },
            'customerService': {
                'hoursStart': config.cs_hours_start,
                'hoursEnd': config.cs_hours_end,
                'days': config.cs_days or 'lundi au vendredi',
            },
            'currency': {
                'code': config.default_currency_code or 'TND',
                'symbol': config.default_currency_symbol or 'TND',
            },
            'loyalty': {
                'pointsRatio': config.loyalty_points_ratio,
                'defaultDiscountPercent': config.default_discount_percent,
            },
            'seo': {
                'siteUrl': config.site_url or '',
                'title': config.site_title or 'Quelyos E-commerce',
                'description': config.site_description or '',
            },
            'cart': {
                'sessionDuration': config.cart_session_duration,
                'minOrderAmount': config.min_order_amount,
            },
            'catalogue': {
                'showOutOfStock': config.show_out_of_stock,
            },
        }

    def _format_phone(self, phone):
        """Formate le numéro de téléphone pour l'affichage."""
        if not phone:
            return ''
        # Remove all non-digits except leading +
        import re
        cleaned = re.sub(r'[^\d+]', '', phone)
        # Format for Tunisia (+216XXXXXXXX)
        if cleaned.startswith('+216') and len(cleaned) == 12:
            return f"+216 {cleaned[4:6]} {cleaned[6:9]} {cleaned[9:]}"
        return phone

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
