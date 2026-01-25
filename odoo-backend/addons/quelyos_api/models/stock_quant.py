# -*- coding: utf-8 -*-
from odoo import api, fields, models
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)


class StockQuant(models.Model):
    _inherit = 'stock.quant'

    # Seuil de stock bas (par défaut 10 unités)
    LOW_STOCK_THRESHOLD = 10

    def _cron_check_low_stock(self):
        """
        Cron job : Vérifier les produits en stock bas et créer des alertes
        S'exécute toutes les 6 heures
        """
        _logger.info('=== Démarrage vérification stock bas ===')

        # Récupérer tous les quants actifs (stock disponible)
        quants = self.search([
            ('location_id.usage', '=', 'internal'),  # Emplacements internes uniquement
            ('quantity', '>', 0),  # Stock disponible
        ])

        # Grouper par produit pour avoir le total par produit
        products_stock = {}
        for quant in quants:
            product_id = quant.product_id.id
            if product_id not in products_stock:
                products_stock[product_id] = {
                    'product': quant.product_id,
                    'total_qty': 0,
                }
            products_stock[product_id]['total_qty'] += quant.quantity

        # Vérifier quels produits sont sous le seuil
        low_stock_products = []
        for product_id, data in products_stock.items():
            product = data['product']
            total_qty = data['total_qty']

            # Utiliser le seuil défini sur le produit s'il existe, sinon le seuil par défaut
            threshold = getattr(product, 'low_stock_threshold', self.LOW_STOCK_THRESHOLD)

            if total_qty < threshold:
                low_stock_products.append({
                    'product_id': product_id,
                    'product_name': product.display_name,
                    'current_stock': total_qty,
                    'threshold': threshold,
                    'sku': product.default_code or '',
                })

        if low_stock_products:
            _logger.warning(f'Stock bas détecté pour {len(low_stock_products)} produits')

            # Envoyer notification email aux admins
            self._send_low_stock_email(low_stock_products)

            # Créer des notes internes pour traçabilité
            for product_data in low_stock_products:
                product = self.env['product.product'].browse(product_data['product_id'])
                product.message_post(
                    body=f"<p><strong>⚠️ Alerte stock bas</strong></p>"
                         f"<p>Stock actuel : {product_data['current_stock']} unités</p>"
                         f"<p>Seuil d'alerte : {product_data['threshold']} unités</p>",
                    message_type='notification',
                    subtype_xmlid='mail.mt_note',
                )
        else:
            _logger.info('Aucun produit en stock bas détecté')

        return True

    def _send_low_stock_email(self, low_stock_products):
        """
        Envoyer un email récapitulatif des stocks bas aux admins
        """
        # Récupérer tous les utilisateurs admin
        admins = self.env['res.users'].search([
            ('groups_id', 'in', self.env.ref('base.group_system').id)
        ])

        if not admins:
            _logger.warning('Aucun administrateur trouvé pour envoyer les alertes stock')
            return

        # Construire le corps de l'email
        products_html = '<ul>'
        for product in low_stock_products:
            products_html += f"""
            <li>
                <strong>{product['product_name']}</strong>
                {f"(Réf: {product['sku']})" if product['sku'] else ''}
                <br/>
                Stock actuel : <span style="color: #d97706; font-weight: bold;">{product['current_stock']}</span> unités
                (Seuil : {product['threshold']})
            </li>
            """
        products_html += '</ul>'

        body_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px;">
                ⚠️ Alerte Stock Bas - Quelyos ERP
            </h2>
            <p>Bonjour,</p>
            <p>
                <strong>{len(low_stock_products)}</strong> produit(s) sont actuellement en stock bas
                et nécessitent un réapprovisionnement :
            </p>
            {products_html}
            <p style="margin-top: 30px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #d97706;">
                <strong>Action recommandée :</strong><br/>
                Veuillez créer des bons de commande fournisseurs pour réapprovisionner ces produits.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Cette alerte est envoyée automatiquement par le système Quelyos ERP.
            </p>
        </div>
        """

        # Créer et envoyer l'email
        mail_values = {
            'subject': f'⚠️ Alerte Stock Bas - {len(low_stock_products)} produit(s) concerné(s)',
            'body_html': body_html,
            'email_from': self.env.company.email or 'noreply@quelyos.com',
            'email_to': ','.join(admins.mapped('email')),
        }

        mail = self.env['mail.mail'].sudo().create(mail_values)
        mail.send()

        _logger.info(f'Email d\'alerte stock envoyé à {len(admins)} administrateur(s)')


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # Champ pour définir un seuil personnalisé par produit
    low_stock_threshold = fields.Float(
        string='Seuil stock bas',
        default=10.0,
        help='Seuil en dessous duquel une alerte de stock bas sera déclenchée'
    )
