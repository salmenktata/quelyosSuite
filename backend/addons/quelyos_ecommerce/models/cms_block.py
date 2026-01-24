# -*- coding: utf-8 -*-

from odoo import models, fields, api


class CmsBlock(models.Model):
    """
    Bloc de contenu réutilisable.
    Inspiré de Gutenberg (WordPress) : blocs typés pour composer des pages.
    """
    _name = 'cms.block'
    _description = 'Bloc de contenu CMS'
    _order = 'name'

    name = fields.Char(
        string='Nom',
        required=True,
        help="Nom du bloc pour identification dans l'administration"
    )
    code = fields.Char(
        string='Code technique',
        required=True,
        index=True,
        help="Identifiant unique pour utilisation dans le code frontend"
    )

    block_type = fields.Selection([
        ('html', 'HTML libre'),
        ('text', 'Texte simple'),
        ('image', 'Image'),
        ('video', 'Vidéo'),
        ('button', 'Bouton'),
        ('accordion', 'Accordéon (FAQ)'),
        ('gallery', 'Galerie d\'images'),
        ('testimonial', 'Témoignage'),
        ('cta', 'Call to Action'),
        ('features', 'Liste de caractéristiques'),
        ('contact_form', 'Formulaire de contact'),
        ('newsletter', 'Inscription newsletter'),
        ('product_carousel', 'Carousel de produits'),
        ('category_grid', 'Grille de catégories'),
        ('banner', 'Bannière promotionnelle'),
        ('hero', 'Section Hero'),
        ('stats', 'Statistiques'),
        ('team', 'Équipe'),
        ('pricing', 'Tarification'),
        ('map', 'Carte Google Maps'),
    ], string='Type de bloc', default='html', required=True)

    # Contenu selon type
    content = fields.Html(
        string='Contenu HTML',
        sanitize=False,
        translate=True,
        help="Contenu HTML pour les blocs de type 'html' ou 'text'"
    )
    content_json = fields.Text(
        string='Contenu JSON',
        help="Configuration JSON pour les blocs structurés (accordion, gallery, etc.)"
    )

    # Médias
    image = fields.Binary(
        string='Image',
        help="Image principale du bloc"
    )
    image_url = fields.Char(
        string='URL Image',
        help="URL externe de l'image (alternative au champ binaire)"
    )
    video_url = fields.Char(
        string='URL Vidéo',
        help="URL de la vidéo (YouTube, Vimeo, etc.)"
    )

    # Style
    css_class = fields.Char(
        string='Classes CSS',
        help="Classes CSS additionnelles pour personnaliser l'affichage"
    )
    background_color = fields.Char(
        string='Couleur de fond',
        help="Code couleur hexadécimal (ex: #ffffff)"
    )
    text_color = fields.Char(
        string='Couleur du texte',
        help="Code couleur hexadécimal (ex: #000000)"
    )
    padding = fields.Char(
        string='Padding',
        help="Espacement interne (ex: 20px, 2rem)"
    )
    margin = fields.Char(
        string='Margin',
        help="Espacement externe (ex: 20px 0)"
    )

    # Configuration pour blocs spécifiques
    button_text = fields.Char(
        string='Texte du bouton',
        translate=True
    )
    button_url = fields.Char(
        string='URL du bouton'
    )
    button_style = fields.Selection([
        ('primary', 'Primaire'),
        ('secondary', 'Secondaire'),
        ('outline', 'Contour'),
        ('link', 'Lien'),
    ], string='Style du bouton', default='primary')

    # Pour les blocs produits
    product_ids = fields.Many2many(
        'product.template',
        string='Produits',
        help="Produits à afficher (pour carousel, grille)"
    )
    category_ids = fields.Many2many(
        'product.category',
        string='Catégories',
        help="Catégories à afficher (pour grille catégories)"
    )
    product_limit = fields.Integer(
        string='Limite produits',
        default=8,
        help="Nombre maximum de produits à afficher"
    )
    product_filter = fields.Selection([
        ('featured', 'Produits vedettes'),
        ('new', 'Nouveautés'),
        ('bestseller', 'Meilleures ventes'),
        ('sale', 'En promotion'),
        ('manual', 'Sélection manuelle'),
    ], string='Filtre produits', default='featured')

    active = fields.Boolean(
        string='Actif',
        default=True
    )

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'Le code du bloc doit être unique!')
    ]

    def get_block_data(self):
        """Retourne les données du bloc formatées pour l'API."""
        self.ensure_one()
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url', '')

        data = {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'type': self.block_type,
            'content': self.content or '',
            'content_json': self.content_json,
            'image_url': self.image_url or (
                f'{base_url}/web/image/cms.block/{self.id}/image' if self.image else None
            ),
            'video_url': self.video_url,
            'css_class': self.css_class,
            'background_color': self.background_color,
            'text_color': self.text_color,
            'padding': self.padding,
            'margin': self.margin,
        }

        # Ajouter les données spécifiques au type
        if self.block_type == 'button':
            data.update({
                'button_text': self.button_text,
                'button_url': self.button_url,
                'button_style': self.button_style,
            })

        if self.block_type in ('product_carousel', 'category_grid'):
            data.update({
                'products': self._get_products_data(),
                'categories': self._get_categories_data(),
            })

        return data

    def _get_products_data(self):
        """Récupère les produits selon le filtre configuré."""
        if self.product_filter == 'manual' and self.product_ids:
            products = self.product_ids[:self.product_limit]
        else:
            domain = [('sale_ok', '=', True), ('active', '=', True)]
            if self.product_filter == 'featured':
                domain.append(('is_featured', '=', True))
            elif self.product_filter == 'new':
                domain.append(('is_new', '=', True))
            elif self.product_filter == 'bestseller':
                domain.append(('is_bestseller', '=', True))

            products = self.env['product.template'].search(
                domain, limit=self.product_limit, order='sequence'
            )

        return [{
            'id': p.id,
            'name': p.name,
            'slug': p.slug,
            'price': p.list_price,
            'image_url': f"/web/image/product.template/{p.id}/image_256"
        } for p in products]

    def _get_categories_data(self):
        """Récupère les catégories configurées."""
        categories = self.category_ids or self.env['product.category'].search(
            [('parent_id', '=', False)], limit=8
        )
        return [{
            'id': c.id,
            'name': c.name,
            'image_url': f"/web/image/product.category/{c.id}/image_128" if hasattr(c, 'image_128') else None
        } for c in categories]


