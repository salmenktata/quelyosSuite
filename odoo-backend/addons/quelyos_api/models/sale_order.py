# -*- coding: utf-8 -*-
from odoo import api, fields, models
from datetime import datetime, timedelta
import logging
import secrets

_logger = logging.getLogger(__name__)


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        ondelete='cascade',
        help='Tenant propriétaire de cette commande',
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # PANIER ABANDONNÉ - Alias DEPRECATED (Q4 2026)
    # ═══════════════════════════════════════════════════════════════════════════

    recovery_token = fields.Char(
        related='x_recovery_token',
        readonly=False,
        store=False,
        help='[DEPRECATED] Utiliser x_recovery_token'
    )

    recovery_email_sent_date = fields.Datetime(
        related='x_recovery_email_sent_date',
        readonly=False,
        store=False,
        help='[DEPRECATED] Utiliser x_recovery_email_sent_date'
    )

    can_fulfill_now = fields.Boolean(
        related='x_can_fulfill_now',
        readonly=True,
        store=False,
        help='[DEPRECATED] Utiliser x_can_fulfill_now'
    )

    expected_fulfillment_date = fields.Date(
        related='x_expected_fulfillment_date',
        readonly=True,
        store=False,
        help='[DEPRECATED] Utiliser x_expected_fulfillment_date'
    )

    missing_stock_details = fields.Text(
        related='x_missing_stock_details',
        readonly=True,
        store=False,
        help='[DEPRECATED] Utiliser x_missing_stock_details'
    )

    fulfillment_priority = fields.Selection(
        related='x_fulfillment_priority',
        readonly=True,
        store=False,
        help='[DEPRECATED] Utiliser x_fulfillment_priority'
    )

    # Token de récupération sécurisé pour le lien email
    x_recovery_token = fields.Char(
        string='Token de récupération',
        copy=False,
        help='Token sécurisé pour récupérer le panier abandonné via email'
    )

    # Date d'envoi email de relance
    x_recovery_email_sent_date = fields.Datetime(
        string='Email relance envoyé le',
        copy=False,
        help='Date d\'envoi de l\'email de récupération de panier abandonné'
    )

    # Late Availability (disponibilité future du stock)
    x_can_fulfill_now = fields.Boolean(
        string='Peut être honorée maintenant',
        compute='_compute_fulfillment_status',
        store=True,
        help='Tous les produits sont disponibles en stock'
    )

    x_expected_fulfillment_date = fields.Date(
        string='Date de disponibilité estimée',
        compute='_compute_fulfillment_status',
        store=True,
        help='Date à laquelle tous les produits seront disponibles'
    )

    x_missing_stock_details = fields.Text(
        string='Détails stock manquant',
        compute='_compute_fulfillment_status',
        store=True,
        help='JSON avec détails des produits en rupture et dates de réapprovisionnement'
    )

    x_fulfillment_priority = fields.Selection([
        ('immediate', 'Immédiat (stock complet)'),
        ('short', 'Court terme (< 7 jours)'),
        ('medium', 'Moyen terme (7-30 jours)'),
        ('long', 'Long terme (> 30 jours)'),
        ('backorder', 'Rupture (aucune date)'),
    ], string='Priorité de traitement', compute='_compute_fulfillment_status', store=True)

    @api.depends('order_line.product_id', 'order_line.product_uom_qty', 'state')
    def _compute_fulfillment_status(self):
        """
        Calculer la disponibilité future du stock pour cette commande.

        Analyse chaque ligne de commande et détermine :
        - Si la commande peut être honorée maintenant (stock suffisant)
        - La date estimée de disponibilité complète
        - Les détails des produits manquants
        - La priorité de traitement
        """
        import json
        from datetime import date, timedelta

        for order in self:
            # Ne calculer que pour les commandes confirmées ou en draft
            if order.state in ['cancel', 'done']:
                order.x_can_fulfill_now = False
                order.x_expected_fulfillment_date = False
                order.x_missing_stock_details = '{}'
                order.x_fulfillment_priority = 'backorder'
                continue

            missing_products = []
            latest_availability_date = None
            all_available = True

            for line in order.order_line:
                product = line.product_id
                qty_needed = line.product_uom_qty

                # Vérifier stock disponible (hors réservations manuelles)
                qty_available = product.qty_available_after_manual_reservations

                if qty_available < qty_needed:
                    all_available = False
                    qty_missing = qty_needed - qty_available

                    # Estimer date de disponibilité
                    # Stratégie simple : vérifier s'il y a des achats/fabrications planifiés
                    # Pour MVP, utiliser une estimation basée sur le lead time du fournisseur
                    estimated_days = self._estimate_restock_days(product)
                    estimated_date = date.today() + timedelta(days=estimated_days)

                    if not latest_availability_date or estimated_date > latest_availability_date:
                        latest_availability_date = estimated_date

                    missing_products.append({
                        'product_id': product.id,
                        'product_name': product.display_name,
                        'sku': product.default_code or '',
                        'qty_needed': qty_needed,
                        'qty_available': qty_available,
                        'qty_missing': qty_missing,
                        'estimated_date': estimated_date.isoformat() if estimated_date else None,
                        'estimated_days': estimated_days,
                    })

            # Définir résultats
            order.x_can_fulfill_now = all_available
            order.x_expected_fulfillment_date = latest_availability_date
            order.x_missing_stock_details = json.dumps(missing_products, ensure_ascii=False)

            # Déterminer priorité
            if all_available:
                order.x_fulfillment_priority = 'immediate'
            elif latest_availability_date:
                days_until = (latest_availability_date - date.today()).days
                if days_until <= 7:
                    order.x_fulfillment_priority = 'short'
                elif days_until <= 30:
                    order.x_fulfillment_priority = 'medium'
                else:
                    order.x_fulfillment_priority = 'long'
            else:
                order.x_fulfillment_priority = 'backorder'

    def _estimate_restock_days(self, product):
        """
        Estimer le nombre de jours avant réapprovisionnement.

        Stratégie :
        1. Vérifier s'il y a des purchase.order en cours pour ce produit
        2. Sinon, utiliser le lead time du fournisseur principal
        3. Par défaut : 14 jours
        """
        # Vérifier purchase orders en cours (state = 'purchase')
        # NOTE: Module purchase optionnel, vérifier existence du modèle
        if 'purchase.order.line' in self.env:
            PurchaseOrderLine = self.env['purchase.order.line'].sudo()
            incoming_purchases = PurchaseOrderLine.search([
                ('product_id', '=', product.id),
                ('order_id.state', 'in', ['draft', 'sent', 'to approve', 'purchase']),
            ], order='date_planned asc', limit=1)

            if incoming_purchases and incoming_purchases.date_planned:
                days_until = (incoming_purchases.date_planned.date() - date.today()).days
                return max(0, days_until)

        # Utiliser lead time fournisseur
        if product.seller_ids:
            # Prendre le premier fournisseur
            seller = product.seller_ids[0]
            return seller.delay if seller.delay else 14

        # Par défaut
        return 14

    def _cron_abandoned_cart_recovery(self):
        """
        Cron job : Détecter les paniers abandonnés et envoyer des emails de relance
        S'exécute toutes les heures

        Critères panier abandonné :
        - État 'draft' (devis non confirmé)
        - Créé il y a plus de 24h
        - Modifié il y a plus de 24h
        - Aucun email de relance déjà envoyé
        - Au moins 1 ligne de commande
        - Client avec email valide
        """
        _logger.info('=== Démarrage détection paniers abandonnés ===')

        # Date limite : 24h avant maintenant
        cutoff_date = datetime.now() - timedelta(hours=24)

        # Rechercher les paniers abandonnés
        abandoned_carts = self.search([
            ('state', '=', 'draft'),  # Devis non confirmé
            ('create_date', '<', cutoff_date),  # Créé il y a plus de 24h
            ('write_date', '<', cutoff_date),  # Pas modifié depuis 24h
            ('recovery_email_sent_date', '=', False),  # Aucun email déjà envoyé
            ('order_line', '!=', False),  # Au moins 1 produit
            ('partner_id.email', '!=', False),  # Email valide
        ])

        _logger.info(f'{len(abandoned_carts)} panier(s) abandonné(s) détecté(s)')

        # Envoyer un email pour chaque panier
        success_count = 0
        for cart in abandoned_carts:
            try:
                # Générer un token de récupération sécurisé
                if not cart.recovery_token:
                    cart.recovery_token = secrets.token_urlsafe(32)

                # Envoyer l'email de relance
                self._send_abandoned_cart_email(cart)

                # Marquer comme envoyé
                cart.recovery_email_sent_date = fields.Datetime.now()

                success_count += 1
            except Exception as e:
                _logger.error(f'Erreur envoi email panier abandonné #{cart.id}: {str(e)}')

        _logger.info(f'{success_count} email(s) de relance envoyé(s) avec succès')
        return True

    def _send_abandoned_cart_email(self, cart):
        """
        Envoyer un email de relance pour un panier abandonné
        """
        # Construire l'URL de récupération
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        recovery_url = f"{base_url}/cart/recover?token={cart.recovery_token}"

        # Calculer le total du panier
        total = cart.amount_total
        currency_symbol = cart.currency_id.symbol or '€'

        # Construire la liste des produits
        products_html = ''
        for line in cart.order_line[:5]:  # Max 5 produits dans l'email
            product_image_url = f"{base_url}/web/image/product.product/{line.product_id.id}/image_128"
            products_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                    <img src="{product_image_url}" alt="{line.product_id.name}"
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; vertical-align: middle; margin-right: 10px;">
                    <span style="vertical-align: middle; font-weight: 500;">{line.product_id.name}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                    {int(line.product_uom_qty)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
                    {line.price_subtotal:.2f} {currency_symbol}
                </td>
            </tr>
            """

        if len(cart.order_line) > 5:
            products_html += f"""
            <tr>
                <td colspan="3" style="padding: 10px; text-align: center; color: #6b7280; font-style: italic;">
                    ... et {len(cart.order_line) - 5} autre(s) produit(s)
                </td>
            </tr>
            """

        # Template email HTML responsive
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; padding: 20px;">
                <tr>
                    <td align="center">
                        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                                        🛒 Votre panier vous attend !
                                    </h1>
                                    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                                        Vous avez oublié quelque chose...
                                    </p>
                                </td>
                            </tr>

                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                        Bonjour <strong>{cart.partner_id.name}</strong>,
                                    </p>
                                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                        Nous avons remarqué que vous avez laissé des articles dans votre panier.
                                        Bonne nouvelle : ils sont toujours disponibles !
                                    </p>

                                    <!-- Cart Summary -->
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                        <thead>
                                            <tr style="background-color: #f9fafb;">
                                                <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; font-size: 14px; text-transform: uppercase;">Produit</th>
                                                <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600; font-size: 14px; text-transform: uppercase;">Qté</th>
                                                <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600; font-size: 14px; text-transform: uppercase;">Prix</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products_html}
                                        </tbody>
                                        <tfoot>
                                            <tr style="background-color: #f9fafb;">
                                                <td colspan="2" style="padding: 15px; text-align: right; font-weight: 700; font-size: 16px; color: #111827;">
                                                    Total :
                                                </td>
                                                <td style="padding: 15px; text-align: right; font-weight: 700; font-size: 18px; color: #6366f1;">
                                                    {total:.2f} {currency_symbol}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <!-- CTA Button -->
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td align="center" style="padding: 20px 0;">
                                                <a href="{recovery_url}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);">
                                                    🛍️ Finaliser ma commande
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                        Ce lien est valable pendant 7 jours.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                    <p style="color: #9ca3af; font-size: 13px; margin: 0 0 10px 0;">
                                        Des questions ? Nous sommes là pour vous aider !
                                    </p>
                                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                        Cet email a été envoyé automatiquement par Quelyos ERP.<br/>
                                        Si vous ne souhaitez plus recevoir ces notifications, contactez-nous.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        # Créer et envoyer l'email
        mail_values = {
            'subject': f'🛒 Votre panier vous attend - {total:.2f} {currency_symbol}',
            'body_html': body_html,
            'email_from': self.env.company.email or 'noreply@quelyos.com',
            'email_to': cart.partner_id.email,
            'reply_to': self.env.company.email or 'support@quelyos.com',
        }

        mail = self.env['mail.mail'].sudo().create(mail_values)
        mail.send()

        # Créer une note interne pour traçabilité
        cart.message_post(
            body=f"<p>📧 <strong>Email de récupération panier abandonné envoyé</strong></p>"
                 f"<p>Destinataire : {cart.partner_id.email}</p>"
                 f"<p>Total panier : {total:.2f} {currency_symbol}</p>"
                 f"<p>Nombre de produits : {len(cart.order_line)}</p>",
            message_type='notification',
            subtype_xmlid='mail.mt_note',
        )

        _logger.info(f'Email de récupération envoyé pour le panier #{cart.id} ({cart.partner_id.email})')
