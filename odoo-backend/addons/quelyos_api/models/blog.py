# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError
from odoo.tools.translate import _
import re


class BlogCategory(models.Model):
    _name = 'quelyos.blog.category'
    _description = 'Catégorie Blog'
    _order = 'sequence, name'

    name = fields.Char('Nom', required=True, translate=True)
    slug = fields.Char('Slug', required=True, index=True)
    description = fields.Text('Description', translate=True)
    color = fields.Char('Couleur', default='#3b82f6')
    sequence = fields.Integer('Ordre', default=10)
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company,
        index=True
    )
    post_ids = fields.One2many('quelyos.blog.post', 'category_id', string='Articles')
    post_count = fields.Integer('Nb articles', compute='_compute_post_count', store=True)
    @api.depends('post_ids')

    @api.constrains('slug', 'company_id')
    def _check_unique_slug_company(self):
        """Contrainte: Le slug doit être unique par société"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('slug', '=', record.slug),
                ('company_id', '=', record.company_id),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Le slug doit être unique par société'))


    def _compute_post_count(self):
        for cat in self:
            cat.post_count = len(cat.post_ids.filtered(lambda p: p.state == 'published'))

    def to_dict(self):
        self.ensure_one()
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'color': self.color,
            'postCount': self.post_count,
        }


class BlogPost(models.Model):
    _name = 'quelyos.blog.post'
    _description = 'Article Blog'
    _order = 'published_date desc, create_date desc'
    _inherit = ['mail.thread']

    # Contenu
    title = fields.Char('Titre', required=True, translate=True)
    slug = fields.Char('Slug', required=True, index=True)
    excerpt = fields.Text('Extrait', translate=True, help="Résumé affiché dans les listes")
    content = fields.Html('Contenu', required=True, translate=True)

    # Visuels
    cover_image = fields.Binary('Image couverture', attachment=True)
    cover_image_alt = fields.Char('Alt image')

    # Classification
    category_id = fields.Many2one(
        'quelyos.blog.category',
        string='Catégorie',
        required=True
    )
    tag_ids = fields.Many2many(
        'quelyos.blog.tag',
        string='Tags'
    )

    # Auteur
    author_id = fields.Many2one(
        'res.users',
        string='Auteur',
        default=lambda self: self.env.user
    )
    author_name = fields.Char(related='author_id.name', string='Nom auteur')

    # Publication
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('published', 'Publié'),
        ('archived', 'Archivé'),
    ], string='Statut', default='draft', tracking=True)
    published_date = fields.Datetime('Date publication')

    # Configuration
    company_id = fields.Many2one(
        related='category_id.company_id',
        store=True,
        index=True
    )
    allow_comments = fields.Boolean('Autoriser commentaires', default=True)
    is_featured = fields.Boolean('Mise en avant', default=False)

    # Produits liés (optionnel)
    product_ids = fields.Many2many(
        'product.template',
        string='Produits liés'
    )

    # SEO
    meta_title = fields.Char('Meta Title')
    meta_description = fields.Text('Meta Description')

    # Stats
    views_count = fields.Integer('Vues', default=0)
    reading_time = fields.Integer('Temps lecture (min)', compute='_compute_reading_time', store=True)
    @api.depends('content')
    def _compute_reading_time(self):
        for post in self:
            if post.content:
                # Environ 200 mots par minute
                word_count = len(re.findall(r'\w+', post.content))
                post.reading_time = max(1, round(word_count / 200))
            else:
                post.reading_time = 1

    def action_publish(self):
        self.write({
            'state': 'published',
            'published_date': fields.Datetime.now(),
        })

    def action_archive(self):
        self.write({'state': 'archived'})

    def get_cover_url(self):
        self.ensure_one()
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        if self.cover_image:
            return f'{base_url}/web/image/quelyos.blog.post/{self.id}/cover_image'
        return None

    def to_dict(self, include_content=True):
        self.ensure_one()
        data = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'excerpt': self.excerpt,
            'coverUrl': self.get_cover_url(),
            'categoryId': self.category_id.id,
            'categoryName': self.category_id.name,
            'authorName': self.author_name,
            'state': self.state,
            'publishedDate': self.published_date.isoformat() if self.published_date else None,
            'isFeatured': self.is_featured,
            'viewsCount': self.views_count,
            'readingTime': self.reading_time,
            'tags': [{'id': t.id, 'name': t.name} for t in self.tag_ids],
        }
        if include_content:
            data['content'] = self.content
        return data


class BlogTag(models.Model):
    _name = 'quelyos.blog.tag'
    _description = 'Tag Blog'

    name = fields.Char('Nom', required=True, translate=True)
    slug = fields.Char('Slug', required=True)
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company
    )
