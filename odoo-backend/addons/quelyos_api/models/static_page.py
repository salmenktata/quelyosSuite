# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import re

class StaticPage(models.Model):
    _name = 'quelyos.static.page'
    _description = 'Pages Statiques'
    _order = 'name'

    # Identification
    name = fields.Char('Nom', required=True, help='Nom interne de la page')
    slug = fields.Char('Slug', required=True, help='URL de la page (ex: about-us)')
    active = fields.Boolean('Actif', default=True, tracking=True)

    # Contenu
    title = fields.Char('Titre', required=True, size=100, translate=True, 
                       help='Titre affiché en haut de page')
    subtitle = fields.Char('Sous-titre', size=200, translate=True)
    content = fields.Html('Contenu', required=True, translate=True, 
                         help='Contenu HTML de la page (éditeur WYSIWYG)')
    
    # Sidebar (optionnel)
    show_sidebar = fields.Boolean('Afficher sidebar', default=False)
    sidebar_content = fields.Html('Contenu sidebar', translate=True)

    # Mise en page
    layout = fields.Selection([
        ('default', 'Par défaut (1 colonne)'),
        ('with_sidebar', 'Avec sidebar (2 colonnes)'),
        ('full_width', 'Pleine largeur'),
        ('narrow', 'Étroit (lecture)'),
    ], string='Mise en page', default='default')

    # Image en-tête (optionnel)
    header_image_url = fields.Char('URL image en-tête', help='Image bannière haut de page')
    show_header_image = fields.Boolean('Afficher image en-tête', default=False)

    # SEO
    meta_title = fields.Char('Meta Title', size=60, help='Si vide, utilise le titre de la page')
    meta_description = fields.Text('Meta Description', size=160)
    
    # Navigation
    show_in_footer = fields.Boolean('Afficher dans footer', default=False, 
                                     help='Ajouter lien dans footer du site')
    footer_column = fields.Selection([
        ('company', 'Entreprise'),
        ('help', 'Aide'),
        ('legal', 'Légal'),
    ], string='Colonne footer')
    
    show_in_menu = fields.Boolean('Afficher dans menu', default=False)
    menu_position = fields.Integer('Position menu', default=100)

    # Statistiques
    views_count = fields.Integer('Vues', default=0, readonly=True)
    last_viewed = fields.Datetime('Dernière visite', readonly=True)

    # Dates
    published_date = fields.Datetime('Date publication', default=fields.Datetime.now)
    updated_date = fields.Datetime('Dernière modification', readonly=True)

    _sql_constraints = [
        ('unique_slug', 'UNIQUE(slug)', 'Le slug doit être unique'),
    ]

    @api.constrains('slug')
    def _check_slug(self):
        for page in self:
            if page.slug:
                # Vérifier format slug (lettres minuscules, chiffres, tirets uniquement)
                if not re.match(r'^[a-z0-9-]+$', page.slug):
                    raise ValidationError(_('Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'))
                
                # Vérifier slugs réservés
                reserved_slugs = ['api', 'admin', 'cart', 'checkout', 'products', 'categories', 
                                 'account', 'search', 'login', 'logout', 'register']
                if page.slug in reserved_slugs:
                    raise ValidationError(_('Ce slug est réservé : %s') % page.slug)

    @api.model
    def create(self, vals):
        # Auto-générer slug depuis name si non fourni
        if not vals.get('slug') and vals.get('name'):
            vals['slug'] = self._generate_slug(vals['name'])
        
        # Auto-remplir meta_title si vide
        if not vals.get('meta_title') and vals.get('title'):
            vals['meta_title'] = vals['title'][:60]
        
        return super().create(vals)

    def write(self, vals):
        vals['updated_date'] = fields.Datetime.now()
        return super().write(vals)

    def _generate_slug(self, name):
        """Générer un slug depuis le nom"""
        slug = name.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')
        
        # Vérifier unicité
        counter = 1
        original_slug = slug
        while self.search([('slug', '=', slug)], limit=1):
            slug = f'{original_slug}-{counter}'
            counter += 1
        
        return slug

    def increment_views(self):
        """Incrémenter compteur de vues"""
        self.ensure_one()
        self.sudo().write({
            'views_count': self.views_count + 1,
            'last_viewed': fields.Datetime.now()
        })

    @api.model
    def get_by_slug(self, slug):
        """Récupérer page par slug pour frontend"""
        page = self.search([('slug', '=', slug), ('active', '=', True)], limit=1)
        if page:
            page.increment_views()
            return {
                'id': page.id,
                'title': page.title,
                'subtitle': page.subtitle,
                'content': page.content,
                'layout': page.layout,
                'show_sidebar': page.show_sidebar,
                'sidebar_content': page.sidebar_content,
                'header_image_url': page.header_image_url,
                'show_header_image': page.show_header_image,
                'meta_title': page.meta_title or page.title,
                'meta_description': page.meta_description,
                'published_date': page.published_date.isoformat() if page.published_date else None,
                'updated_date': page.updated_date.isoformat() if page.updated_date else None,
            }
        return None

    @api.model
    def get_footer_links(self):
        """Récupérer pages à afficher dans footer"""
        pages = self.search([
            ('active', '=', True),
            ('show_in_footer', '=', True)
        ])
        
        links_by_column = {
            'company': [],
            'help': [],
            'legal': [],
        }
        
        for page in pages:
            if page.footer_column and page.footer_column in links_by_column:
                links_by_column[page.footer_column].append({
                    'title': page.title,
                    'slug': page.slug,
                })
        
        return links_by_column
