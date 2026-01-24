# -*- coding: utf-8 -*-

from odoo import models, api, _
from odoo.exceptions import UserError
import logging

_logger = logging.getLogger(__name__)


class SubscriptionQuotaMixin(models.AbstractModel):
    """
    Mixin pour vérifier les quotas d'abonnement avant création de ressources.

    Usage:
        Hériter de ce mixin dans les modèles qui doivent vérifier les quotas,
        puis appeler check_subscription_quota() avant création.
    """
    _name = 'subscription.quota.mixin'
    _description = 'Mixin pour vérifier les quotas d\'abonnement'

    @api.model
    def check_subscription_quota(self, resource_type):
        """
        Vérifie le quota avant création d'une ressource.
        Lance une exception UserError si limite atteinte.

        :param resource_type: 'users', 'products', 'orders'
        :raises UserError: Si limite atteinte
        :return: True si quota OK
        """
        company = self.env.user.company_id

        # Chercher l'abonnement actif pour cette société
        subscription = self.env['quelyos.subscription'].search([
            ('company_id', '=', company.id),
            ('state', 'in', ['trial', 'active'])
        ], limit=1)

        if not subscription:
            # Pas d'abonnement = mode on-premise ou dev, ne pas bloquer
            _logger.warning(f"No active subscription found for company {company.name}, allowing resource creation")
            return True

        # Vérifier le quota
        is_limit_reached, current, limit = subscription.check_quota_limit(resource_type)

        if is_limit_reached:
            # Traduire le nom de la ressource
            resource_names = {
                'users': _('utilisateurs'),
                'products': _('produits'),
                'orders': _('commandes')
            }
            resource_name = resource_names.get(resource_type, resource_type)

            raise UserError(_(
                "Limite de %(resource)s atteinte (%(current)d/%(limit)d).\n\n"
                "Votre plan %(plan)s ne permet pas de créer plus de %(resource)s.\n"
                "Veuillez upgrader votre abonnement pour continuer."
            ) % {
                'resource': resource_name,
                'current': current,
                'limit': limit,
                'plan': subscription.plan_id.name
            })

        # Log si on approche de la limite (80%)
        if limit > 0:
            percentage = (current / limit) * 100
            if percentage >= 80:
                _logger.warning(
                    f"Subscription {subscription.name} is at {percentage:.1f}% of {resource_type} quota "
                    f"({current}/{limit})"
                )

        return True


# Extensions des modèles Odoo standard pour ajouter vérification quotas

class ProductTemplateWithQuota(models.Model):
    """Extension de product.template pour vérifier quota produits."""
    _inherit = 'product.template'

    @api.model_create_multi
    def create(self, vals_list):
        """Vérifie quota produits avant création."""
        # Vérifier le quota uniquement si au moins un produit va être créé
        if vals_list:
            try:
                self.env['subscription.quota.mixin'].check_subscription_quota('products')
            except UserError as e:
                # Re-lever l'exception pour bloquer la création
                raise e

        return super().create(vals_list)


class ResUsersWithQuota(models.Model):
    """Extension de res.users pour vérifier quota utilisateurs."""
    _inherit = 'res.users'

    @api.model_create_multi
    def create(self, vals_list):
        """Vérifie quota utilisateurs avant création."""
        # Compter uniquement les vrais utilisateurs (pas les portails)
        real_users = [v for v in vals_list if not v.get('share', False)]

        if real_users:
            try:
                self.env['subscription.quota.mixin'].check_subscription_quota('users')
            except UserError as e:
                # Re-lever l'exception pour bloquer la création
                raise e

        return super().create(vals_list)


class SaleOrderWithQuota(models.Model):
    """Extension de sale.order pour vérifier quota commandes."""
    _inherit = 'sale.order'

    def action_confirm(self):
        """Vérifie quota commandes avant confirmation."""
        # Vérifier uniquement pour les nouvelles commandes confirmées
        for order in self:
            if order.state in ['draft', 'sent']:
                try:
                    self.env['subscription.quota.mixin'].check_subscription_quota('orders')
                except UserError as e:
                    # Re-lever l'exception pour bloquer la confirmation
                    raise e

        return super().action_confirm()
