# -*- coding: utf-8 -*-

from odoo import models, fields, api


class CmsMenu(models.Model):
    """
    Modèle pour gérer les menus du site e-commerce.
    Inspiré de WordPress : permet de créer des menus personnalisés
    pour différentes positions (header, footer, mobile, etc.)
    """
    _name = 'cms.menu'
    _description = 'Menu CMS'
    _order = 'sequence, name'

    name = fields.Char(
        string='Nom du menu',
        required=True,
        translate=True,
        help="Nom affiché dans l'administration"
    )
    code = fields.Char(
        string='Code technique',
        required=True,
        index=True,
        help="Identifiant unique utilisé par le frontend (ex: header, footer_quick, mobile)"
    )
    description = fields.Text(
        string='Description',
        help="Description de l'emplacement et de l'utilisation de ce menu"
    )
    item_ids = fields.One2many(
        'cms.menu.item',
        'menu_id',
        string='Items du menu',
        copy=True
    )
    item_count = fields.Integer(
        string='Nombre d\'items',
        compute='_compute_item_count'
    )
    sequence = fields.Integer(
        string='Ordre',
        default=10
    )
    active = fields.Boolean(
        string='Actif',
        default=True
    )

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'Le code du menu doit être unique!')
    ]

    @api.depends('item_ids')
    def _compute_item_count(self):
        for menu in self:
            menu.item_count = len(menu.item_ids)

    def get_menu_data(self):
        """
        Retourne les données du menu formatées pour l'API.
        """
        self.ensure_one()
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'items': self._get_menu_items_tree()
        }

    def _get_menu_items_tree(self):
        """
        Retourne les items du menu sous forme d'arbre hiérarchique.
        Ne retourne que les items de premier niveau (sans parent).
        """
        root_items = self.item_ids.filtered(lambda i: not i.parent_id and i.active)
        return [item.get_item_data() for item in root_items.sorted('sequence')]


class CmsMenuItem(models.Model):
    """
    Item de menu avec support hiérarchique (sous-menus).
    Peut pointer vers : URL externe, route interne, page CMS, catégorie ou produit.
    """
    _name = 'cms.menu.item'
    _description = 'Item de menu CMS'
    _order = 'sequence, id'
    _parent_name = 'parent_id'
    _parent_store = True

    name = fields.Char(
        string='Libellé',
        required=True,
        translate=True,
        help="Texte affiché dans le menu"
    )
    menu_id = fields.Many2one(
        'cms.menu',
        string='Menu',
        required=True,
        ondelete='cascade',
        index=True
    )

    # Hiérarchie (sous-menus)
    parent_id = fields.Many2one(
        'cms.menu.item',
        string='Item parent',
        ondelete='cascade',
        index=True,
        domain="[('menu_id', '=', menu_id)]"
    )
    parent_path = fields.Char(
        index=True,
        unaccent=False
    )
    child_ids = fields.One2many(
        'cms.menu.item',
        'parent_id',
        string='Sous-menus'
    )

    # Type de lien
    link_type = fields.Selection([
        ('url', 'URL externe'),
        ('internal', 'Lien interne (route)'),
        ('page', 'Page CMS'),
        ('category', 'Catégorie produits'),
        ('product', 'Produit'),
    ], string='Type de lien', default='internal', required=True)

    # Cibles selon le type
    url = fields.Char(
        string='URL externe',
        help="URL complète (ex: https://example.com)"
    )
    internal_route = fields.Char(
        string='Route interne',
        help="Chemin relatif (ex: /products, /cart, /account)"
    )
    page_id = fields.Many2one(
        'cms.page',
        string='Page CMS',
        ondelete='set null'
    )
    category_id = fields.Many2one(
        'product.category',
        string='Catégorie',
        ondelete='set null'
    )
    product_id = fields.Many2one(
        'product.template',
        string='Produit',
        ondelete='set null'
    )

    # URL résolue (calculée)
    resolved_url = fields.Char(
        string='URL résolue',
        compute='_compute_resolved_url',
        store=True
    )

    # Affichage
    icon = fields.Char(
        string='Icône',
        help="Classe CSS de l'icône (ex: fa-home, heroicon-outline-phone)"
    )
    css_class = fields.Char(
        string='Classes CSS',
        help="Classes CSS additionnelles pour cet item"
    )
    open_in_new_tab = fields.Boolean(
        string='Ouvrir dans un nouvel onglet',
        default=False
    )
    highlight = fields.Boolean(
        string='Mettre en évidence',
        default=False,
        help="Afficher cet item avec un style spécial (ex: bouton, couleur)"
    )

    # Ordre et état
    sequence = fields.Integer(
        string='Ordre',
        default=10
    )
    active = fields.Boolean(
        string='Actif',
        default=True
    )

    # Visibilité conditionnelle
    visibility = fields.Selection([
        ('all', 'Tous les visiteurs'),
        ('authenticated', 'Utilisateurs connectés uniquement'),
        ('guest', 'Visiteurs non connectés uniquement'),
    ], string='Visibilité', default='all')

    @api.depends('link_type', 'url', 'internal_route', 'page_id', 'page_id.slug',
                 'category_id', 'product_id', 'product_id.slug')
    def _compute_resolved_url(self):
        """Calcule l'URL finale selon le type de lien."""
        for item in self:
            if item.link_type == 'url':
                item.resolved_url = item.url or '#'
            elif item.link_type == 'internal':
                item.resolved_url = item.internal_route or '#'
            elif item.link_type == 'page' and item.page_id:
                item.resolved_url = f'/pages/{item.page_id.slug}'
            elif item.link_type == 'category' and item.category_id:
                item.resolved_url = f'/products?category={item.category_id.id}'
            elif item.link_type == 'product' and item.product_id:
                slug = item.product_id.slug or str(item.product_id.id)
                item.resolved_url = f'/products/{slug}'
            else:
                item.resolved_url = '#'

    @api.onchange('link_type')
    def _onchange_link_type(self):
        """Réinitialise les champs de cible lors du changement de type."""
        if self.link_type != 'url':
            self.url = False
        if self.link_type != 'internal':
            self.internal_route = False
        if self.link_type != 'page':
            self.page_id = False
        if self.link_type != 'category':
            self.category_id = False
        if self.link_type != 'product':
            self.product_id = False

    def get_item_data(self):
        """
        Retourne les données de l'item formatées pour l'API.
        Inclut récursivement les sous-menus.
        """
        self.ensure_one()
        children = self.child_ids.filtered('active').sorted('sequence')
        return {
            'id': self.id,
            'name': self.name,
            'url': self.resolved_url,
            'link_type': self.link_type,
            'icon': self.icon,
            'css_class': self.css_class,
            'open_in_new_tab': self.open_in_new_tab,
            'highlight': self.highlight,
            'visibility': self.visibility,
            'children': [child.get_item_data() for child in children] if children else []
        }