class CmsPageBlock(models.Model):
    """
    Relation entre une page et un bloc avec configuration spécifique.
    Permet de placer le même bloc sur plusieurs pages avec des configurations différentes.
    """
    _name = 'cms.page.block'
    _description = 'Bloc de page CMS'
    _order = 'sequence'

    page_id = fields.Many2one(
        'cms.page',
        string='Page',
        required=True,
        ondelete='cascade',
        index=True
    )
    block_id = fields.Many2one(
        'cms.block',
        string='Bloc',
        required=True,
        ondelete='cascade'
    )

    # Configuration spécifique à cette instance
    sequence = fields.Integer(
        string='Ordre',
        default=10
    )
    config_override = fields.Text(
        string='Configuration JSON',
        help="Surcharge la configuration du bloc pour cette page (JSON)"
    )

    # Zone de placement
    zone = fields.Selection([
        ('content', 'Contenu principal'),
        ('sidebar', 'Sidebar'),
        ('header', 'Header de page'),
        ('footer', 'Footer de page'),
        ('before_content', 'Avant le contenu'),
        ('after_content', 'Après le contenu'),
    ], string='Zone', default='content', required=True)

    active = fields.Boolean(
        string='Actif',
        default=True
    )

    # Champs liés pour affichage
    block_name = fields.Char(
        related='block_id.name',
        string='Nom du bloc'
    )
    block_type = fields.Selection(
        related='block_id.block_type',
        string='Type'
    )
