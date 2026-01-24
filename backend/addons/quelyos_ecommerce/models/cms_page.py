# -*- coding: utf-8 -*-

import re
import unicodedata
from odoo import models, fields, api


class CmsPage(models.Model):
    """
    Page CMS statique avec support SEO complet.
    Inspiré de WordPress : pages avec éditeur WYSIWYG, templates, et métadonnées SEO.
    """
    _name = 'cms.page'
    _description = 'Page CMS'
    _order = 'sequence, name'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # Informations principales
    name = fields.Char(
        string='Titre',
        required=True,
        tracking=True,
        translate=True
    )
    slug = fields.Char(
        string='Slug URL',
        required=True,
        index=True,
        copy=False,
        help="Identifiant URL unique (ex: about-us, contact)"
    )

    # Contenu
    content = fields.Html(
        string='Contenu',
        sanitize=False,
        translate=True,
        help="Contenu principal de la page (HTML)"
    )
    excerpt = fields.Text(
        string='Extrait',
        translate=True,
        help="Résumé court pour les aperçus et listes"
    )

    # Template de page
    template = fields.Selection([
        ('standard', 'Page standard'),
        ('landing', 'Landing page'),
        ('contact', 'Page contact (avec formulaire)'),
        ('faq', 'FAQ (accordéon)'),
        ('sidebar_left', 'Sidebar gauche'),
        ('sidebar_right', 'Sidebar droite'),
        ('full_width', 'Pleine largeur'),
    ], string='Template', default='standard', required=True)

    # Publication
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('scheduled', 'Planifié'),
        ('published', 'Publié'),
        ('archived', 'Archivé'),
    ], string='Statut', default='draft', tracking=True, index=True)

    publish_date = fields.Datetime(
        string='Date de publication',
        help="Date à partir de laquelle la page est visible"
    )
    unpublish_date = fields.Datetime(
        string='Date de dépublication',
        help="Date à partir de laquelle la page n'est plus visible"
    )

    # SEO - Meta tags
    meta_title = fields.Char(
        string='Meta titre',
        translate=True,
        help="Titre pour les moteurs de recherche (60 caractères max)"
    )
    meta_description = fields.Text(
        string='Meta description',
        translate=True,
        help="Description pour les moteurs de recherche (160 caractères max)"
    )
    meta_keywords = fields.Char(
        string='Meta mots-clés',
        help="Mots-clés séparés par des virgules"
    )
    canonical_url = fields.Char(
        string='URL canonique',
        help="URL canonique si différente de l'URL par défaut"
    )
    robots_index = fields.Boolean(
        string='Autoriser l\'indexation',
        default=True,
        help="Permettre aux moteurs de recherche d'indexer cette page"
    )
    robots_follow = fields.Boolean(
        string='Suivre les liens',
        default=True,
        help="Permettre aux moteurs de recherche de suivre les liens"
    )

    # SEO - Open Graph
    og_title = fields.Char(
        string='OG Title',
        translate=True,
        help="Titre pour les réseaux sociaux"
    )
    og_description = fields.Text(
        string='OG Description',
        translate=True,
        help="Description pour les réseaux sociaux"
    )
    og_image = fields.Binary(
        string='OG Image',
        help="Image pour les réseaux sociaux (1200x630 recommandé)"
    )
    og_image_url = fields.Char(
        string='OG Image URL',
        help="URL externe de l'image OG (alternative au champ binaire)"
    )

    # Hiérarchie (pages parentes)
    parent_id = fields.Many2one(
        'cms.page',
        string='Page parente',
        ondelete='set null',
        index=True
    )
    child_ids = fields.One2many(
        'cms.page',
        'parent_id',
        string='Sous-pages'
    )

    # Mise en page
    show_title = fields.Boolean(
        string='Afficher le titre',
        default=True
    )
    show_breadcrumb = fields.Boolean(
        string='Afficher le fil d\'Ariane',
        default=True
    )
    header_image = fields.Binary(
        string='Image header',
        help="Image affichée en haut de la page"
    )
    header_image_url = fields.Char(
        string='URL Image header',
        help="URL externe de l'image header"
    )

    # Blocs de contenu
    block_ids = fields.One2many(
        'cms.page.block',
        'page_id',
        string='Blocs de contenu'
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

    # Statistiques
    view_count = fields.Integer(
        string='Nombre de vues',
        default=0,
        readonly=True
    )

    _sql_constraints = [
        ('slug_unique', 'unique(slug)', 'Le slug doit être unique!')
    ]

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get('slug') and vals.get('name'):
                vals['slug'] = self._generate_slug(vals['name'])
        return super().create(vals_list)

    def write(self, vals):
        if 'name' in vals and 'slug' not in vals:
            for record in self:
                if not record.slug:
                    vals['slug'] = self._generate_slug(vals['name'])
        return super().write(vals)

    def _generate_slug(self, name):
        """Génère un slug SEO-friendly à partir du nom."""
        # Normaliser les caractères accentués
        slug = unicodedata.normalize('NFKD', name.lower())
        slug = slug.encode('ascii', 'ignore').decode('ascii')
        # Remplacer les caractères non alphanumériques par des tirets
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        # Supprimer les tirets en début/fin
        slug = slug.strip('-')
        # Vérifier l'unicité
        base_slug = slug
        counter = 1
        while self.search_count([('slug', '=', slug)]) > 0:
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    @api.model
    def get_published_page(self, slug):
        """
        Récupère une page publiée par son slug.
        Vérifie les dates de publication/dépublication.
        """
        now = fields.Datetime.now()
        domain = [
            ('slug', '=', slug),
            ('state', '=', 'published'),
            ('active', '=', True),
            '|', ('publish_date', '=', False), ('publish_date', '<=', now),
            '|', ('unpublish_date', '=', False), ('unpublish_date', '>', now),
        ]
        return self.search(domain, limit=1)

    def increment_view_count(self):
        """Incrémente le compteur de vues."""
        for page in self:
            page.sudo().write({'view_count': page.view_count + 1})

    def action_publish(self):
        """Publie la page."""
        self.write({
            'state': 'published',
            'publish_date': fields.Datetime.now()
        })

    def action_unpublish(self):
        """Dépublie la page (retour en brouillon)."""
        self.write({'state': 'draft'})

    def action_archive(self):
        """Archive la page."""
        self.write({'state': 'archived'})

    def get_page_data(self):
        """Retourne les données complètes de la page pour l'API."""
        self.ensure_one()
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url', '')

        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'content': self.content or '',
            'excerpt': self.excerpt or '',
            'template': self.template,
            'show_title': self.show_title,
            'show_breadcrumb': self.show_breadcrumb,
            'header_image_url': self.header_image_url or (
                f'{base_url}/web/image/cms.page/{self.id}/header_image' if self.header_image else None
            ),
            'seo': self._get_seo_data(),
            'blocks': self._get_blocks_by_zone(),
            'breadcrumbs': self._get_breadcrumbs(),
            'parent': {
                'id': self.parent_id.id,
                'name': self.parent_id.name,
                'slug': self.parent_id.slug
            } if self.parent_id else None,
            'children': [{
                'id': c.id,
                'name': c.name,
                'slug': c.slug
            } for c in self.child_ids.filtered('active')],
        }

    def _get_seo_data(self):
        """Retourne les données SEO de la page."""
        self.ensure_one()
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url', '')

        robots_parts = []
        robots_parts.append('index' if self.robots_index else 'noindex')
        robots_parts.append('follow' if self.robots_follow else 'nofollow')

        return {
            'meta_title': self.meta_title or self.name,
            'meta_description': self.meta_description or self.excerpt or '',
            'meta_keywords': self.meta_keywords or '',
            'canonical_url': self.canonical_url or f'/pages/{self.slug}',
            'robots': ', '.join(robots_parts),
            'og_title': self.og_title or self.meta_title or self.name,
            'og_description': self.og_description or self.meta_description or self.excerpt or '',
            'og_image': self.og_image_url or (
                f'{base_url}/web/image/cms.page/{self.id}/og_image' if self.og_image else None
            ),
            'og_type': 'article',
        }

    def _get_blocks_by_zone(self):
        """Retourne les blocs de la page groupés par zone."""
        blocks_by_zone = {}
        for pb in self.block_ids.filtered('active').sorted('sequence'):
            zone = pb.zone
            if zone not in blocks_by_zone:
                blocks_by_zone[zone] = []
            blocks_by_zone[zone].append(pb.block_id.get_block_data())
        return blocks_by_zone

    def _get_breadcrumbs(self):
        """Construit le fil d'Ariane de la page."""
        breadcrumbs = [{'name': 'Accueil', 'url': '/'}]

        # Remonter la hiérarchie des pages parentes
        parents = []
        current = self.parent_id
        while current:
            parents.insert(0, current)
            current = current.parent_id

        for parent in parents:
            breadcrumbs.append({
                'name': parent.name,
                'url': f'/pages/{parent.slug}'
            })

        breadcrumbs.append({
            'name': self.name,
            'url': f'/pages/{self.slug}'
        })

        return breadcrumbs

    def get_page_summary(self):
        """Retourne un résumé de la page (pour les listes)."""
        self.ensure_one()
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'excerpt': self.excerpt,
            'template': self.template,
            'publish_date': self.publish_date.isoformat() if self.publish_date else None,
        }
