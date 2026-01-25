# -*- coding: utf-8 -*-
from odoo import api, fields, models
from datetime import datetime, timedelta
import logging
import secrets

_logger = logging.getLogger(__name__)


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # Token de récupération sécurisé pour le lien email
    recovery_token = fields.Char(
        string='Token de récupération',
        copy=False,
        help='Token sécurisé pour récupérer le panier abandonné via email'
    )

    # Date d'envoi email de relance
    recovery_email_sent_date = fields.Datetime(
        string='Email relance envoyé le',
        copy=False,
        help='Date d\'envoi de l\'email de récupération de panier abandonné'
    )

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
