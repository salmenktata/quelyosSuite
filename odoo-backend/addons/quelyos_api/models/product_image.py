# -*- coding: utf-8 -*-
from odoo import models, fields


class ProductImage(models.Model):
    """Extension du modèle product.image pour supporter les images par valeur d'attribut.

    Cette extension ajoute un champ product_template_attribute_value_id qui permet
    d'associer une image à une valeur d'attribut spécifique (ex: "Rouge" sur un T-shirt)
    plutôt qu'au template entier.

    Avantages de cette approche (vs images par variante) :
    - Pas de duplication : une image "Rouge" est partagée par toutes les variantes Rouge
    - Standard e-commerce : c'est ce que font Shopify, Magento, WooCommerce
    - UX intuitive : l'utilisateur gère les images par couleur, pas par variante

    Si product_template_attribute_value_id est défini :
        → L'image est spécifique à cette valeur d'attribut
    Sinon :
        → L'image est globale au template (galerie principale)
    """
    _inherit = 'product.image'

    x_product_template_attribute_value_id = fields.Many2one(
        'product.template.attribute.value',
        string='Valeur attribut',
        ondelete='cascade',
        index=True,
        help="Si défini, cette image est spécifique à cette valeur d'attribut "
             "(ex: images pour la couleur 'Rouge'). "
             "Sinon, elle fait partie de la galerie principale du produit."
    )
