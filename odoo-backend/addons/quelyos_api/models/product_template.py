# -*- coding: utf-8 -*-
from odoo import models, fields, api


class ProductTemplate(models.Model):
    """Extension du modèle product.template pour les fonctionnalités e-commerce."""
    _inherit = 'product.template'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        ondelete='cascade',
        help='Tenant propriétaire de ce produit',
    )

    qty_available_unreserved = fields.Float(
        string='Stock Disponible Non Réservé',
        compute='_compute_qty_available_unreserved',
        help='Quantité totale disponible hors réservations (toutes variantes)'
    )

    @api.depends('product_variant_ids.qty_available_unreserved')
    def _compute_qty_available_unreserved(self):
        """Pour les templates, sommer le stock non réservé de toutes les variantes"""
        for template in self:
            template.qty_available_unreserved = sum(
                template.product_variant_ids.mapped('qty_available_unreserved')
            )

    # Champs marketing e-commerce
    x_is_featured = fields.Boolean(
        string='Produit vedette',
        default=False,
        help="Afficher ce produit dans la section 'Produits vedettes'"
    )
    x_is_new = fields.Boolean(
        string='Nouveau produit',
        default=False,
        help="Afficher le badge 'Nouveau' sur ce produit"
    )
    x_is_bestseller = fields.Boolean(
        string='Best-seller',
        default=False,
        help="Marquer ce produit comme best-seller"
    )
    x_offer_end_date = fields.Datetime(
        string="Fin de l'offre",
        help="Date et heure de fin de l'offre promotionnelle (affiche un compte à rebours)"
    )
    # Note: compare_list_price existe déjà nativement dans Odoo (website_sale)

    # Champs contenu enrichi
    x_technical_description = fields.Html(
        string='Description technique',
        sanitize=True,
        sanitize_overridable=True,
        help="Spécifications techniques détaillées du produit (affiché dans l'onglet Spécifications)"
    )

    # Champs statistiques
    x_view_count = fields.Integer(
        string='Nombre de vues',
        default=0,
        readonly=True,
        help="Nombre de fois que la page produit a été consultée"
    )

    # Champs tendances sociales
    x_is_trending = fields.Boolean(
        string='Produit tendance',
        default=False,
        help="Afficher ce produit dans la section 'Tendances sur les réseaux'"
    )
    x_trending_score = fields.Integer(
        string='Score tendance',
        default=0,
        help="Score de popularité (utilisé pour le tri des produits tendance)"
    )
    x_social_mentions = fields.Integer(
        string='Mentions sociales',
        default=0,
        help="Nombre de mentions sur les réseaux sociaux"
    )
