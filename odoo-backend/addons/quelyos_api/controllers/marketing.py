# -*- coding: utf-8 -*-
"""
Contrôleur Marketing & Fidélité pour l'e-commerce
"""
import logging
import json
from odoo import http
from odoo.http import request
from datetime import datetime

_logger = logging.getLogger(__name__)


class QuelyosMarketing(http.Controller):
    """API Marketing & Fidélité pour frontend e-commerce"""

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

    # ==================== AVIS PRODUITS (REVIEWS) ====================

    @http.route('/api/ecommerce/reviews/submit', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def submit_review(self, **kwargs):
        """
        Soumettre un avis produit

        Args:
            product_id (int): ID du produit
            rating (int): Note de 1 à 5
            title (str): Titre de l'avis
            comment (str): Commentaire
            author_name (str, optional): Nom de l'auteur (si invité)

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'review_id': int
            }
        """
        try:
            params = self._get_params()
            product_id = params.get('product_id')
            rating = params.get('rating')
            title = params.get('title', '')
            comment = params.get('comment', '')
            author_name = params.get('author_name')

            if not all([product_id, rating]):
                return {
                    'success': False,
                    'error': 'product_id et rating requis'
                }

            # Valider la note (1-5)
            if not (1 <= rating <= 5):
                return {
                    'success': False,
                    'error': 'La note doit être entre 1 et 5'
                }

            Product = request.env['product.template'].sudo()
            product = Product.browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit non trouvé'
                }

            # Déterminer l'auteur
            partner_id = None
            if request.session.uid:
                partner_id = request.session.uid
                Partner = request.env['res.partner'].sudo()
                partner = Partner.browse(partner_id)
                author_name = partner.name
            elif not author_name:
                return {
                    'success': False,
                    'error': 'author_name requis pour les invités'
                }

            # Stocker l'avis dans ir.config_parameter (simple)
            # Note: Dans une vraie implémentation, créer un modèle custom product.review
            import time
            review_id = int(time.time())

            IrParam = request.env['ir.config_parameter'].sudo()
            review_data = {
                'product_id': product_id,
                'partner_id': partner_id,
                'author_name': author_name,
                'rating': rating,
                'title': title,
                'comment': comment,
                'date': datetime.now().isoformat(),
                'verified': partner_id is not None  # Avis vérifié si utilisateur authentifié
            }

            review_key = f'product_review.{review_id}'
            IrParam.set_param(review_key, json.dumps(review_data))

            # Mettre à jour la liste des avis du produit
            product_reviews_key = f'product_reviews.{product_id}'
            product_reviews_raw = IrParam.get_param(product_reviews_key, '[]')
            try:
                product_reviews = json.loads(product_reviews_raw)
            except:
                product_reviews = []

            product_reviews.append(review_id)
            IrParam.set_param(product_reviews_key, json.dumps(product_reviews))

            _logger.info(f"Review {review_id} submitted for product {product_id} by {author_name}")

            return {
                'success': True,
                'message': 'Votre avis a été soumis avec succès',
                'review_id': review_id
            }

        except Exception as e:
            _logger.error(f"Submit review error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/reviews/<int:product_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_product_reviews(self, product_id, **kwargs):
        """
        Récupérer les avis d'un produit

        Args:
            product_id (int): ID du produit
            limit (int, optional): Nombre d'avis à retourner (défaut: 10)
            offset (int, optional): Offset pour pagination (défaut: 0)

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'reviews': [
                        {
                            'id': int,
                            'author_name': str,
                            'rating': int,
                            'title': str,
                            'comment': str,
                            'date': str,
                            'verified': bool
                        }
                    ],
                    'average_rating': float,
                    'total_reviews': int
                }
            }
        """
        try:
            params = self._get_params()
            limit = params.get('limit', 10)
            offset = params.get('offset', 0)

            Product = request.env['product.template'].sudo()
            product = Product.browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit non trouvé'
                }

            # Récupérer les avis depuis ir.config_parameter
            IrParam = request.env['ir.config_parameter'].sudo()
            product_reviews_key = f'product_reviews.{product_id}'
            product_reviews_raw = IrParam.get_param(product_reviews_key, '[]')

            try:
                review_ids = json.loads(product_reviews_raw)
            except:
                review_ids = []

            reviews = []
            total_rating = 0

            for review_id in review_ids[offset:offset + limit]:
                review_key = f'product_review.{review_id}'
                review_data_raw = IrParam.get_param(review_key)

                if review_data_raw:
                    try:
                        review_data = json.loads(review_data_raw)
                        reviews.append({
                            'id': review_id,
                            'author_name': review_data.get('author_name'),
                            'rating': review_data.get('rating'),
                            'title': review_data.get('title', ''),
                            'comment': review_data.get('comment', ''),
                            'date': review_data.get('date'),
                            'verified': review_data.get('verified', False)
                        })
                        total_rating += review_data.get('rating', 0)
                    except:
                        pass

            average_rating = (total_rating / len(reviews)) if reviews else 0

            _logger.info(f"Retrieved {len(reviews)} reviews for product {product_id}")

            return {
                'success': True,
                'data': {
                    'reviews': reviews,
                    'average_rating': round(average_rating, 1),
                    'total_reviews': len(review_ids)
                }
            }

        except Exception as e:
            _logger.error(f"Get product reviews error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== POPUPS MARKETING ====================

    @http.route('/api/ecommerce/popups/active', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_active_popups(self, **kwargs):
        """
        Récupérer les popups marketing actifs

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'popups': [
                        {
                            'id': int,
                            'type': str ('newsletter' | 'promotion' | 'announcement'),
                            'title': str,
                            'content': str,
                            'image_url': str,
                            'cta_text': str,
                            'cta_url': str,
                            'trigger': str ('immediate' | 'exit_intent' | 'scroll' | 'delay'),
                            'delay_seconds': int
                        }
                    ]
                }
            }
        """
        try:
            # Récupérer les popups actifs depuis ir.config_parameter
            IrParam = request.env['ir.config_parameter'].sudo()
            popups_raw = IrParam.get_param('quelyos.active_popups', '[]')

            try:
                popups = json.loads(popups_raw)
            except:
                popups = []

            # Popups par défaut si aucun configuré
            if not popups:
                popups = [
                    {
                        'id': 1,
                        'type': 'newsletter',
                        'title': 'Restez informé !',
                        'content': 'Inscrivez-vous à notre newsletter et recevez 10% de réduction sur votre première commande.',
                        'image_url': '',
                        'cta_text': 'Je m\'inscris',
                        'cta_url': '/newsletter',
                        'trigger': 'delay',
                        'delay_seconds': 30
                    }
                ]

            _logger.info(f"Retrieved {len(popups)} active popups")

            return {
                'success': True,
                'data': {
                    'popups': popups
                }
            }

        except Exception as e:
            _logger.error(f"Get active popups error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/popups/<int:popup_id>/click', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def track_popup_click(self, popup_id, **kwargs):
        """
        Tracker un clic sur un popup (analytics)

        Args:
            popup_id (int): ID du popup
            action (str): Action effectuée ('click_cta' | 'close' | 'dismiss')

        Returns:
            dict: {
                'success': bool,
                'message': str
            }
        """
        try:
            params = self._get_params()
            action = params.get('action', 'click_cta')

            # Logger le clic pour analytics
            # Dans une vraie implémentation, envoyer à un service d'analytics
            _logger.info(f"Popup {popup_id} action: {action}")

            # Incrémenter le compteur de clics
            IrParam = request.env['ir.config_parameter'].sudo()
            counter_key = f'popup_analytics.{popup_id}.{action}'
            current_count = int(IrParam.get_param(counter_key, '0'))
            IrParam.set_param(counter_key, str(current_count + 1))

            return {
                'success': True,
                'message': 'Clic enregistré'
            }

        except Exception as e:
            _logger.error(f"Track popup click error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== PROGRAMME DE FIDELITE ====================

    @http.route('/api/ecommerce/loyalty/points', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_loyalty_points(self, **kwargs):
        """
        Récupérer les points de fidélité de l'utilisateur

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'points': int,
                    'points_value': float (valeur en euros),
                    'next_tier': str,
                    'points_to_next_tier': int
                }
            }
        """
        try:
            # Vérifier l'authentification
            if not request.session.uid:
                return {
                    'success': False,
                    'error': 'Authentification requise'
                }

            Partner = request.env['res.partner'].sudo()
            partner = Partner.browse(request.session.uid)

            if not partner.exists():
                return {
                    'success': False,
                    'error': 'Utilisateur non trouvé'
                }

            # Récupérer les points de fidélité
            # Note: Odoo a un module loyalty natif, mais on peut aussi utiliser un champ custom
            # Pour simplifier, on utilise ir.config_parameter
            IrParam = request.env['ir.config_parameter'].sudo()
            points_key = f'loyalty_points.{partner.id}'
            points = int(IrParam.get_param(points_key, '0'))

            # Récupérer le ratio de conversion (configuré dans site config)
            points_ratio = float(IrParam.get_param('quelyos.loyalty_points_ratio', '100'))  # 100 points = 1€
            points_value = points / points_ratio

            # Calcul du palier suivant (exemple simplifié)
            tiers = [
                {'name': 'Bronze', 'min_points': 0},
                {'name': 'Argent', 'min_points': 1000},
                {'name': 'Or', 'min_points': 5000},
                {'name': 'Platine', 'min_points': 10000},
            ]

            current_tier = 'Bronze'
            next_tier = None
            points_to_next_tier = 0

            for i, tier in enumerate(tiers):
                if points >= tier['min_points']:
                    current_tier = tier['name']
                    if i + 1 < len(tiers):
                        next_tier = tiers[i + 1]['name']
                        points_to_next_tier = tiers[i + 1]['min_points'] - points

            _logger.info(f"Loyalty points retrieved for partner {partner.id}: {points} points")

            return {
                'success': True,
                'data': {
                    'points': points,
                    'points_value': round(points_value, 2),
                    'current_tier': current_tier,
                    'next_tier': next_tier,
                    'points_to_next_tier': points_to_next_tier
                }
            }

        except Exception as e:
            _logger.error(f"Get loyalty points error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/loyalty/redeem', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def redeem_loyalty_points(self, **kwargs):
        """
        Utiliser des points de fidélité

        Args:
            points (int): Nombre de points à utiliser
            order_id (int, optional): ID de la commande sur laquelle appliquer les points

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'discount_amount': float,
                'remaining_points': int
            }
        """
        try:
            params = self._get_params()
            points_to_redeem = params.get('points')
            order_id = params.get('order_id')

            if not points_to_redeem:
                return {
                    'success': False,
                    'error': 'points requis'
                }

            # Vérifier l'authentification
            if not request.session.uid:
                return {
                    'success': False,
                    'error': 'Authentification requise'
                }

            Partner = request.env['res.partner'].sudo()
            partner = Partner.browse(request.session.uid)

            if not partner.exists():
                return {
                    'success': False,
                    'error': 'Utilisateur non trouvé'
                }

            # Vérifier le solde de points
            IrParam = request.env['ir.config_parameter'].sudo()
            points_key = f'loyalty_points.{partner.id}'
            current_points = int(IrParam.get_param(points_key, '0'))

            if points_to_redeem > current_points:
                return {
                    'success': False,
                    'error': f'Solde insuffisant. Vous avez {current_points} points.'
                }

            # Calculer la réduction
            points_ratio = float(IrParam.get_param('quelyos.loyalty_points_ratio', '100'))
            discount_amount = points_to_redeem / points_ratio

            # Déduire les points
            new_points = current_points - points_to_redeem
            IrParam.set_param(points_key, str(new_points))

            # Si order_id fourni, appliquer la réduction à la commande
            if order_id:
                Order = request.env['sale.order'].sudo()
                order = Order.browse(order_id)

                if order.exists() and order.partner_id.id == partner.id:
                    # Créer une ligne de réduction
                    OrderLine = request.env['sale.order.line'].sudo()
                    OrderLine.create({
                        'order_id': order_id,
                        'name': f'Réduction fidélité ({points_to_redeem} points)',
                        'product_uom_qty': 1,
                        'price_unit': -discount_amount,
                    })

                    _logger.info(f"Loyalty points redeemed: {points_to_redeem} points = {discount_amount}€ on order {order_id}")

            return {
                'success': True,
                'message': f'{points_to_redeem} points utilisés avec succès',
                'discount_amount': round(discount_amount, 2),
                'remaining_points': new_points
            }

        except Exception as e:
            _logger.error(f"Redeem loyalty points error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/loyalty/balance', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_loyalty_balance(self, **kwargs):
        """
        Récupérer le solde de fidélité complet avec transactions

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'balance': int,
                    'lifetime_points': int,
                    'tier': {...},
                    'next_tier': {...},
                    'transactions': [...],
                    'program': {...}
                }
            }
        """
        try:
            if not request.session.uid:
                return {
                    'success': False,
                    'error': 'Authentification requise'
                }

            Partner = request.env['res.partner'].sudo()
            partner = Partner.browse(request.session.uid)

            if not partner.exists():
                return {
                    'success': False,
                    'error': 'Utilisateur non trouvé'
                }

            # Récupérer la company du tenant
            company = request.env['res.company'].sudo().search([
                ('partner_id', '=', partner.id)
            ], limit=1) or request.env.company

            # Récupérer le programme actif
            LoyaltyProgram = request.env['quelyos.loyalty.program'].sudo()
            program = LoyaltyProgram.search([
                ('company_id', '=', company.id),
                ('is_active', '=', True)
            ], limit=1)

            if not program:
                return {
                    'success': True,
                    'data': None,
                    'message': 'Aucun programme de fidélité actif'
                }

            # Récupérer le membre
            LoyaltyMember = request.env['quelyos.loyalty.member'].sudo()
            member = LoyaltyMember.search([
                ('partner_id', '=', partner.id),
                ('program_id', '=', program.id)
            ], limit=1)

            if not member:
                # Créer automatiquement le membre
                member = LoyaltyMember.create({
                    'partner_id': partner.id,
                    'program_id': program.id,
                })

            # Niveau actuel
            tier_data = None
            if member.level_id:
                tier_data = {
                    'id': member.level_id.id,
                    'name': member.level_id.name,
                    'color': member.level_id.color,
                    'discount_percentage': member.level_id.discount_percent,
                    'points_threshold': member.level_id.min_points,
                }

            # Niveau suivant
            next_tier_data = None
            levels = program.level_ids.sorted('min_points')
            for level in levels:
                if level.min_points > member.total_points_earned:
                    next_tier_data = {
                        'id': level.id,
                        'name': level.name,
                        'points_threshold': level.min_points,
                        'points_needed': level.min_points - member.total_points_earned,
                    }
                    break

            # Transactions récentes
            transactions = []
            for txn in member.transaction_ids[:20]:
                transactions.append({
                    'id': txn.id,
                    'points': txn.points if txn.transaction_type == 'earn' else -txn.points,
                    'description': txn.description or '',
                    'type': txn.transaction_type,
                    'date': txn.create_date.isoformat() if txn.create_date else None,
                    'order_id': txn.order_id.id if txn.order_id else None,
                    'order_name': txn.order_id.name if txn.order_id else None,
                })

            # Programme info
            program_data = {
                'points_per_euro': program.points_per_currency,
                'points_to_euro_rate': int(1 / program.points_value) if program.points_value else 100,
                'min_order_amount': 0,
            }

            return {
                'success': True,
                'data': {
                    'balance': member.current_points,
                    'lifetime_points': member.total_points_earned,
                    'tier': tier_data,
                    'next_tier': next_tier_data,
                    'transactions': transactions,
                    'program': program_data,
                }
            }

        except Exception as e:
            _logger.error(f"Get loyalty balance error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/loyalty/tiers', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_loyalty_tiers(self, **kwargs):
        """
        Récupérer les niveaux de fidélité

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'tiers': [...]
                }
            }
        """
        try:
            # Récupérer la company
            company = request.env.company

            # Récupérer le programme actif
            LoyaltyProgram = request.env['quelyos.loyalty.program'].sudo()
            program = LoyaltyProgram.search([
                ('company_id', '=', company.id),
                ('is_active', '=', True)
            ], limit=1)

            if not program:
                return {
                    'success': True,
                    'data': {'tiers': []}
                }

            tiers = []
            for level in program.level_ids.sorted('min_points'):
                tiers.append({
                    'id': level.id,
                    'name': level.name,
                    'points_threshold': level.min_points,
                    'discount_percentage': level.discount_percent,
                    'color': level.color,
                    'free_shipping': level.free_shipping,
                })

            return {
                'success': True,
                'data': {'tiers': tiers}
            }

        except Exception as e:
            _logger.error(f"Get loyalty tiers error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/loyalty/calculate', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def calculate_loyalty_points(self, **kwargs):
        """
        Calculer les points pour un montant donné

        Args:
            amount (float): Montant de la commande

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'points': int,
                    'program_active': bool
                }
            }
        """
        try:
            params = self._get_params()
            amount = params.get('amount', 0)

            # Récupérer le programme actif
            LoyaltyProgram = request.env['quelyos.loyalty.program'].sudo()
            program = LoyaltyProgram.search([
                ('company_id', '=', request.env.company.id),
                ('is_active', '=', True)
            ], limit=1)

            if not program:
                return {
                    'success': True,
                    'data': {
                        'points': 0,
                        'program_active': False
                    }
                }

            points = int(amount * program.points_per_currency)

            return {
                'success': True,
                'data': {
                    'points': points,
                    'program_active': True
                }
            }

        except Exception as e:
            _logger.error(f"Calculate loyalty points error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== NEWSLETTER ====================

    @http.route('/api/ecommerce/newsletter/subscribe', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def subscribe_newsletter(self, **kwargs):
        """
        S'abonner à la newsletter

        Args:
            email (str): Email de l'abonné
            name (str, optional): Nom de l'abonné

        Returns:
            dict: {
                'success': bool,
                'message': str
            }
        """
        try:
            params = self._get_params()
            email = params.get('email')
            name = params.get('name', '')

            if not email:
                return {
                    'success': False,
                    'error': 'Email requis'
                }

            # Valider le format email
            import re
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, email):
                return {
                    'success': False,
                    'error': 'Format email invalide'
                }

            # Vérifier si déjà abonné
            IrParam = request.env['ir.config_parameter'].sudo()
            subscriber_key = f'newsletter_subscriber.{email}'
            existing = IrParam.get_param(subscriber_key)

            if existing:
                return {
                    'success': True,
                    'message': 'Vous êtes déjà abonné à notre newsletter',
                    'already_subscribed': True
                }

            # Créer l'abonnement
            subscriber_data = {
                'email': email,
                'name': name,
                'date': datetime.now().isoformat(),
                'source': 'website'
            }

            IrParam.set_param(subscriber_key, json.dumps(subscriber_data))

            # Ajouter à la liste globale
            subscribers_list_key = 'newsletter_subscribers'
            subscribers_raw = IrParam.get_param(subscribers_list_key, '[]')
            try:
                subscribers = json.loads(subscribers_raw)
            except:
                subscribers = []

            subscribers.append(email)
            IrParam.set_param(subscribers_list_key, json.dumps(subscribers))

            _logger.info(f"Newsletter subscription: {email}")

            # TODO: Intégrer avec un service d'emailing (Mailchimp, SendGrid, etc.)

            return {
                'success': True,
                'message': 'Merci pour votre inscription ! Vous recevrez bientôt nos actualités.',
                'already_subscribed': False
            }

        except Exception as e:
            _logger.error(f"Newsletter subscribe error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }
