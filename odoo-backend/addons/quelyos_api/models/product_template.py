# -*- coding: utf-8 -*-
from odoo import models, fields


class ProductTemplate(models.Model):
    """Extension du modèle product.template pour les fonctionnalités e-commerce."""
    _inherit = 'product.template'

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
