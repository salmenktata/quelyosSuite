# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class MenuNavigation(models.Model):
    _name = 'quelyos.menu'
    _description = 'Menu Navigation Frontend'
    _parent_name = 'parent_id'
    _parent_store = True
    _order = 'sequence, id'

    # Identification
    name = fields.Char('Nom interne', required=True)
    code = fields.Char('Code unique', required=True, help='Ex: header, footer_quick, footer_service')
    active = fields.Boolean('Actif', default=True)
    sequence = fields.Integer('Ordre', default=10)

    # Hiérarchie
    parent_id = fields.Many2one('quelyos.menu', 'Menu Parent', ondelete='cascade')
    parent_path = fields.Char(index=True)
    child_ids = fields.One2many('quelyos.menu', 'parent_id', 'Sous-menus')

    # Contenu
    label = fields.Char('Libellé affiché', required=True, translate=True)
    url = fields.Char('URL', required=True, size=255, help='Ex: /products, /about')
    icon = fields.Char('Icône (optionnel)', size=50, help='Nom icône ou emoji')
    description = fields.Text('Description', translate=True, help='Tooltip ou sous-texte')

    # Comportement
    open_new_tab = fields.Boolean('Ouvrir nouvel onglet', default=False)
    css_class = fields.Char('Classes CSS custom')

    # Sécurité
    requires_auth = fields.Boolean('Requiert authentification', default=False)

    @api.constrains('code')
    def _check_code_unique(self):
        for menu in self:
            # Code unique uniquement pour menus racines
            if not menu.parent_id:
                if self.search([('code', '=', menu.code), ('id', '!=', menu.id), ('parent_id', '=', False)], limit=1):
                    raise ValidationError(_('Le code "%s" existe déjà pour un menu racine.') % menu.code)

    def get_menu_tree(self):
        """Retourne l'arbre du menu avec enfants"""
        def build_tree(menu):
            return {
                'id': menu.id,
                'label': menu.label,
                'url': menu.url,
                'icon': menu.icon,
                'description': menu.description,
                'open_new_tab': menu.open_new_tab,
                'css_class': menu.css_class,
                'children': [build_tree(child) for child in menu.child_ids.filtered(lambda c: c.active)]
            }

        return build_tree(self)
